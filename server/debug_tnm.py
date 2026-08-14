import re
from bs4 import BeautifulSoup

with open('data/tnm_epub/OEBPS/1001061105.xhtml', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'xml')

current_chapter = None
current_verse = None
extracted = []

for element in soup.body.descendants:
    if element.name == 'span' and element.get('id'):
        span_id = element.get('id')
        match = re.match(r'^chapter(\d+)_verse(\d+)$', span_id)
        if match:
            current_chapter = int(match.group(1))
            current_verse = int(match.group(2))
            continue
            
    if element.name is None:
        text = str(element).strip()
        if text and current_chapter and current_verse:
            if element.find_parent('a', {'epub:type': 'noteref'}): continue
            if element.find_parent('span', id=re.compile(r'^footnotesource')): continue
            if re.match(r'^\d+$', text) and element.parent.name in ['strong', 'sup']: continue
            
            extracted.append(f"{current_chapter}:{current_verse} -> {text}")

for e in extracted[:10]:
    print(e)
print("Total extracted:", len(extracted))
