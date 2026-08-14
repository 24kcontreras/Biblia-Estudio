import fitz
import sys

doc = fitz.open("data/1987 - Traducción del Nuevo Mundo.pdf")
print("Total pages:", len(doc))
for i in range(10):
    page = doc.load_page(i)
    text = page.get_text("text")
    print(f"Page {i} text length:", len(text))
    if len(text) > 0:
        print(f"--- Page {i} ---\n{text[:200]}\n")
