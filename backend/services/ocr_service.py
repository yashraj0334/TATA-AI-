import os
import shutil
from pathlib import Path

import pytesseract
from PIL import Image, ImageOps, ImageFilter
from pdf2image import convert_from_bytes, pdfinfo_from_bytes

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
except Exception:
    pass


def _first_existing(paths):
    for raw in paths:
        if not raw:
            continue
        p = Path(raw)
        if p.exists():
            return str(p)
    return None


def _configure_tesseract():
    configured = os.getenv("TESSERACT_CMD") or os.getenv("TESSERACT_PATH")
    candidates = [
        configured,
        shutil.which("tesseract"),
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        str(Path.home() / "AppData/Local/Programs/Tesseract-OCR/tesseract.exe"),
    ]
    found = _first_existing(candidates)
    if found:
        pytesseract.pytesseract.tesseract_cmd = found
        return found
    return None


def _configure_poppler():
    configured = os.getenv("POPPLER_PATH")
    candidates = [
        configured,
        shutil.which("pdftoppm"),
        r"C:\Program Files\poppler\Library\bin",
        r"C:\Program Files\poppler\bin",
    ]
    for raw in candidates:
        if not raw:
            continue
        p = Path(raw)
        if p.is_file():
            p = p.parent
        if p.exists() and ((p / "pdftoppm.exe").exists() or (p / "pdfinfo.exe").exists()):
            return str(p)
    return None


TESSERACT_PATH = _configure_tesseract()
POPPLER_PATH = _configure_poppler()


def _ocr_image(image):
    # Light preprocessing improves scans while leaving clean pages readable.
    gray = ImageOps.grayscale(image)
    gray = ImageOps.autocontrast(gray)
    gray = gray.filter(ImageFilter.SHARPEN)
    return pytesseract.image_to_string(gray, config="--psm 6")


def extract_text_from_image(image_path: str) -> str:
    if not TESSERACT_PATH:
        raise RuntimeError(
            "Tesseract OCR is not available. Set TESSERACT_CMD in backend/.env or install Tesseract OCR."
        )
    with Image.open(image_path) as image:
        return _ocr_image(image)


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    if not TESSERACT_PATH:
        raise RuntimeError(
            "Tesseract OCR is not available. Set TESSERACT_CMD in backend/.env or install Tesseract OCR."
        )
    pages = convert_from_bytes(pdf_bytes, poppler_path=POPPLER_PATH, dpi=300)
    return "\n".join(_ocr_image(page) for page in pages)


def get_pdf_page_count(pdf_bytes: bytes) -> int:
    info = pdfinfo_from_bytes(pdf_bytes, poppler_path=POPPLER_PATH)
    return int(info.get("Pages", 0))
