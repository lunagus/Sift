from fastapi import APIRouter
from models.scrape import ScrapeRequest
from services.universal_extractor import fetch_page_content
from core.extractor_router import extract_structured_content
import json

router = APIRouter()


@router.post("/scrape")
def scrape_and_extract(data: ScrapeRequest):
    html = fetch_page_content(data.url, method=data.method or "httpx")
    extracted = extract_structured_content(html, url=data.url)
    # Debug: check which field is not JSON serializable
    try:
        json.dumps(extracted, allow_nan=False)
    except Exception as e:
        print("JSON serialization error:", e)
        for k, v in extracted.items():
            try:
                json.dumps(v, allow_nan=False)
            except Exception as e2:
                print(f"Field {k} is not JSON serializable:", e2)
    return extracted
