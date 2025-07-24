import re
from typing import Dict, List, Optional, Tuple

# Define simple intents and their trigger keywords
INTENT_KEYWORDS: Dict[str, List[str]] = {
    "comparison": [
        "higher",
        "lower",
        "cheapest",
        "most",
        "least",
        "vs",
        "versus",
        "highest",
        "lowest",
        "best",
        "worst",
    ],
    "filter_gt": ["over", "above", "greater than", "more than"],
    "filter_lt": ["under", "below", "less than", "fewer than"],
    "summarization": ["summarize", "summary", "overview"],
    "list_extraction": ["list", "show", "extract"],
}


def classify_intent(query: str) -> List[str]:
    """
    Returns a list of detected intents based on keyword matching.
    """
    q = query.lower()
    detected = []
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(kw in q for kw in keywords):
            detected.append(intent)
    return detected or ["generic"]


def extract_threshold(query: str) -> Optional[Tuple[str, float]]:
    """
    Looks for patterns like "<column> over 150" or "price above 1000".
    Returns (operator, threshold) or None.
    """
    # Very simple regex for numbers
    m = re.search(r"(over|above|greater than)\s+(\d+(\.\d+)?)", query.lower())
    if m:
        return (">", float(m.group(2)))
    m = re.search(r"(under|below|less than)\s+(\d+(\.\d+)?)", query.lower())
    if m:
        return ("<", float(m.group(2)))
    return None


def extract_keywords(query: str) -> List[str]:
    """
    Returns all words of length >= 3 from the query for fuzzy matching.
    """
    return [w for w in re.findall(r"\w{3,}", query.lower())]


# Keep the old functions for backward compatibility
def classify_query(query: str) -> List[str]:
    return classify_intent(query)
