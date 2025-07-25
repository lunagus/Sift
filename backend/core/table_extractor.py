import pandas as pd
from bs4 import BeautifulSoup
import numpy as np


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.where(pd.notnull(df), None)
    return df


def extract_tables(soup: BeautifulSoup) -> list[pd.DataFrame]:
    tables = soup.find_all("table")
    dfs = []
    for table in tables:
        # Try pandas.read_html first
        try:
            df = pd.read_html(str(table))[0]
            df = clean_dataframe(df)
            dfs.append(df)
            continue
        except Exception:
            pass  # Fallback to manual extraction below

        # Fallback: manual extraction if read_html fails
        rows = []
        for tr in table.find_all("tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
            if cells:
                rows.append(cells)
        if rows:
            # Use first row as header if it looks like a header (all th or first row only)
            headers = [cell for cell in rows[0]]
            data_rows = rows[1:] if len(rows) > 1 else []
            try:
                df = pd.DataFrame(data_rows, columns=headers)
            except Exception:
                df = pd.DataFrame(rows)
            df = clean_dataframe(df)
            dfs.append(df)
    return dfs
