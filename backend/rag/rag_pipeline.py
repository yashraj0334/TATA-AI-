from pathlib import Path
import shutil

from rag.chunk_documents import chunk_documents
from rag.embedding import OUTPUT_DIMENSIONALITY
from rag.load_documents import load_knowledge_documents
from rag.vector_store import COLLECTION_NAME, VECTOR_DB_PATH, get_vector_store


def build_vector_database() -> int:
    """Rebuild the Chroma collection using Gemini embeddings."""
    if VECTOR_DB_PATH.exists():
        shutil.rmtree(VECTOR_DB_PATH)

    documents = load_knowledge_documents()
    if not documents:
        raise RuntimeError("No readable PDFs found in the knowledge-base directory")

    chunks = chunk_documents(documents)
    store = get_vector_store()

    # 30 PDFs are small, so one embedding request is sufficient for this prototype.
    store.add_documents(chunks)

    print(f"Built collection: {COLLECTION_NAME}")
    print(f"Documents: {len(documents)}")
    print(f"Chunks: {len(chunks)}")
    print(f"Embedding dimension: {OUTPUT_DIMENSIONALITY}")
    return len(chunks)


if __name__ == "__main__":
    build_vector_database()
