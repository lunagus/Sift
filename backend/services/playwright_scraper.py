from playwright.sync_api import sync_playwright
from core.network_utils import get_random_user_agent, SimpleRateLimiter
import time

# Separate rate limiter for browser-based scraping
playwright_rate_limiter = SimpleRateLimiter(
    max_calls=2, period=1.0
)  # 2 browser launches/sec


def fetch_page_content_playwright(url: str, timeout: int = 30000) -> str:
    playwright_rate_limiter.acquire()
    user_agent = get_random_user_agent()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent=user_agent)
        page = context.new_page()
        page.goto(url, timeout=timeout)
        page.wait_for_load_state("networkidle")
        # Scroll to bottom to trigger lazy loading
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1500)  # wait 1.5s for any JS-rendered content
        html = page.content()
        browser.close()
        return html
