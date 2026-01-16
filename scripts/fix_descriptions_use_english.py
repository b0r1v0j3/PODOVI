#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Koristi ČISTE ENGLESKE tekstove iz _descriptions.json fajlova (intro_text)
Zadržava postojeće dimension/format/thickness (ne menja ih)
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Build index by code AND collection
by_code_collection = {}
for c in colors:
    code = c.get('code')
    collection = c.get('collection', '')
    if code and collection:
        key = f"{code}-{collection}"
        by_code_collection[key] = c

print(f'Index: {len(by_code_collection)}\n')

total_updated = 0

# Use _descriptions.json files (clean English)
lvt_dir = Path('downloads/product_descriptions/lvt')
for file in sorted(lvt_dir.glob('*_descriptions.json')):
    collection_from_file = file.stem.replace('_descriptions', '')
    
    data = json.load(open(file, 'r', encoding='utf-8'))
    old_colors = data.get('colors', [])
    
    updated = 0
    for oc in old_colors:
        slug = oc.get('slug', '')
        desc = oc.get('description', {})
        
        if not desc:
            continue
        
        # Extract code
        code_match = re.search(r'(\d{4})', slug)
        if not code_match:
            continue
        
        code = code_match.group(1)
        
        # Find in complete by code and collection
        key = f"{code}-{collection_from_file}"
        color = by_code_collection.get(key)
        
        if color:
            # Use intro_text (clean English, one sentence)
            intro = desc.get('intro_text', '')
            if intro and len(intro) > 20:
                color['description'] = intro
                updated += 1
    
    if updated > 0:
        print(f'  {file.name}: +{updated}')
        total_updated += updated

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print(f'\n✅ Zamenjeno sa čistim engleskim: {total_updated} boja')
print('(Zadržani dimension, format, thickness)')
