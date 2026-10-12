import re


def parse_clauses(text: str) -> list:
    """Extract legal clauses using numbered headings, section keywords, or logical paragraph fallback."""
    if not text or not text.strip():
        return []

    clean_text = text.strip()

    # Strategy 1: Numbered headings with optional Section/Article/Clause prefix
    # e.g., "1. PARTIES", "Section 2. Scope", "Article 3: Term", "1.1 Deliverables", "I. RECITALS"
    heading_re = re.compile(
        r"(?mi)^\s*(?:Section|Article|Clause)?\s*([0-9]+(?:\.[0-9]+)*|[IVXLCDM]+)[.):\-]?\s+([A-Za-z0-9][A-Za-z0-9 &/(),:'\-\"“”]{1,100})\s*$"
    )
    matches = list(heading_re.finditer(clean_text))

    clauses = []
    if matches:
        for i, match in enumerate(matches):
            number = match.group(1).strip()
            name = re.sub(r"\s+", " ", match.group(2)).strip()
            start = match.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(clean_text)
            clause_text = clean_text[start:end].strip()
            if len(clause_text) >= 10:
                clauses.append({
                    "clause_no": str(number),
                    "clause_name": name,
                    "clause_text": clause_text,
                })

    if clauses:
        return clauses

    # Strategy 2: Common legal headings in uppercase (e.g. "CONFIDENTIALITY", "TERMINATION", "GOVERNING LAW")
    common_headings_re = re.compile(
        r"(?mi)^\s*([A-Z][A-Z0-9 &/(),:'\-]{3,60})\s*$"
    )
    heading_matches = list(common_headings_re.finditer(clean_text))
    # Filter only headings that have subsequent body text
    if len(heading_matches) >= 2:
        for i, match in enumerate(heading_matches):
            name = re.sub(r"\s+", " ", match.group(1)).strip()
            start = match.end()
            end = heading_matches[i + 1].start() if i + 1 < len(heading_matches) else len(clean_text)
            clause_text = clean_text[start:end].strip()
            if len(clause_text) >= 20:
                clauses.append({
                    "clause_no": str(len(clauses) + 1),
                    "clause_name": name,
                    "clause_text": clause_text,
                })

    if clauses:
        return clauses

    # Strategy 3: Intelligent fallback by splitting paragraphs / logical sections
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n+", clean_text) if len(p.strip()) > 30]
    if paragraphs:
        # Group short paragraphs into sensible sections (max 8 sections)
        chunk_size = max(1, len(paragraphs) // 6) if len(paragraphs) > 6 else 1
        for idx in range(0, len(paragraphs), chunk_size):
            chunk = paragraphs[idx : idx + chunk_size]
            clause_body = "\n\n".join(chunk)
            first_line = chunk[0].split("\n")[0][:50].strip()
            # Clean first line as title
            clean_title = re.sub(r"[^A-Za-z0-9 ]+", "", first_line).strip() or f"Section {len(clauses) + 1}"
            clauses.append({
                "clause_no": str(len(clauses) + 1),
                "clause_name": clean_title[:40],
                "clause_text": clause_body,
            })
        return clauses

    # Final guarantee: if text exists, return full document as primary section
    return [{
        "clause_no": "1",
        "clause_name": "Agreement Terms",
        "clause_text": clean_text,
    }]

