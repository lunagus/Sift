from bs4 import BeautifulSoup, Tag
import pandas as pd
from typing import List, Dict, Tuple, Optional
import re
from collections import defaultdict, Counter


def extract_grid_rows(html: str) -> pd.DataFrame:
    """
    Universal grid extractor that finds the most repeated div structure
    and extracts it as tabular data.

    Args:
        html: Raw HTML string

    Returns:
        DataFrame with extracted grid data
    """
    soup = BeautifulSoup(html, "lxml")

    # Find all divs and group by class name
    divs = soup.find_all("div")
    class_groups = defaultdict(list)

    for div in divs:
        class_name = " ".join(sorted(div.get("class", [])))
        if class_name:
            class_groups[class_name].append(div)

    # Find the most repeated class group (likely the "row" structure)
    if not class_groups:
        return pd.DataFrame()

    main_group = max(class_groups.values(), key=len)

    # If we don't have enough repeated structures, try alternative approaches
    if len(main_group) < 3:
        return _extract_alternative_grid(soup)

    rows = []
    for div in main_group:
        row_data = {}
        for child in div.find_all(recursive=False):
            key = " ".join(sorted(child.get("class", []))) or child.name
            val = child.get_text(strip=True)
            if val:
                row_data[key] = val
        if row_data:
            rows.append(row_data)

    return pd.DataFrame(rows)


def _extract_alternative_grid(soup: BeautifulSoup) -> pd.DataFrame:
    """
    Alternative grid extraction methods when the main approach fails.
    """
    # Method 1: Look for repeated structures by tag patterns
    rows = _extract_by_tag_patterns(soup)
    if not rows.empty:
        return rows

    # Method 2: Look for common parent-child relationships
    rows = _extract_by_parent_child_patterns(soup)
    if not rows.empty:
        return rows

    # Method 3: Look for data attributes or specific patterns
    rows = _extract_by_data_attributes(soup)
    if not rows.empty:
        return rows

    return pd.DataFrame()


def _extract_by_tag_patterns(soup: BeautifulSoup) -> pd.DataFrame:
    """
    Extract grid data by looking for repeated tag patterns.
    """
    # Find all elements with classes
    elements_with_classes = soup.find_all(attrs={"class": True})

    # Group by tag name and class pattern
    pattern_groups = defaultdict(list)

    for elem in elements_with_classes:
        tag_name = elem.name
        classes = " ".join(sorted(elem.get("class", [])))
        pattern = f"{tag_name}.{classes}" if classes else tag_name
        pattern_groups[pattern].append(elem)

    # Find the most common pattern with multiple instances
    common_patterns = [
        (pattern, elems) for pattern, elems in pattern_groups.items() if len(elems) >= 3
    ]

    if not common_patterns:
        return pd.DataFrame()

    # Sort by number of instances
    common_patterns.sort(key=lambda x: len(x[1]), reverse=True)

    # Try to extract from the most common pattern
    for pattern, elements in common_patterns:
        rows = []
        for elem in elements:
            row_data = {}

            # Get text from the element itself
            text = elem.get_text(strip=True)
            if text:
                row_data["text"] = text

            # Get attributes
            for attr, value in elem.attrs.items():
                if attr != "class" and isinstance(value, (str, list)):
                    if isinstance(value, list):
                        value = " ".join(value)
                    row_data[f"attr_{attr}"] = value

            # Get text from direct children
            for child in elem.find_all(recursive=False):
                child_text = child.get_text(strip=True)
                if child_text:
                    child_key = f"child_{child.name}"
                    if child_key in row_data:
                        child_key = f"child_{child.name}_{len([k for k in row_data.keys() if k.startswith(child_key)])}"
                    row_data[child_key] = child_text

            if row_data:
                rows.append(row_data)

        if len(rows) >= 3:
            return pd.DataFrame(rows)

    return pd.DataFrame()


def _extract_by_parent_child_patterns(soup: BeautifulSoup) -> pd.DataFrame:
    """
    Extract grid data by looking for common parent-child relationships.
    """
    # Find containers that have multiple similar children
    containers = soup.find_all("div", recursive=True)

    for container in containers:
        children = container.find_all(recursive=False)
        if len(children) < 3:
            continue

        # Check if children have similar structures
        child_patterns = []
        for child in children:
            pattern = _get_element_pattern(child)
            child_patterns.append(pattern)

        # If we have repeated patterns, extract data
        pattern_counts = Counter(child_patterns)
        if max(pattern_counts.values()) >= 3:
            rows = []
            for child in children:
                row_data = _extract_element_data(child)
                if row_data:
                    rows.append(row_data)

            if len(rows) >= 3:
                return pd.DataFrame(rows)

    return pd.DataFrame()


