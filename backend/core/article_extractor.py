import trafilatura


def extract_article(html: str, url: str = None) -> dict:
    raw = trafilatura.extract(
        html, include_comments=False, url=url, output_format="json"
    )
    if raw:
        return trafilatura.extract(
            html, include_comments=False, url=url, output_format="json"
        )
    return {"text": trafilatura.extract(html)}
