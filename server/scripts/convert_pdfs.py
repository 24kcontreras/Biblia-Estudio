import fitz
import sys
import os

data_dir = "data"
pdf_files = [f for f in os.listdir(data_dir) if f.lower().endswith(".pdf")]

for pdf_file in pdf_files:
    pdf_path = os.path.join(data_dir, pdf_file)
    txt_filename = os.path.splitext(pdf_file)[0] + ".txt"
    output_path = os.path.join(data_dir, txt_filename)
    
    print(f"Convirtiendo {pdf_file} a texto plano...")
    doc = fitz.open(pdf_path)
    
    with open(output_path, "w", encoding="utf-8") as f:
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            if text:
                f.write(text + "\n")
                    
print("¡Todos los PDFs han sido convertidos a formato .txt!")
