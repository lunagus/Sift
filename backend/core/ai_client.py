import os
import httpx


def ask_ai(prompt: str):
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        return "GROQ_API_KEY not set."

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama3-70b-8192",
        "messages": [{"role": "user", "content": prompt}],
    }
    response = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]
