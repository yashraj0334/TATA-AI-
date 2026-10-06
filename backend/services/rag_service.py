"""RAG retrieval service used by the FastAPI upload endpoint."""

from rag.retriever import retrieve


def retrieve_relevant_knowledge(query: str) -> list:
    """Return the top relevant legal knowledge chunks for a clause."""
    if not query or not query.strip():
        return []

    try:
        documents = retrieve(query)
    except Exception as exc:
        print(f"RAG retrieval error: {exc}")
        return []

    return [
        {
            "content": document.page_content,
            "source": document.metadata.get("source"),
            "page": document.metadata.get("page"),
        }
        for document in documents
    ]