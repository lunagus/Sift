from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Optional, List, Dict
from core.ai_client import ask_ai

router = APIRouter()


class AIAnalyzeRequest(BaseModel):
    question: str
    block_type: str  # e.g. 'table', 'listings', 'article', etc.
    block_data: Any  # The data block (list of dicts, string, etc.)
    history: Optional[List[Dict[str, str]]] = None  # List of {question, answer}


@router.post("/ai_analyze")
def ai_analyze(req: AIAnalyzeRequest):
    # Build chat history string
    history_str = ""
    if req.history:
        for turn in req.history[-5:]:  # Limit to last 5 turns for brevity
            q = turn.get("question", "")
            a = turn.get("answer", "")
            history_str += f"Previous Q: {q}\nPrevious A: {a}\n\n"
    # Modular prompt builder
    action_instruction = (
        "If you suggest an action, ONLY suggest a filter (not highlight or sort). Always output a JSON block at the end of your answer describing the filter action, like: "
        '{"action": "filter", "column": "price", "operator": ">", "value": 1000}'
        "If no filter is suggested, do not output a JSON block."
    )
    if req.block_type == "table" or req.block_type == "listings":
        # Tabular data
        import pandas as pd

        df = pd.DataFrame(req.block_data)
        table_md = df.head(20).to_markdown(index=False) if not df.empty else "[No data]"
        prompt = f"{history_str}The user asked: '{req.question}'\n\nHere is the relevant data:\n\n{table_md}\n\n{action_instruction}\nPlease answer using only this data."
    elif req.block_type == "article":
        content = (
            req.block_data if isinstance(req.block_data, str) else str(req.block_data)
        )
        prompt = f"{history_str}The user asked: '{req.question}'\n\nHere is the relevant article:\n\n{content[:2000]}\n\n{action_instruction}\nPlease answer using only this content."
    else:
        prompt = f"{history_str}The user asked: '{req.question}'\n\nHere is the relevant data:\n\n{str(req.block_data)[:2000]}\n\n{action_instruction}\nPlease answer using only this data."
    # Call Groq LLM
    answer = ask_ai(prompt)
    return {"answer": answer}
