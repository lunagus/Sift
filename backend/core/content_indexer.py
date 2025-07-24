from bs4 import BeautifulSoup
import pandas as pd
from typing import Any, Dict, List


def extract_tables_with_metadata(
    html: str, max_preview: int = 5
) -> List[Dict[str, Any]]:
    """
    Parses all <table> elements, converts to DataFrames, and profiles them.
    Returns a list of metadata dicts with:
      - 'dataframe': the full pd.DataFrame
      - 'row_count', 'col_count'
      - 'numeric_columns', 'text_columns'
      - 'preview': first `max_preview` rows as dicts
    """
    soup = BeautifulSoup(html, "lxml")
    tables = soup.find_all("table")
    results = []

    for tbl in tables:
        try:
            df = pd.read_html(str(tbl))[0]
        except ValueError:
            continue

        meta: Dict[str, Any] = {}
        meta["dataframe"] = df
        meta["row_count"], meta["col_count"] = df.shape

        # Identify numeric vs text
        numeric_cols = []
        text_cols = []
        for c in df.columns:
            if pd.api.types.is_numeric_dtype(df[c]):
                numeric_cols.append(c)
            else:
                text_cols.append(c)
        meta["numeric_columns"] = numeric_cols
        meta["text_columns"] = text_cols

        # Preview rows
        meta["preview"] = df.head(max_preview).to_dict(orient="records")

        results.append(meta)

    return results
