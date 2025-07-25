from bs4 import BeautifulSoup
from core.content_classifier import classify_content_type
from core.content_types import ContentType
from core.table_extractor import extract_tables
from core.grid_extractor import (
    extract_grid_items,
    extract_advanced_grid,
    extract_grid_rows,
    extract_grid_with_mapping,
    normalize_column_names,
)
from core.article_extractor import extract_article
from core.field_normalizer import normalize_fields
from core.filter_engine import remove_unwanted_blocks
import json
import pandas as pd
import numpy as np
import math


def extract_json_ld(soup: BeautifulSoup) -> list:
    json_ld_blocks = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            if script.string:
                data = json.loads(script.string)
                json_ld_blocks.append(data)
        except Exception:
            continue
    return json_ld_blocks


def flatten_dict(d, parent_key="", sep="_"):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            # If list of dicts, flatten each with index
            if all(isinstance(i, dict) for i in v):
                for idx, subdict in enumerate(v):
                    items.extend(
                        flatten_dict(subdict, f"{new_key}{sep}{idx}", sep=sep).items()
                    )
            else:
                # Join list of primitives
                items.append((new_key, ", ".join(str(i) for i in v)))
        else:
            items.append((new_key, v))
    return dict(items)


def normalize_jsonld_items(items: list) -> list:
    records = []
    for itm in items:
        if not isinstance(itm, dict):
            continue
        flat = flatten_dict(itm)
        records.append(flat)

    # Remove rows where all values are None, empty string, or '-'
    def is_not_empty(row):
        return any(v not in (None, "", "-") for v in row.values())

    filtered = [row for row in records if is_not_empty(row)]
    return filtered


def clean_for_json(obj):
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    else:
        return obj


def flatten_jsonld_blocks(blocks):
    for block in blocks:
        if isinstance(block, dict):
            yield block
        elif isinstance(block, list):
            for subblock in block:
                if isinstance(subblock, dict):
                    yield subblock


def extract_structured_content(html: str, url: str = None) -> dict:
    soup = BeautifulSoup(html, "lxml")
    soup = remove_unwanted_blocks(soup)
    types = classify_content_type(soup)
    result = {}

    # Extract tables if present
    if ContentType.TABLE in types:
        tables = extract_tables(soup)
        result["tables"] = [
            normalize_fields(df.to_dict(orient="records")) for df in tables
        ]
        # Clean tables for JSON compliance
        result["tables"] = clean_for_json(result["tables"])

    # Extract JSON-LD data
    json_ld_blocks = extract_json_ld(soup)
    flat_json_ld_blocks = list(flatten_jsonld_blocks(json_ld_blocks))
    result["json_ld"] = json_ld_blocks
    result["normalized_jsonld"] = normalize_jsonld_items(
        [
            item
            for block in flat_json_ld_blocks
            for item in (
                block.get("itemListElement", [])
                if block.get("@type") == "ItemList"
                else [block]
            )
            if isinstance(item, dict)
            and (
                item.get("@type") != "ListItem"
                or "item" not in item
                or isinstance(item["item"], dict)
            )
        ]
        + [
            item["item"]
            for block in flat_json_ld_blocks
            if block.get("@type") == "ItemList"
            for item in block.get("itemListElement", [])
            if isinstance(item, dict)
            and "item" in item
            and isinstance(item["item"], dict)
        ]
    )
    result["normalized_jsonld"] = clean_for_json(result["normalized_jsonld"])

    # Extract article content if present
    if ContentType.ARTICLE in types:
        result["article"] = extract_article(html, url)

    # Extract grid data using multiple strategies
    grid_data = _extract_comprehensive_grid_data(soup, html, types)
    if grid_data:
        result.update(grid_data)
        # Clean all grid-related fields for JSON compliance
        for key in [
            "listings",
            "universal_grid",
            "advanced_grid",
            "lenient_grid",
            "normalized_grid",
        ]:
            if key in result:
                result[key] = clean_for_json(result[key])

    result["raw_html"] = html
    return result


def _extract_comprehensive_grid_data(
    soup: BeautifulSoup, html: str, types: list
) -> dict:
    """
    Extract grid data using multiple strategies for maximum coverage.
    """
    grid_data = {}

    # Strategy 1: Use the legacy grid extractor for backward compatibility
    if ContentType.DIV_GRID in types or ContentType.GRID in types:
        legacy_grids = extract_grid_items(soup)
        if legacy_grids:
            grid_data["listings"] = normalize_fields(legacy_grids)

    # Strategy 2: Use the new universal grid extractor with mapping
    grid_with_mapping = extract_grid_with_mapping(html)
    if not grid_with_mapping["data"].empty and len(grid_with_mapping["data"]) >= 3:
        grid_data["universal_grid"] = normalize_fields(
            grid_with_mapping["data"].to_dict(orient="records")
        )
        grid_data["column_mappings"] = grid_with_mapping["suggestions"]
        grid_data["normalized_grid"] = normalize_fields(
            grid_with_mapping["normalized_data"].to_dict(orient="records")
        )

    # Strategy 3: Use the advanced grid extractor with different thresholds
    advanced_df = extract_advanced_grid(html, min_rows=2, min_columns=1)
    if not advanced_df.empty and len(advanced_df) >= 2:
        # Normalize column names for better UX
        normalized_advanced_df = normalize_column_names(advanced_df)
        grid_data["advanced_grid"] = normalize_fields(
            normalized_advanced_df.to_dict(orient="records")
        )

    # Strategy 4: Try with even more lenient thresholds for edge cases
    if not grid_data:  # Only if we haven't found anything yet
        lenient_df = extract_advanced_grid(html, min_rows=1, min_columns=1)
        if not lenient_df.empty:
            normalized_lenient_df = normalize_column_names(lenient_df)
            grid_data["lenient_grid"] = normalize_fields(
                normalized_lenient_df.to_dict(orient="records")
            )

    # Combine all grid data into a single listings field if multiple sources found
    all_listings = []
    for key, data in grid_data.items():
        if key not in ["listings", "column_mappings", "normalized_grid"] and isinstance(
            data, list
        ):
            all_listings.extend(data)

    if all_listings:
        # Remove duplicates based on text content
        seen = set()
        unique_listings = []
        for item in all_listings:
            # Create a signature based on text content
            text_signature = " ".join(str(v) for v in item.values() if v)
            if text_signature not in seen:
                seen.add(text_signature)
                unique_listings.append(item)

        grid_data["listings"] = unique_listings

    return grid_data
