import httpx
import pandas as pd
import numpy as np
from bs4 import BeautifulSoup, Tag
import trafilatura

from core.table_indexer import profile_table
from core.block_classifier import classify_table
from core.network_utils import get_random_user_agent, SimpleRateLimiter
from services.playwright_scraper import fetch_page_content_playwright
from core.content_classifier import classify_content_type
from core.content_types import ContentType

http_rate_limiter = SimpleRateLimiter(max_calls=5, period=1.0)


def fetch_page_content(url: str, method: str = "httpx") -> str:
    if method == "playwright":
        return fetch_page_content_playwright(url)
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


def extract_html_tables(html: str, source_url: str = None):
    soup = BeautifulSoup(html, "lxml")
    raw_tables = soup.find_all("table")
    results = []
    for table in raw_tables:
        try:
            df = pd.read_html(str(table))[0]
            df = clean_dataframe(df)
            content_type = classify_table(df)
            meta = profile_table(df, source_url=source_url, content_type=content_type)
            meta["dataframe"] = df
            results.append(meta)
        except Exception:
            continue
    return results


def extract_div_grids(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    candidates = soup.find_all(
        lambda tag: tag.name in ["div", "li"] and tag.get("class")
    )
    class_groups = {}
    for tag in candidates:
        class_key = " ".join(sorted(tag.get("class", [])))
        class_groups.setdefault(class_key, []).append(tag)
    best_group = max(class_groups.values(), key=len, default=[])
    if len(best_group) < 3:
        return []
    rows = []
    for row in best_group:
        row_data = {}
        children = [c for c in row.children if isinstance(c, Tag)]
        for idx, child in enumerate(children):
            key = child.get("class")
            col_name = " ".join(sorted(key)) if key else child.name or f"col{idx + 1}"
            value = child.get_text(strip=True)
            if not value:
                for attr in ["href", "src", "alt", "title"]:
                    if child.has_attr(attr):
                        value = child[attr]
                        break
            row_data[col_name] = value
        if not row_data:
            row_data["text"] = row.get_text(strip=True)
        rows.append(row_data)
    return rows if any(len(r) > 1 for r in rows) else []


def extract_main_content(html: str, url: str = None) -> str:
    return trafilatura.extract(html, url=url)


def extract_all(url: str, force_js=False) -> dict:
    method = "playwright" if force_js else "httpx"
    html = fetch_page_content(url, method=method)
    soup = BeautifulSoup(html, "lxml")
    detected_types = classify_content_type(soup)
    result = {
        "url": url,
        "content_types": [t.value for t in detected_types],
        "tables": [],
        "div_tables": [],
        "main_content": None,
        "raw_html": html,
    }
    if ContentType.TABLE in detected_types:
        result["tables"] = extract_html_tables(html, source_url=url)
    if ContentType.DIV_GRID in detected_types:
        result["div_tables"] = extract_div_grids(html)
    if ContentType.ARTICLE in detected_types or ContentType.BLOG in detected_types:
        result["main_content"] = extract_main_content(html, url=url)
    return result
