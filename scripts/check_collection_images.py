# -*- coding: utf-8 -*-
import json
from pathlib import Path
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

json_path = Path('public/data/lvt_colors_complete.json')
base_images_path = Path('public/images/products/lvt/colors')

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

collection = 'creation-55-looselay'
colors = [c for c in data['colors'] if c['collection'] == collection][:3]

print(f"\nProveravam {collection}:\n")
for color in colors:
    texture_url = color.get('texture_url', '')
    if texture_url:
        # Ukloni query string
        clean_url = texture_url.split('?')[0]
        # Ukloni leading /images/products/lvt/colors/
        if clean_url.startswith('/images/products/lvt/colors/'):
            rel_path = clean_url[len('/images/products/lvt/colors/'):]
            image_path = base_images_path / rel_path
        else:
            image_path = base_images_path / clean_url.lstrip('/')
        exists = image_path.exists()
        print(f"{color['code']} {color['name']}:")
        print(f"  URL: {texture_url}")
        print(f"  Path: {image_path}")
        print(f"  Exists: {exists}")
        if not exists:
            # Proveri da li folder postoji
            folder = image_path.parent
            print(f"  Folder exists: {folder.exists()}")
            if folder.exists():
                files = list(folder.glob('*.jpg'))
                print(f"  Files in folder: {len(files)}")
                if files:
                    print(f"  First file: {files[0].name}")
        print()
