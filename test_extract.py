import asyncio
import os
from app.services.extractor import extract_text_from_file

def test():
    files = os.listdir("storage/resumes")
    if files:
        f = os.path.join("storage/resumes", files[0])
        try:
            txt = extract_text_from_file(f)
            print("EXTRACTION SUCCESSFUL! Extracted length:", len(txt))
        except Exception as e:
            print("EXTRACTION ERROR:", e)
    else:
        print("NO FILES")

if __name__ == "__main__":
    test()
