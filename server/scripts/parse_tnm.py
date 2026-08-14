import os
import json
from bs4 import BeautifulSoup
import re
import warnings
from bs4 import XMLParsedAsHTMLWarning
warnings.filterwarnings('ignore', category=XMLParsedAsHTMLWarning)

USFM_MAP = {
    "génesis": "GEN", "éxodo": "EXO", "levítico": "LEV", "números": "NUM", "deuteronomio": "DEU",
    "josué": "JOS", "jueces": "JDG", "rut": "RUT", "1 samuel": "1SA", "2 samuel": "2SA",
    "1 reyes": "1KI", "2 reyes": "2KI", "1 crónicas": "1CH", "2 crónicas": "2CH",
    "esdras": "EZR", "nehemías": "NEH", "ester": "EST", "job": "JOB", "salmos": "PSA",
    "proverbios": "PRO", "eclesiastés": "ECC", "el cantar de los cantares": "SNG",
    "isaías": "ISA", "jeremías": "JER", "lamentaciones": "LAM", "ezequiel": "EZK",
    "daniel": "DAN", "oseas": "HOS", "joel": "JOL", "amós": "AMO", "abdías": "OBA",
    "jonás": "JON", "miqueas": "MIC", "nahúm": "NAM", "habacuc": "HAB", "sofonías": "ZEP",
    "hageo": "HAG", "zacarías": "ZEC", "malaquías": "MAL", "mateo": "MAT", "marcos": "MRK",
    "lucas": "LUK", "juan": "JHN", "hechos": "ACT", "romanos": "ROM", "1 corintios": "1CO",
    "2 corintios": "2CO", "gálatas": "GAL", "efesios": "EPH", "filipenses": "PHP",
    "colosenses": "COL", "1 tesalonicenses": "1TH", "2 tesalonicenses": "2TH",
    "1 timoteo": "1TI", "2 timoteo": "2TI", "tito": "TIT", "filemón": "PHM",
    "hebreos": "HEB", "santiago": "JAS", "1 pedro": "1PE", "2 pedro": "2PE",
    "1 juan": "1JN", "2 juan": "2JN", "3 juan": "3JN", "judas": "JUD", "apocalipsis": "REV"
}

def clean_text(element):
    # Remove footnotes
    for fn in element.find_all('a', {'epub:type': 'noteref'}):
        fn.decompose()
    # Remove footnote sources
    for span in element.find_all('span', id=re.compile(r'^footnotesource')):
        span.decompose()
    # Extract text
    text = element.get_text(separator=' ', strip=True)
    # Remove leading verse numbers (e.g. "1 " or "2 ")
    text = re.sub(r'^\d+\s*', '', text)
    return text

def parse_epub(epub_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    
    current_book = None
    current_chapter = None
    
    # Store verses: { usfm: { chapter_num: { verse_num: [text1, text2...] } } }
    bible_data = {}
    
    files = [f for f in os.listdir(epub_dir) if f.endswith('.xhtml')]
    files.sort()
    
    for filename in files:
        filepath = os.path.join(epub_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'xml')
            
        # Identify book
        nav_p = soup.find('p', class_='w_biblebookname')
        if nav_p:
            book_a = nav_p.find('a')
            if book_a:
                bname = book_a.text.strip().lower()
                current_book = USFM_MAP.get(bname)
                
        if not current_book:
            continue
            
        if current_book not in bible_data:
            bible_data[current_book] = {}
            
        # Iterate over all paragraphs with class starting with 'p' (p2, p3, p4...)
        for p in soup.find_all('p'):
            classes = p.get('class', [])
            if not any(c.startswith('p') for c in classes) and not p.get('id'):
                continue
                
            # Find chapter and verse markers
            # A single paragraph can contain multiple verses
            for child in p.children:
                if child.name == 'span' and child.get('id'):
                    span_id = child.get('id')
                    match = re.match(r'^chapter(\d+)_verse(\d+)$', span_id)
                    if match:
                        current_chapter = int(match.group(1))
                        current_verse = int(match.group(2))
                        
                        if current_chapter not in bible_data[current_book]:
                            bible_data[current_book][current_chapter] = {}
                        if current_verse not in bible_data[current_book][current_chapter]:
                            bible_data[current_book][current_chapter][current_verse] = []
                            
            # If we are currently in a verse, add the text of the paragraph
            # We must be careful because paragraphs can have multiple spans.
            # Actually, the easiest way is to find all text nodes between chapterX_verseY markers.
            
    # Second pass: robust text extraction
    for filename in files:
        filepath = os.path.join(epub_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')
            
        nav_p = soup.find('p', class_=re.compile('w_biblebookname'))
        if nav_p:
            book_a = nav_p.find('a')
            if book_a:
                bname = book_a.text.strip().lower()
                current_book = USFM_MAP.get(bname)
                
        if not current_book:
            continue
            
        if current_book not in bible_data:
            bible_data[current_book] = {}
            
        # We will iterate through all elements in the body
        for element in soup.body.descendants:
            if element.name == 'span' and element.get('id'):
                span_id = element.get('id')
                match = re.match(r'^chapter(\d+)_verse(\d+)$', span_id)
                if match:
                    current_chapter = int(match.group(1))
                    current_verse = int(match.group(2))
                    continue
                    
            if element.name is None: # it's a NavigableString
                text = str(element).strip()
                if text and current_chapter and current_verse:
                    # check if parent is footnote, if so skip
                    if element.find_parent('a', {'epub:type': 'noteref'}):
                        continue
                    if element.find_parent('span', id=re.compile(r'^footnotesource')):
                        continue
                    
                    # remove standalone numbers
                    if re.match(r'^\d+$', text) and element.parent.name in ['strong', 'sup']:
                        continue
                        
                    if current_chapter not in bible_data[current_book]:
                        bible_data[current_book][current_chapter] = {}
                    if current_verse not in bible_data[current_book][current_chapter]:
                        bible_data[current_book][current_chapter][current_verse] = []
                        
                    # append text
                    bible_data[current_book][current_chapter][current_verse].append(text)

    # Save to JSON
    for usfm, chapters in bible_data.items():
        book_dir = os.path.join(out_dir, usfm)
        os.makedirs(book_dir, exist_ok=True)
        for ch, verses in chapters.items():
            content = []
            for v_num, v_texts in verses.items():
                merged = " ".join(v_texts)
                merged = re.sub(r'\s+', ' ', merged).strip()
                if merged:
                    content.append({
                        "type": "verse",
                        "number": v_num,
                        "content": [merged]
                    })
            
            with open(os.path.join(book_dir, f"{ch}.json"), 'w', encoding='utf-8') as f:
                json.dump({"chapter": {"content": content}}, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    parse_epub('data/tnm_epub/OEBPS', 'data/local_bibles/spa_tnm')
    print("Extracción completada.")
