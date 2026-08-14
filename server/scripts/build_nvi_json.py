import os
import re
import json

TXT_FILE = "data/BIBLIA NUEVA VERSIÓN INTERNACIONAL (NVI) 2015.txt"
OUTPUT_DIR = "data/local_bibles/spa_nvi"

# Diccionario completo de 66 libros
BOOKS = {
    "GÉNESIS": "GEN", "ÉXODO": "EXO", "LEVÍTICO": "LEV", "NÚMEROS": "NUM", "DEUTERONOMIO": "DEU",
    "JOSUÉ": "JOS", "JUECES": "JDG", "RUT": "RUT", "1 SAMUEL": "1SA", "2 SAMUEL": "2SA",
    "1 REYES": "1KI", "2 REYES": "2KI", "1 CRÓNICAS": "1CH", "2 CRÓNICAS": "2CH", "ESDRAS": "EZR",
    "NEHEMÍAS": "NEH", "ESTER": "EST", "JOB": "JOB", "SALMOS": "PSA", "PROVERBIOS": "PRO",
    "ECLESIASTÉS": "ECC", "CANTARES": "SNG", "ISAÍAS": "ISA", "JEREMÍAS": "JER", "LAMENTACIONES": "LAM",
    "EZEQUIEL": "EZK", "DANIEL": "DAN", "OSEAS": "HOS", "JOEL": "JOL", "AMÓS": "AMO",
    "ABDÍAS": "OBA", "JONÁS": "JON", "MIQUEAS": "MIC", "NAHUM": "NAM", "HABACUC": "HAB",
    "SOFONÍAS": "ZEP", "HAGEO": "HAG", "ZACARÍAS": "ZEC", "MALAQUÍAS": "MAL",
    "MATEO": "MAT", "MARCOS": "MRK", "LUCAS": "LUK", "JUAN": "JHN", "HECHOS": "ACT",
    "ROMANOS": "ROM", "1 CORINTIOS": "1CO", "2 CORINTIOS": "2CO", "GÁLATAS": "GAL", "EFESIOS": "EPH",
    "FILIPENSES": "PHP", "COLOSENSES": "COL", "1 TESALONICENSES": "1TH", "2 TESALONICENSES": "2TH",
    "1 TIMOTEO": "1TI", "2 TIMOTEO": "2TI", "TITO": "TIT", "FILEMÓN": "PHM", "HEBREOS": "HEB",
    "SANTIAGO": "JAS", "1 PEDRO": "1PE", "2 PEDRO": "2PE", "1 JUAN": "1JN", "2 JUAN": "2JN",
    "3 JUAN": "3JN", "JUDAS": "JUD", "APOCALIPSIS": "REV"
}

def parse_bible():
    if not os.path.exists(TXT_FILE):
        print(f"No se encontró {TXT_FILE}")
        return

    with open(TXT_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    current_book_usfm = None
    current_chapter = None
    parsed_data = {}
    
    verse_regex = re.compile(r"^(\d+)\s+(.+)")
    
    # Heurística muy básica
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Detectar Libro
        book_found = False
        for book_name, book_usfm in BOOKS.items():
            if line.upper().startswith(book_name):
                current_book_usfm = book_usfm
                current_chapter = None
                if current_book_usfm not in parsed_data:
                    parsed_data[current_book_usfm] = {}
                book_found = True
                break
                
        if book_found:
            continue
        
        # Detectar Capítulo (un número solo en una línea, usualmente después de un título)
        if current_book_usfm and line.isdigit():
            current_chapter = line
            if current_chapter not in parsed_data[current_book_usfm]:
                parsed_data[current_book_usfm][current_chapter] = []
            continue
            
        # Detectar versículo
        if current_book_usfm and current_chapter:
            match = verse_regex.match(line)
            if match:
                v_num = int(match.group(1))
                v_text = match.group(2)
                parsed_data[current_book_usfm][current_chapter].append({
                    "number": v_num,
                    "text": v_text
                })
            else:
                # Si no empieza con número, y ya hay versículos, se lo sumamos al último (texto multilínea)
                if len(parsed_data[current_book_usfm][current_chapter]) > 0:
                    parsed_data[current_book_usfm][current_chapter][-1]["text"] += " " + line

    print("Guardando archivos JSON...")
    for usfm, chapters in parsed_data.items():
        book_dir = os.path.join(OUTPUT_DIR, usfm)
        os.makedirs(book_dir, exist_ok=True)
        
        for chapter, verses in chapters.items():
            chapter_file = os.path.join(book_dir, f"{chapter}.json")
            
            # Limpiar posibles versículos duplicados o mal parseados
            unique_verses = {}
            for v in verses:
                if v["number"] not in unique_verses:
                    unique_verses[v["number"]] = v
                else:
                    unique_verses[v["number"]]["text"] += " " + v["text"]
            
            final_verses = list(unique_verses.values())
            final_verses.sort(key=lambda x: x["number"])

            hello_ao_structure = {
                "chapter": {
                    "content": [{"type": "verse", "number": v["number"], "content": [v["text"]]} for v in final_verses]
                }
            }
            
            with open(chapter_file, "w", encoding="utf-8") as out_f:
                json.dump(hello_ao_structure, out_f, ensure_ascii=False, indent=2)

    print(f"¡Parseo de NVI completado! Archivos guardados en {OUTPUT_DIR}")

if __name__ == "__main__":
    parse_bible()
