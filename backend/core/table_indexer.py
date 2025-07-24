import pandas as pd


def profile_table(df: pd.DataFrame, source_url: str = None, content_type: str = None):
    column_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
    numeric_cols = [
        col for col, dtype in df.dtypes.items() if pd.api.types.is_numeric_dtype(dtype)
    ]
    string_cols = [
        col for col, dtype in df.dtypes.items() if pd.api.types.is_string_dtype(dtype)
    ]
    preview_rows = df.to_dict(orient="records")
    return {
        "num_rows": len(df),
        "num_cols": len(df.columns),
        "numeric_cols": numeric_cols,
        "string_cols": string_cols,
        "column_types": column_types,
        "preview_rows": preview_rows,
        "source_url": source_url,
        "content_type": content_type,
    }
