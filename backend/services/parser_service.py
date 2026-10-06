import re


def parse_clauses(text: str) -> list:
    """Split OCR text into numbered legal clauses with common heading styles."""
    if not text or not text.strip():
        return []

    heading_re = re.compile(
        r"(?mi)^\s*(\d+(?:\.\d+)*)[.)]?\s+([A-Za-z][A-Za-z0-9][A-Za-z0-9 &/(),:'\-]{1,100})\s*$"
    )
    matches = list(heading_re.finditer(text))
    clauses = []

    for i, match in enumerate(matches):
        number = match.group(1)
        name = re.sub(r"\s+", " ", match.group(2)).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        clause_text = text[start:end].strip()
        if len(clause_text) < 10:
            continue
        clauses.append({
            "clause_no": number,
            "clause_name": name,
            "clause_text": clause_text,
        })

    return clauses
