from typing import List
import pandas as pd

PROMPT_TEMPLATE = """
The user asked:
\"\"\"{question}\"\"\"

Here is the relevant data ({row_count} rows, columns: {columns}):

{table_snippet}

Please answer the question using only this data.
""".strip()


def build_prompt(question: str, df: pd.DataFrame, additional_context: str = "") -> str:
    """
    Renders the final prompt, embedding a markdown table snippet.
    """
    snippet = df.to_markdown(index=False)
    return PROMPT_TEMPLATE.format(
        question=question,
        row_count=len(df),
        columns=", ".join(df.columns),
        table_snippet=snippet,
    ) + ("\n\n" + additional_context if additional_context else "")


# Keep old function for backward compatibility
def build_prompt_from_table(question: str, table, columns: list[str]) -> str:
    """
    Legacy function - now uses the new prompt builder
    """
    return build_prompt(question, table)
