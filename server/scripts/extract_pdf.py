import fitz
import sys
import os

pdf_path = os.path.join("data", "BIBLIA NUEVA VERSIÓN INTERNACIONAL (NVI) 2015.pdf")
output_path = "nvi-text-blocks.txt"

print(f"Reading {pdf_path}...")
doc = fitz.open(pdf_path)

with open(output_path, "w", encoding="utf-8") as f:
    # Only read first 30 pages to see the output format
    for page_num in range(30):
        page = doc.load_page(page_num)
        blocks = page.get_text("blocks")
        # Sort blocks by vertical position then horizontal to read columns properly
        blocks.sort(key=lambda b: (b[1], b[0]))
        for block in blocks:
            f.write(block[4] + "\n")

print("Done.")
