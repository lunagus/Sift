from difflib import get_close_matches
from typing import Any, Dict, List, Optional
import pandas as pd


def match_best_table(
    tables_meta: List[Dict[str, Any]], query_keywords: List[str]
) -> Optional[Dict[str, Any]]:
    """
    Chooses the most relevant table metadata by fuzzy-matching any keyword
    against its column names. Falls back to the largest table.
    """
    best_score = 0.0
    best = None

    for meta in tables_meta:
        df: pd.DataFrame = meta["dataframe"]
        cols = [str(c).lower() for c in df.columns]
        score = sum(
            bool(get_close_matches(k, cols, cutoff=0.6)) for k in query_keywords
        )
        if score > best_score:
            best_score, best = score, meta

    if best is not None:
        return best
    # fallback: largest table by row_count
    if tables_meta:
        return max(tables_meta, key=lambda m: m["row_count"])
    return None


def match_columns(meta: Dict[str, Any], query_keywords: List[str]) -> List[str]:
    """
    From a chosen table metadata, fuzzy-match query keywords to its columns.
    """
    df: pd.DataFrame = meta["dataframe"]
    cols = list(df.columns)
    matched = []
    for k in query_keywords:
        hits = get_close_matches(k.lower(), [c.lower() for c in cols], cutoff=0.6)
        for h in hits:
            # restore original casing
            matched.append(next(c for c in cols if c.lower() == h))
    return list(dict.fromkeys(matched))  # dedupe preserving order


# Keep old functions for backward compatibility
def match_table_column(table: pd.DataFrame, query_keywords: List[str]) -> List[str]:
    """
    Legacy function - now uses the new matching logic
    """
    meta = {"dataframe": table}
    return match_columns(meta, query_keywords)


def filter_table_for_prompt(
    table: pd.DataFrame, columns: List[str], top_n=10
) -> pd.DataFrame:
    """
    Legacy function - kept for backward compatibility
    """
    if not columns:
        return table.head(top_n) if top_n else table
    return table[columns].dropna().head(top_n) if top_n else table[columns].dropna()
