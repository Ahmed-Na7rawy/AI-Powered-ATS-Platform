import os
from PyPDF2 import PdfReader
import docx

def extract_text_with_ocr(file_path: str) -> str:
    try:
        import pytesseract
        from pdf2image import convert_from_path
        
        pages = convert_from_path(file_path)
        ocr_text = []
        for page in pages:
            text = pytesseract.image_to_string(page)
            ocr_text.append(text)
        return "\n".join(ocr_text).strip()
    except Exception as e:
        print(f"OCR Extraction Exception: {e}")
        return ""

def extract_text_from_file(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File at {file_path} does not exist.")
        
    _, ext = os.path.splitext(file_path.lower())
    
    try:
        if ext == ".pdf":
            reader = PdfReader(file_path)
            text = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
            
            full_text = "\n".join(text).strip()
            
            # Fallback to OCR if standard extraction yields less than 50 characters (e.g., scanned PDF image)
            if len(full_text) < 50:
                ocr_result = extract_text_with_ocr(file_path)
                if ocr_result:
                    return ocr_result
            
            return full_text
            
        elif ext in [".docx", ".doc"]:
            # Note: python-docx natively supports .docx. Legacy .doc may fail.
            doc = docx.Document(file_path)
            text = [p.text for p in doc.paragraphs if p.text]
            return "\n".join(text)
            
        else:
            raise ValueError(f"Unsupported file extension for extraction: {ext}")
            
    except Exception as e:
        raise RuntimeError(f"Failed to extract text from {file_path}: {str(e)}")
