import json
import os

path = 'public/data/carpet_tiles_complete.json'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for c in data['colors']:
        name_parts = c['name'].upper().split()
        col_parts = c['collection'].upper().replace('-', ' ').split()
        code = c['code'].upper()
        
        # Filter out collection words and code
        color_name_parts = []
        for p in name_parts:
            if p not in col_parts and p != code:
                color_name_parts.append(p)
        
        color_slug_part = "-".join(color_name_parts).lower()
        new_slug = f"{c['collection']}-{c['code']}-{color_slug_part}".strip('-')
        c['slug'] = new_slug
        
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Slugs fixed.")
else:
    print("File not found.")
