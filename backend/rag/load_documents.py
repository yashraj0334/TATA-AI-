from pathlib import Path

from langchain_core.documents import Document
from pypdf import PdfReader


KNOWLEDGE_BASE_DIR = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "Tata_Legal_Knowledge_Base_Complete_30_PDFs"
)


def load_knowledge_documents() -> list[Document]:
    documents = []
    pdf_files = sorted(KNOWLEDGE_BASE_DIR.rglob("*.pdf"))

    for pdf_path in pdf_files:
        reader = PdfReader(str(pdf_path))
        relative_source = pdf_path.relative_to(KNOWLEDGE_BASE_DIR).as_posix()

        for page_number, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            if not text:
                continue

            documents.append(
                Document(
                    page_content=text,
                    metadata={
                        "source": relative_source,
                        "page": page_number,
                    },
                )
            )

    return documents
