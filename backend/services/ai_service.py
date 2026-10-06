import os
import json

from dotenv import load_dotenv
from google import genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in the .env file")

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")


def _json_response(prompt: str, fallback: dict) -> dict:
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config={
                "temperature": 0,
                "max_output_tokens": 1200,
                "response_mime_type": "application/json",
            },
        )
        content = (response.text or "").strip()
        return json.loads(content)
    except Exception as e:
        fallback = dict(fallback)
        fallback["error"] = str(e)
        return fallback


def analyze_clause(clause_name: str, clause_text: str, retrieved_context: str = "") -> dict:
    knowledge_section = (
        f"Relevant legal knowledge retrieved from the project's knowledge base:\n\n{retrieved_context}"
        if retrieved_context and retrieved_context.strip()
        else "No additional knowledge-base context is available. Analyze the clause based on the clause text itself."
    )

    prompt = f"""
You are a legal contract analysis assistant.

Analyze this contract clause using the clause text and retrieved legal knowledge.

Clause name:
{clause_name}

Clause text:
{clause_text}

{knowledge_section}

Rules:
1. Do not invent facts.
2. Identify practical legal risk.
3. Explain why it is risky or acceptable.
4. Give a practical recommendation.
5. Return ONLY valid JSON.
6. confidence must be an integer from 0 to 100 representing confidence in this classification.

Return exactly:
{{
  "clause_name": "...",
  "summary": "...",
  "risk_level": "Low | Medium | High",
  "confidence": 0,
  "risk_reason": "...",
  "recommendation": "..."
}}
"""

    result = _json_response(prompt, {
        "clause_name": clause_name,
        "summary": "AI analysis could not be completed.",
        "risk_level": "Unknown",
        "confidence": 0,
        "risk_reason": "",
        "recommendation": "Please review this clause manually.",
    })
    try:
        result["confidence"] = max(0, min(100, int(result.get("confidence", 0))))
    except (TypeError, ValueError):
        result["confidence"] = 0
    return result


def summarize_document(clauses: list) -> dict:
    compact = []
    for clause in clauses:
        a = clause.get("analysis", {})
        compact.append({
            "clause_name": clause.get("clause_name"),
            "clause_text": clause.get("clause_text", "")[:2500],
            "risk_level": a.get("risk_level", "Unknown"),
            "summary": a.get("summary", ""),
            "recommendation": a.get("recommendation", ""),
        })

    prompt = f"""
Create a concise executive summary of a legal contract from the clause analyses below.
Do not invent parties, dates, amounts, obligations, or facts that are not present.
Return ONLY valid JSON.

Return exactly:
{{
  "summary": "2-5 sentence executive summary",
  "overall_risk": "Low | Medium | High | Unknown"
}}

Clause analyses:
{json.dumps(compact, ensure_ascii=False)}
"""
    return _json_response(prompt, {
        "summary": "A document-level summary could not be generated. Review the clause analyses below.",
        "overall_risk": "Unknown",
    })
