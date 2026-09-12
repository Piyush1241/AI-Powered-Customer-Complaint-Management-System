from pypdf import PdfReader
import io
import logging

logger = logging.getLogger(__name__)

async def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """
    Extracts plain text from uploaded PDF or Email/Text files.
    """
    filename_lower = filename.lower()
    
    if filename_lower.endswith(".pdf"):
        try:
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            extracted_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
            return extracted_text.strip()
        except Exception as e:
            logger.error(f"Error reading PDF {filename}: {e}")
            return file_content.decode("utf-8", errors="ignore")
    else:
        # Fallback to UTF-8 text parsing (txt, eml, email)
        try:
            return file_content.decode("utf-8")
        except Exception:
            return file_content.decode("latin1", errors="ignore")
