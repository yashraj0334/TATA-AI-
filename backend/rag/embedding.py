import os
from typing import List

from google import genai
from google.genai import types
from langchain_core.embeddings import Embeddings


MODEL_NAME = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
OUTPUT_DIMENSIONALITY = int(os.getenv("GEMINI_EMBEDDING_DIM", "768"))


def _get_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    return genai.Client(api_key=api_key)


class GeminiEmbeddings(Embeddings):
    """Gemini embeddings for Chroma/LangChain RAG."""

    def __init__(self):
        self.client = _get_client()

    def _embed(self, texts: List[str], task_type: str):
        if not texts:
            return []

        result = self.client.models.embed_content(
            model=MODEL_NAME,
            contents=texts,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=OUTPUT_DIMENSIONALITY,
            ),
        )

        return [item.values for item in result.embeddings]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._embed(texts, "RETRIEVAL_DOCUMENT")

    def embed_query(self, text: str) -> List[float]:
        if not text or not text.strip():
            return []

        return self._embed([text], "RETRIEVAL_QUERY")[0]