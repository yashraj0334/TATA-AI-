from pathlib import Path

from langchain_chroma import Chroma

from rag.embedding import GeminiEmbeddings, OUTPUT_DIMENSIONALITY


VECTOR_DB_PATH = Path(__file__).resolve().parents[1] / "chroma_db"
COLLECTION_NAME = "tata_legal_knowledge_gemini"

embedding_function = GeminiEmbeddings()


def get_vector_store() -> Chroma:
    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embedding_function,
        persist_directory=str(VECTOR_DB_PATH),
        collection_metadata={"embedding_model": "gemini-embedding-001", "embedding_dimension": OUTPUT_DIMENSIONALITY},
    )
