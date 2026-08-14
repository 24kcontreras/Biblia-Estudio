import zipfile
import os

epub_path = "data/nwt_S.epub"
extract_dir = "data/tnm_epub"

if not os.path.exists(extract_dir):
    os.makedirs(extract_dir)

with zipfile.ZipFile(epub_path, 'r') as zip_ref:
    zip_ref.extractall(extract_dir)

print("Extracción completada. Archivos principales:")
for f in os.listdir(extract_dir):
    print("-", f)