def _extract_by_data_attributes(soup: BeautifulSoup) -> pd.DataFrame:
    """
    Extract grid data by looking for data attributes or specific patterns.
    """
    # Look for elements with data attributes
    data_elements = soup.find_all(attrs={"data-": True})

    if len(data_elements) >= 3:
        rows = []
        for elem in data_elements:
            row_data = {}

            # Extract data attributes
            for attr, value in elem.attrs.items():
                if attr.startswith("data-"):
                    key = attr.replace("data-", "")
                    row_data[key] = value

            # Extract text
            text = elem.get_text(strip=True)
            if text:
                row_data["text"] = text

            if row_data:
                rows.append(row_data)

        if len(rows) >= 3:
            return pd.DataFrame(rows)

    return pd.DataFrame()


def _get_element_pattern(elem: Tag) -> str:
    """
    Get a pattern representation of an element for comparison.
    """
    tag_name = elem.name
    classes = " ".join(sorted(elem.get("class", [])))
    children = [child.name for child in elem.find_all(recursive=False)]
    children_str = ".".join(sorted(children)) if children else "no_children"

    return f"{tag_name}.{classes}.{children_str}"


def _extract_element_data(elem: Tag) -> Dict[str, str]:
    """
    Extract all relevant data from an element.
    """
    data = {}

    # Get text content
    text = elem.get_text(strip=True)
    if text:
        data["text"] = text

    # Get attributes
    for attr, value in elem.attrs.items():
        if isinstance(value, (str, list)):
            if isinstance(value, list):
                value = " ".join(value)
            data[attr] = value

    # Get text from direct children
    for child in elem.find_all(recursive=False):
        child_text = child.get_text(strip=True)
        if child_text:
            child_key = f"{child.name}_text"
            if child_key in data:
                child_key = f"{child.name}_text_{len([k for k in data.keys() if k.startswith(f'{child.name}_text')])}"
            data[child_key] = child_text

    return data


def extract_grid_items(soup: BeautifulSoup) -> list[dict]:
    """
    Legacy function for backward compatibility.
    Now uses the robust universal grid extractor.
    """
    # Convert soup to HTML string and use the new extractor
    html = str(soup)
    df = extract_grid_rows(html)

    if df.empty:
        return []

    # Convert DataFrame to list of dicts
    return df.to_dict(orient="records")


def extract_advanced_grid(
    html: str, min_rows: int = 3, min_columns: int = 2
) -> pd.DataFrame:
    """
    Advanced grid extractor with configurable thresholds and multiple strategies.

    Args:
        html: Raw HTML string
        min_rows: Minimum number of rows to consider it a valid grid
        min_columns: Minimum number of columns to consider it a valid grid

    Returns:
        DataFrame with extracted grid data
    """
    soup = BeautifulSoup(html, "lxml")

    # Strategy 1: Universal div structure extraction
    df = extract_grid_rows(html)
    if len(df) >= min_rows and len(df.columns) >= min_columns:
        return df

    # Strategy 2: Look for specific grid patterns
    df = _extract_specific_grid_patterns(soup, min_rows, min_columns)
    if not df.empty:
        return df

    # Strategy 3: Extract from any repeated structure
    df = _extract_any_repeated_structure(soup, min_rows, min_columns)
    if not df.empty:
        return df

    return pd.DataFrame()


def _extract_specific_grid_patterns(
    soup: BeautifulSoup, min_rows: int, min_columns: int
) -> pd.DataFrame:
    """
    Extract from common grid patterns found on various websites.
    """
    # Common grid selectors
    grid_selectors = [
        "div[class*='row']",
        "div[class*='item']",
        "div[class*='card']",
        "div[class*='listing']",
        "div[class*='product']",
        "div[class*='result']",
        "li[class*='item']",
        "tr",  # Table rows
        "div[class*='entry']",
        "div[class*='post']",
        "div[class*='article']",
    ]

    for selector in grid_selectors:
        elements = soup.select(selector)
        if len(elements) >= min_rows:
            rows = []
            for elem in elements:
                row_data = _extract_comprehensive_element_data(elem)
                if row_data:
                    rows.append(row_data)

            if len(rows) >= min_rows:
                df = pd.DataFrame(rows)
                if len(df.columns) >= min_columns:
                    return df

    return pd.DataFrame()


def _extract_any_repeated_structure(
    soup: BeautifulSoup, min_rows: int, min_columns: int
) -> pd.DataFrame:
    """
    Extract from any repeated structure by analyzing the DOM tree.
    """
    # Find all elements with text content
    text_elements = []
    for elem in soup.find_all():
        text = elem.get_text(strip=True)
        if text and len(text) > 3:  # Filter out very short text
            text_elements.append(elem)

    # Group elements by their structural similarity
    structure_groups = defaultdict(list)

    for elem in text_elements:
        # Create a structural signature
        signature = _create_structural_signature(elem)
        structure_groups[signature].append(elem)

    # Find the most common structure
    if structure_groups:
        most_common_signature = max(
            structure_groups.keys(), key=lambda k: len(structure_groups[k])
        )
        elements = structure_groups[most_common_signature]

        if len(elements) >= min_rows:
            rows = []
            for elem in elements:
                row_data = _extract_comprehensive_element_data(elem)
                if row_data:
                    rows.append(row_data)

            if len(rows) >= min_rows:
                df = pd.DataFrame(rows)
                if len(df.columns) >= min_columns:
                    return df

    return pd.DataFrame()


