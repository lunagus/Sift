from bs4 import BeautifulSoup
from core.content_types import ContentType


def classify_content_type(soup: BeautifulSoup) -> list[ContentType]:
    types = []

    if soup.find("table"):
        types.append(ContentType.TABLE)

    # Enhanced grid detection
    if _detect_grid_content(soup):
        types.append(ContentType.DIV_GRID)
        types.append(ContentType.UNIVERSAL_GRID)

    if soup.find("article") or soup.find("meta", property="og:article"):
        types.append(ContentType.ARTICLE)

    if soup.find("script", type="application/ld+json"):
        types.append(ContentType.JSON_LD)

    if soup.select("div[class*=product], .product-card, .product-item"):
        types.append(ContentType.PRODUCT_LISTING)

    if soup.select("div[class*=job], .job-card, .job-listing"):
        types.append(ContentType.JOB_LISTING)

    if soup.select("div[class*=review], .review-card, blockquote"):
        types.append(ContentType.REVIEW)

    if soup.select("div[class*=property], .real-estate, .listing"):
        types.append(ContentType.REAL_ESTATE)

    if soup.find("form") and soup.select("input, textarea, select"):
        types.append(ContentType.PROFILE)

    if not types:
        types.append(ContentType.UNKNOWN)

    return list(set(types))  # Ensure unique values


def _detect_grid_content(soup: BeautifulSoup) -> bool:
    """
    Enhanced grid detection that looks for repeated div structures.
    """
    # Look for divs with classes
    divs_with_classes = soup.select("div[class]")
    if len(divs_with_classes) < 3:
        return False

    # Group divs by their class patterns
    class_groups = {}
    for div in divs_with_classes:
        class_name = " ".join(sorted(div.get("class", [])))
        if class_name:
            class_groups[class_name] = class_groups.get(class_name, 0) + 1

    # Check if we have repeated class patterns (indicating a grid)
    if class_groups:
        max_repetition = max(class_groups.values())
        if max_repetition >= 3:
            return True

    # Look for common grid patterns
    grid_patterns = [
        "div[class*='row']",
        "div[class*='item']",
        "div[class*='card']",
        "div[class*='listing']",
        "div[class*='product']",
        "div[class*='result']",
        "li[class*='item']",
        "div[class*='entry']",
        "div[class*='post']",
        "div[class*='article']",
    ]

    for pattern in grid_patterns:
        elements = soup.select(pattern)
        if len(elements) >= 3:
            return True

    # Look for repeated structural patterns
    all_elements = soup.find_all()
    if len(all_elements) > 10:
        # Check for repeated tag structures
        tag_counts = {}
        for elem in all_elements:
            tag_name = elem.name
            classes = " ".join(sorted(elem.get("class", [])))
            signature = f"{tag_name}.{classes}"
            tag_counts[signature] = tag_counts.get(signature, 0) + 1

        if tag_counts:
            max_repetition = max(tag_counts.values())
            if max_repetition >= 3:
                return True

    return False
