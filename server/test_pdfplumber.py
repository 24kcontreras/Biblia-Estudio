import pdfplumber

pdf_path = "data/1987 - Traducción del Nuevo Mundo.pdf"
try:
    with pdfplumber.open(pdf_path) as pdf:
        # Extraer página 10 (donde seguro hay texto de Génesis)
        page = pdf.pages[10]
        text = page.extract_text()
        print(text[:1000])
except Exception as e:
    print(e)
