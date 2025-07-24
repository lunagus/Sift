from pydantic import BaseModel
from typing import Optional


class ScrapeRequest(BaseModel):
    url: str
    question: Optional[str] = None
