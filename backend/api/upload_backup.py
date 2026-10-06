from fastapi import APIRouter, UploadFile, File

from services.ocr_service import extract_text_from_pdf
from services.parser_service import parse_clauses
from services.rag_service import retrieve_relevant_knowledge
from services.ai_service import analyze_clause


router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    # ---------------------------------------------------------
    # Step 1: Read uploaded PDF
    # ---------------------------------------------------------

    pdf_bytes = await file.read()


    # ---------------------------------------------------------
    # Step 2: OCR - Extract text from PDF
    # ---------------------------------------------------------

    extracted_text = extract_text_from_pdf(pdf_bytes)


    # ---------------------------------------------------------
    # Step 3: Parse extracted text into clauses
    # ---------------------------------------------------------

    clauses = parse_clauses(extracted_text)


    # ---------------------------------------------------------
    # Step 4: RAG + AI analysis for each clause
    # ---------------------------------------------------------

    analyzed_clauses = []

    for clause in clauses:

        clause_name = clause.get("clause_name", "")
        clause_text = clause.get("clause_text", "")


        # -----------------------------------------------------
        # Retrieve relevant legal knowledge from ChromaDB
        # -----------------------------------------------------

        retrieved_knowledge = retrieve_relevant_knowledge(
            clause_text
        )


        # -----------------------------------------------------
        # Convert retrieved knowledge into LLM context
        # -----------------------------------------------------

        context = "\n\n".join(
            item.get("content", "")
            for item in retrieved_knowledge
        )


        # -----------------------------------------------------
        # Analyze clause using Groq + RAG context
        # -----------------------------------------------------

        analysis = analyze_clause(
            clause_name,
            clause_text,
            context
        )


        # -----------------------------------------------------
        # Keep only source information for the frontend
        # -----------------------------------------------------

        sources = []

        for item in retrieved_knowledge:

            sources.append({
                "source": item.get("source"),
                "page": item.get("page")
            })


        # -----------------------------------------------------
        # Combine clause + AI analysis + sources
        # -----------------------------------------------------

        analyzed_clause = {
            **clause,
            "analysis": analysis,
            "sources": sources
        }

        analyzed_clauses.append(analyzed_clause)


    # ---------------------------------------------------------
    # Step 5: Return final API response
    # ---------------------------------------------------------

    return {
        "filename": file.filename,
        "message": "File uploaded and processed successfully",
        "extracted_text": extracted_text,
        "clauses": analyzed_clauses
    }