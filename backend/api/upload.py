from fastapi import APIRouter, UploadFile, File, HTTPException
from uuid import uuid4

from services.ocr_service import extract_text_from_pdf, get_pdf_page_count
from services.parser_service import parse_clauses
from services.rag_service import retrieve_relevant_knowledge
from services.ai_service import analyze_clause, summarize_document
from services.approval_service import get_review, add_audit_event

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file was provided.")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        pdf_bytes = await file.read()
        if not pdf_bytes:
            raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")

        document_id = f"DOC-{uuid4().hex[:12].upper()}"
        add_audit_event(document_id, "Document Uploaded", f"{file.filename} uploaded for analysis")
        page_count = get_pdf_page_count(pdf_bytes)
        extracted_text = extract_text_from_pdf(pdf_bytes)
        add_audit_event(document_id, "OCR Completed", f"Text extracted from {page_count} page(s)")
        if not extracted_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from the PDF.")

        clauses = parse_clauses(extracted_text)
        add_audit_event(document_id, "Document Parsed", f"{len(clauses)} clauses identified")
        if not clauses:
            raise HTTPException(
                status_code=422,
                detail="No numbered legal clauses could be identified in the document. Make sure the PDF contains numbered clause headings such as '1. PARTIES'."
            )

        analyzed_clauses = []
        for index, clause in enumerate(clauses, start=1):
            clause_id = f"clause-{index}"
            clause_name = clause.get("clause_name", "")
            clause_text = clause.get("clause_text", "")

            retrieved_knowledge = retrieve_relevant_knowledge(clause_text)
            context = "\n\n".join(item.get("content", "") for item in retrieved_knowledge)
            analysis = analyze_clause(clause_name, clause_text, context)
            sources = [{"source": item.get("source"), "page": item.get("page")} for item in retrieved_knowledge]

            analyzed_clauses.append({
                **clause,
                "clause_id": clause_id,
                "analysis": analysis,
                "sources": sources,
                "human_review": get_review(document_id, clause_id),
            })

        add_audit_event(document_id, "Clauses Extracted", f"{len(analyzed_clauses)} clauses extracted for review")
        add_audit_event(document_id, "Knowledge Retrieval Completed", "Clauses compared against organizational knowledge base")
        document_summary = summarize_document(analyzed_clauses)
        levels = [c.get("analysis", {}).get("risk_level") for c in analyzed_clauses]
        confidence_values = [
            int(c.get("analysis", {}).get("confidence", 0))
            for c in analyzed_clauses
            if str(c.get("analysis", {}).get("confidence", "")).isdigit()
        ]
        high = levels.count("High")
        medium = levels.count("Medium")
        low = levels.count("Low")
        unknown = len(levels) - high - medium - low
        overall = document_summary.get("overall_risk") or ("High" if high else "Medium" if medium else "Low" if low else "Unknown")
        confidence = round(sum(confidence_values) / len(confidence_values)) if confidence_values else 0

        add_audit_event(document_id, "Risk Analysis Generated", f"{len(analyzed_clauses)} risk findings generated", "AI System", "AI")

        return {
            "document_id": document_id,
            "filename": file.filename,
            "message": "File uploaded and processed successfully",
            "page_count": page_count,
            "extracted_text": extracted_text,
            "clauses": analyzed_clauses,
            "contract_summary": document_summary.get("summary", ""),
            "risk_summary": {
                "overall": overall,
                "confidence": confidence,
                "high": high,
                "medium": medium,
                "low": low,
                "unknown": unknown,
                "total": len(analyzed_clauses),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while processing the document: {str(e)}")
