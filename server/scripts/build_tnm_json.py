import os
import json

OUTPUT_DIR = "data/local_bibles/spa_tnm"

def parse_tnm():
    book_dir = os.path.join(OUTPUT_DIR, "GEN")
    os.makedirs(book_dir, exist_ok=True)
    
    hello_ao_structure = {
        "chapter": {
            "content": [
                {"type": "verse", "number": 1, "content": ["En el principio Dios creó los cielos y la tierra."]},
                {"type": "verse", "number": 2, "content": ["Ahora bien, la tierra carecía de forma y estaba desierta..."]}
            ]
        }
    }
    
    with open(os.path.join(book_dir, "1.json"), "w", encoding="utf-8") as out_f:
        json.dump(hello_ao_structure, out_f, ensure_ascii=False, indent=2)
        
    print("TNM: Generated dummy GEN chapter 1 to satisfy the ingest script for now.")

if __name__ == "__main__":
    parse_tnm()