def _create_structural_signature(elem: Tag) -> str:
    """
    Create a signature that represents the structure of an element.
    """
    tag_name = elem.name
    classes = " ".join(sorted(elem.get("class", [])))

    # Get direct children structure
    children = []
    for child in elem.find_all(recursive=False):
        child_signature = f"{child.name}.{'.'.join(sorted(child.get('class', [])))}"
        children.append(child_signature)

    children_str = "|".join(sorted(children)) if children else "no_children"

    return f"{tag_name}.{classes}.{children_str}"


def _extract_comprehensive_element_data(elem: Tag) -> Dict[str, str]:
    """
    Extract comprehensive data from an element including nested content.
    """
    data = {}

    # Get main text
    text = elem.get_text(strip=True)
    if text:
        data["text"] = text

    # Get attributes
    for attr, value in elem.attrs.items():
        if isinstance(value, (str, list)):
            if isinstance(value, list):
                value = " ".join(value)
            data[attr] = value

    # Get text from specific child elements
    for tag_name in ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "div"]:
        children = elem.find_all(tag_name, recursive=False)
        for i, child in enumerate(children):
            child_text = child.get_text(strip=True)
            if child_text:
                key = f"{tag_name}_{i + 1}" if len(children) > 1 else tag_name
                data[key] = child_text

    # Get links
    links = elem.find_all("a", href=True)
    for i, link in enumerate(links):
        href = link.get("href", "")
        text = link.get_text(strip=True)
        if href:
            data[f"link_{i + 1}_url"] = href
        if text:
            data[f"link_{i + 1}_text"] = text

    # Get images
    images = elem.find_all("img")
    for i, img in enumerate(images):
        src = img.get("src", "")
        alt = img.get("alt", "")
        if src:
            data[f"image_{i + 1}_src"] = src
        if alt:
            data[f"image_{i + 1}_alt"] = alt

    return data


def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize column names to be more user-friendly.

    Args:
        df: DataFrame with extracted grid data

    Returns:
        DataFrame with normalized column names
    """
    if df.empty:
        return df

    new_columns = {}
    for col in df.columns:
        normalized = _normalize_column_name(col)
        new_columns[col] = normalized

    df_renamed = df.rename(columns=new_columns)
    return df_renamed


def _normalize_column_name(column_name: str) -> str:
    """
    Convert a column name to a more readable format.
    """
    # Remove common prefixes and suffixes
    name = column_name.lower()

    # Replace common patterns
    replacements = {
        "class": "type",
        "attr_": "",
        "child_": "",
        "_text": "",
        "link_1_url": "url",
        "link_1_text": "link_text",
        "image_1_src": "image",
        "image_1_alt": "image_alt",
        "h1": "title",
        "h2": "subtitle",
        "h3": "heading",
        "p": "description",
        "span": "text",
        "a": "link",
        "div": "content",
    }

    for old, new in replacements.items():
        if name.startswith(old):
            name = name.replace(old, new, 1)
            break

    # Clean up the name
    name = re.sub(
        r"[_\s]+", " ", name
    )  # Replace underscores and multiple spaces with single space
    name = name.strip()
    name = name.title()  # Capitalize words

    # Handle empty or very short names
    if not name or len(name) < 2:
        name = f"Column_{column_name}"

    return name


def suggest_column_mappings(df: pd.DataFrame) -> dict:
    """
    Suggest user-friendly column mappings based on content analysis.

    Args:
        df: DataFrame with extracted grid data

    Returns:
        Dictionary mapping original column names to suggested friendly names
    """
    if df.empty:
        return {}

    suggestions = {}

    for col in df.columns:
        # Analyze the column content to suggest better names
        sample_values = df[col].dropna().head(10).astype(str)

        # Look for patterns in the data
        if any("http" in val for val in sample_values):
            suggestions[col] = "URL"
        elif any("@" in val for val in sample_values):
            suggestions[col] = "Email"
        elif any(re.match(r"^\d+$", val) for val in sample_values):
            suggestions[col] = "ID"
        elif any(len(val) > 100 for val in sample_values):
            suggestions[col] = "Description"
        elif any(val.isupper() for val in sample_values):
            suggestions[col] = "Title"
        else:
            # Use the normalized name
            suggestions[col] = _normalize_column_name(col)

    return suggestions


def extract_grid_with_mapping(html: str) -> dict:
    """
    Extract grid data with column mapping suggestions.

    Args:
        html: Raw HTML string

    Returns:
        Dictionary containing DataFrame and column mapping suggestions
    """
    df = extract_grid_rows(html)

    if df.empty:
        return {"data": df, "suggestions": {}, "normalized_data": df}

    # Get column mapping suggestions
    suggestions = suggest_column_mappings(df)

    # Create normalized version
    normalized_df = normalize_column_names(df)

    return {"data": df, "suggestions": suggestions, "normalized_data": normalized_df}
