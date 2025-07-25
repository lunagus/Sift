import random
import time
import threading
from functools import wraps
from typing import Callable, Optional

# --- User-Agent Spoofing ---

DEFAULT_USER_AGENTS = [
    # Chrome
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    # Firefox
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    # Edge
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    # Mac Safari
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    # Linux Chrome
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]


def get_random_user_agent(user_agents: Optional[list[str]] = None) -> str:
    """
    Returns a random user-agent string from the provided list or the default list.
    """
    agents = user_agents or DEFAULT_USER_AGENTS
    return random.choice(agents)


# --- Rate Limiting ---


class SimpleRateLimiter:
    """
    Thread-safe, in-memory rate limiter (per process).
    Usage: limiter = SimpleRateLimiter(max_calls=5, period=1.0)
           limiter.acquire()
    """

    def __init__(self, max_calls: int, period: float):
        self.max_calls = max_calls
        self.period = period
        self.lock = threading.Lock()
        self.calls = []  # timestamps

    def acquire(self):
        with self.lock:
            now = time.monotonic()
            # Remove old calls
            self.calls = [t for t in self.calls if now - t < self.period]
            if len(self.calls) >= self.max_calls:
                sleep_time = self.period - (now - self.calls[0])
                if sleep_time > 0:
                    time.sleep(sleep_time)
                now = time.monotonic()
                self.calls = [t for t in self.calls if now - t < self.period]
            self.calls.append(time.monotonic())

    def __call__(self, func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            self.acquire()
            return func(*args, **kwargs)

        return wrapper


# --- Decorator for FastAPI endpoints (optional, for future expansion) ---
# Example usage:
# @rate_limit_endpoint(max_calls=10, period=60)
# async def my_endpoint(...):


def rate_limit_endpoint(max_calls: int, period: float):
    limiter = SimpleRateLimiter(max_calls, period)

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            limiter.acquire()
            return await func(*args, **kwargs)

        return wrapper

    return decorator
