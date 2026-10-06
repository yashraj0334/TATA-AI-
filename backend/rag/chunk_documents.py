from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


splitter = RecursiveCharacterTextSplitter(
    chunk_size=1200,
    chunk_overlap=150,
)


def chunk_documents(documents: list[Document]) -> list[Document]:
    return splitter.split_documents(documents)
