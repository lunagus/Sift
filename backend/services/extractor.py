import httpx
from bs4 import BeautifulSoup
import pandas as pd
import trafilatura
from core.table_indexer import profile_table
from core.block_classifier import classify_table
from core.network_utils import get_random_user_agent, SimpleRateLimiter
from services.playwright_scraper import fetch_page_content_playwright
import numpy as np
from bs4 import Tag

# Global rate limiter for all outgoing requests (configurable)
http_rate_limiter = SimpleRateLimiter(max_calls=5, period=1.0)  # 5 requests per second


def fetch_page_content(url: str, method: str = "httpx") -> str:
    if method == "playwright":
        return fetch_page_content_playwright(url)
    # Default: httpx
    http_rate_limiter.acquire()
    headers = {"User-Agent": get_random_user_agent()}
    with httpx.Client(follow_redirects=True, timeout=30, headers=headers) as client:
        resp = client.get(url)
        resp.raise_for_status()
        return resp.text


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.where(pd.notnull(df), None)
    return df


def extract_tables_with_metadata(html: str, source_url: str = None):
    soup = BeautifulSoup(html, "lxml")
    tables = soup.find_all("table")
    profiled_tables = []
    for table in tables:
        try:
            df = pd.read_html(str(table))[0]
            df = clean_dataframe(df)
            content_type = classify_table(df)
            meta = profile_table(df, source_url=source_url, content_type=content_type)
            meta["dataframe"] = (
                df  # Optionally include the DataFrame for downstream filtering
            )
            profiled_tables.append(meta)
        except Exception:
            continue
    return profiled_tables


def extract_tables(html: str):
    soup = BeautifulSoup(html, "lxml")
    tables = soup.find_all("table")
    dfs = []
    for table in tables:
        try:
            df = pd.read_html(str(table))[0]
            df = clean_dataframe(df)
            dfs.append(df)
        except Exception:
            continue
    return dfs


def extract_main_content(html: str, url: str = None):
    return trafilatura.extract(html, url=url)


def div_grid_to_table(soup: BeautifulSoup) -> list[dict]:
    """
    Generic heuristic: Extracts table-like data from repeated divs/lis with similar structure.
    - Finds the largest group of sibling div/li elements with the same class.
    - Extracts all direct text and attribute values as columns.
    - No site-specific selectors or field names.
    """
    # Find all div/li with a class
    candidates = soup.find_all(
        lambda tag: tag.name in ["div", "li"] and tag.get("class")
    )
    # Group by class name
    class_groups = {}
    for tag in candidates:
        class_str = " ".join(sorted(tag.get("class", [])))
        class_groups.setdefault(class_str, []).append(tag)
    # Find the largest group (most likely a grid/list)
    best_group = max(class_groups.values(), key=len, default=[])
    if len(best_group) < 3:
        return []
    # For each row, extract all direct children text and attributes
    table = []
    for row in best_group:
        row_data = {}
        # Use direct children tags as columns
        children = [c for c in row.children if isinstance(c, Tag)]
        for idx, child in enumerate(children):
            key = child.get("class")
            if key:
                col = " ".join(sorted(key))
            else:
                col = child.name or f"col{idx + 1}"
            value = child.get_text(strip=True)
            if not value:
                # Try attributes (e.g., href, src)
                for attr in ["href", "src", "alt", "title"]:
                    if child.has_attr(attr):
                        value = child[attr]
                        break
            row_data[col] = value
        # Fallback: all text if no children
        if not row_data:
            row_data["text"] = row.get_text(strip=True)
        table.append(row_data)
    # Only return if at least one row has more than just 'text'
    if any(len(row) > 1 for row in table):
        return table
    return []
