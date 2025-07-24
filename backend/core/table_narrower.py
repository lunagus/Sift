import pandas as pd
from typing import Any, Dict, List, Optional, Tuple
from core.query_classifier import extract_threshold


def filter_and_sort_table(
    df: pd.DataFrame, columns: List[str], intent: List[str], query: str, top_n: int = 10
) -> pd.DataFrame:
    """
    Applies threshold filters or sorting based on detected intent.
    Always retains at least the matched columns + one text column.
    """
    # 1. Determine threshold if any
    thr = extract_threshold(query)
    if thr and columns:
        op, value = thr
        col = columns[0]
        if op == ">" and pd.api.types.is_numeric_dtype(df[col]):
            df = df[df[col] > value]
        elif op == "<" and pd.api.types.is_numeric_dtype(df[col]):
            df = df[df[col] < value]

    # 2. Sort if comparison intent
    if "comparison" in intent and columns:
        col = columns[0]
        if pd.api.types.is_numeric_dtype(df[col]):
            df = df.sort_values(by=col, ascending=False)

    # 3. Always include matched + first text column
    cols_to_keep = []
    for c in columns:
        if c in df.columns:
            cols_to_keep.append(c)
    # fallback include first non-numeric column for context
    if df.columns.any() and not any(
        pd.api.types.is_object_dtype(df[c]) for c in cols_to_keep
    ):
        for c in df.columns:
            if not pd.api.types.is_numeric_dtype(df[c]):
                cols_to_keep.append(c)
                break

    result = df[cols_to_keep] if cols_to_keep else df
    if top_n:
        result = result.head(top_n)
    return result
