from langchain_core.documents import Document

from rag.vector_store import get_vector_store


retriever = get_vector_store().as_retriever(search_kwargs={"k": 3})


def retrieve(query: str) -> list[Document]:
    if not query or not query.strip():
        return []
    return retriever.invoke(query)
