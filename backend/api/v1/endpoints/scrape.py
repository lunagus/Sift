from fastapi import APIRouter
from models.scrape import ScrapeRequest
from services.extractor import (
    fetch_page_content,
    extract_tables_with_metadata,
    extract_main_content,
)
from core.query_classifier import classify_intent, extract_keywords
from core.content_indexer import extract_tables_with_metadata as index_tables_metadata
from core.content_matcher import match_best_table, match_columns
from core.table_narrower import filter_and_sort_table
from core.prompt_builder import build_prompt
from core.ai_client import ask_ai

router = APIRouter()


@router.post("/scrape")
def scrape_and_ask(data: ScrapeRequest):
    html = fetch_page_content(data.url)

    # Extract tables for frontend display (legacy format)
    tables_with_metadata = extract_tables_with_metadata(html, source_url=data.url)
    main_content = extract_main_content(html, url=data.url)

    response = {
        "tables": [tbl["preview_rows"] for tbl in tables_with_metadata],
        "main_content": main_content,
    }

    # If a question is provided, use the new comprehensive pipeline
    if data.question:
        print(f"Processing question: {data.question}")

        # Step 1: Index all tables with comprehensive metadata
        tables_meta = index_tables_metadata(html)
        print(f"Found {len(tables_meta)} tables")

        if not tables_meta:
            response["ai_response"] = "No tables found on this page."
            return response

        # Step 2: Classify query intent and extract keywords
        intents = classify_intent(data.question)
        keywords = extract_keywords(data.question)
        print(f"Detected intents: {intents}")
        print(f"Extracted keywords: {keywords}")

        # Step 3: Select the best matching table
        best_table_meta = match_best_table(tables_meta, keywords)
        if not best_table_meta:
            response["ai_response"] = "No suitable table found for your question."
            return response

        print(
            f"Selected table with {best_table_meta['row_count']} rows, {best_table_meta['col_count']} columns"
        )

        # Step 4: Match relevant columns
        matched_columns = match_columns(best_table_meta, keywords)
        print(f"Matched columns: {matched_columns}")

        # Step 5: Filter and sort the table based on intent
        df = best_table_meta["dataframe"]
        filtered_df = filter_and_sort_table(
            df=df,
            columns=matched_columns,
            intent=intents,
            query=data.question,
            top_n=10,  # Send top 10 most relevant rows
        )

        print(
            f"Filtered table has {len(filtered_df)} rows, columns: {list(filtered_df.columns)}"
        )

        # Step 6: Build the prompt
        prompt = build_prompt(data.question, filtered_df)
        print("Prompt sent to AI:")
        print("=" * 50)
        print(prompt)
        print("=" * 50)

        # Step 7: Send to AI
        try:
            ai_response = ask_ai(prompt)
            response["ai_response"] = ai_response
        except Exception as e:
            response["ai_response"] = f"Error getting AI response: {str(e)}"

    return response
