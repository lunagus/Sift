from bs4 import BeautifulSoup

UNWANTED_CLASSES = [
    "footer",
    "header",
    "nav",
    "advertisement",
    "ad",
    "popup",
    "modal",
    "subscribe",
    "newsletter",
]


def remove_unwanted_blocks(soup: BeautifulSoup) -> BeautifulSoup:
    for cls in UNWANTED_CLASSES:
        for tag in soup.select(f".{cls}"):
            tag.decompose()
    return soup
