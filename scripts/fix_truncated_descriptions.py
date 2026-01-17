#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popravlja skraćene opise - koristi opise iz _colors.json fajlova
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Find truncated descriptions
truncated = []
for color in colors:
    desc = color.get('description', '')
    if desc and len(desc) < 100:
        truncated.append({
            'slug': color.get('slug', ''),
            'collection': color.get('collection', ''),
            'code': color.get('code', ''),
            'desc': desc
        })

print(f'Pronađeno {len(truncated)} skraćenih opisa\n')

# Load full descriptions from _colors.json files
lvt_dir = Path('downloads/product_descriptions/lvt')

# Build index by code -> collection -> full description
full_descriptions = {}

for file in sorted(lvt_dir.glob('*_colors.json')):
    collection_name = file.stem.replace('_colors', '')
    collection_name = collection_name.replace('new-collection', '').replace('new-2025-', '').strip('-')
    
    data = json.load(open(file, 'r', encoding='utf-8'))
    extracted_colors = data.get('colors', [])
    
    for ec in extracted_colors:
        slug = ec.get('slug', '')
        desc = ec.get('description', {})
        
        if not desc:
            continue
        
        code_match = re.search(r'(\d{4})', slug)
        if not code_match:
            continue
        
        code = code_match.group(1)
        key = f"{code}|{collection_name}"
        
        full_text = desc.get('full_text', '')
        if full_text and len(full_text) > 200:
            full_descriptions[key] = full_text

print(f'Učitano {len(full_descriptions)} punih opisa iz fajlova\n')

# Fix truncated descriptions
fixed = 0
for color in colors:
    desc = color.get('description', '')
    if desc and len(desc) < 100:
        code = color.get('code', '')
        collection = color.get('collection', '')
        
        # Try to find full description
        key = f"{code}|{collection}"
        full_desc = full_descriptions.get(key)
        
        if not full_desc:
            # Try variations
            for k, v in full_descriptions.items():
                if k.startswith(f"{code}|"):
                    coll = k.split('|')[1]
                    if collection in coll or coll in collection:
                        full_desc = v
                        break
        
        if full_desc:
            # Translate to Serbian
            full_desc = full_desc.replace('Removable flooring to meet your needs', 'Uklonjivi podovi koji odgovaraju vašim potrebama')
            full_desc = full_desc.replace('Product :', 'Proizvod:')
            full_desc = full_desc.replace('Installation :', 'Ugradnja:')
            full_desc = full_desc.replace('Application :', 'Primena:')
            full_desc = full_desc.replace('Environment :', 'Okruženje:')
            
            color['description'] = full_desc
            fixed += 1
            print(f'✅ {collection} {code} - popravljen opis')

if fixed > 0:
    json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print(f'\n✅ Popravljeno: {fixed} skraćenih opisa')
else:
    print('\n⚠️  Nema skraćenih opisa za popravku')
