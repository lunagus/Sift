import httpx
from bs4 import BeautifulSoup
import pandas as pd
import trafilatura
from core.table_indexer import profile_table
from core.block_classifier import classify_table


def fetch_page_content(url: str) -> str:
    with httpx.Client(follow_redirects=True, timeout=30) as client:
        resp = client.get(url)
        resp.raise_for_status()
        return resp.text


def extract_tables_with_metadata(html: str, source_url: str = None):
    soup = BeautifulSoup(html, "lxml")
    tables = soup.find_all("table")
    profiled_tables = []
    for table in tables:
        try:
            df = pd.read_html(str(table))[0]
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
            dfs.append(df)
        except Exception:
            continue
    return dfs


def extract_main_content(html: str, url: str = None):
    return trafilatura.extract(html, url=url)
