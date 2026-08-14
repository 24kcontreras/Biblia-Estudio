import json
import os
import shutil

# Rutas de entrada
NVI_PATH = "data/temp_bible_repo/data/es___spa___spa/NVI_vid_128.json"
RV1960_PATH = "data/temp_bible_repo/data/es___spa___spa/RVR1960_vid_149.json"

# Rutas de salida
OUT_NVI = "data/local_bibles/spa_nvi"
OUT_RV1960 = "data/local_bibles/spa_rv1960"

def convert_bible(in_file, out_dir):
    print(f"Procesando {in_file}...")
    if os.path.exists(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    
    with open(in_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for book in data.get('books', []):
        usfm = book.get('book_usfm')
        if not usfm: continue
        
        book_dir = os.path.join(out_dir, usfm)
        os.makedirs(book_dir, exist_ok=True)
        
        for chapter in book.get('chapters', []):
            usfm_chap = chapter.get('chapter_usfm', '')
            if not '.' in usfm_chap: continue
            chap_num = usfm_chap.split('.')[-1]
            items = chapter.get('items', [])
            
            content_dict = {}
            for item in items:
                if item.get('type') == 'verse':
                    v_nums = item.get('verse_numbers', [])
                    if v_nums:
                        num = v_nums[0]
                        if num not in content_dict:
                            content_dict[num] = {"type": "verse", "number": num, "content": []}
                        content_dict[num]["content"].extend(item.get('lines', []))
            
            content = list(content_dict.values())
            
            # Solo guardamos si hay versículos
            if content:
                chap_data = {
                    "chapter": {
                        "content": content
                    }
                }
                
                out_file = os.path.join(book_dir, f"{chap_num}.json")
                with open(out_file, 'w', encoding='utf-8') as f_out:
                    json.dump(chap_data, f_out, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    convert_bible(NVI_PATH, OUT_NVI)
    convert_bible(RV1960_PATH, OUT_RV1960)
    print("¡Conversión completada!")
