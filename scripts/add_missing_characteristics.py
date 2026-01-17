#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dodaje nedostajuće karakteristike: wearlayer thickness, unit/box, LRV
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Load specs from _colors.json files
lvt_dir = Path('downloads/product_descriptions/lvt')

# Build index: code -> collection -> specs
specs_by_code_collection = {}

for file in sorted(lvt_dir.glob('*_colors.json')):
    collection_name = file.stem.replace('_colors', '')
    collection_name = collection_name.replace('new-collection', '').replace('new-2025-', '').strip('-')
    
    data = json.load(open(file, 'r', encoding='utf-8'))
    extracted_colors = data.get('colors', [])
    
    for ec in extracted_colors:
        slug = ec.get('slug', '')
        specs = ec.get('specs', {})
        
        if not specs:
            continue
        
        code_match = re.search(r'(\d{4})', slug)
        if not code_match:
            continue
        
        code = code_match.group(1)
        key = f"{code}|{collection_name}"
        specs_by_code_collection[key] = specs

print(f'Učitano specs za {len(specs_by_code_collection)} boja\n')

# Add missing characteristics
updated = 0

for color in colors:
    code = color.get('code', '').strip()
    collection = color.get('collection', '')
    
    if not code or not collection:
        continue
    
    # Find specs
    key = f"{code}|{collection}"
    specs = specs_by_code_collection.get(key)
    
    if not specs:
        # Try variations
        for k, v in specs_by_code_collection.items():
            if k.startswith(f"{code}|"):
                coll = k.split('|')[1]
                if collection in coll or coll in collection:
                    specs = v
                    break
    
    if not specs:
        continue
    
    # Ensure color.specs exists
    if not color.get('specs'):
        color['specs'] = {}
    
    changed = False
    
    # Add THICKNESS OF THE WEARLAYER
    wear_thick = specs.get('THICKNESS OF THE WEARLAYER')
    if wear_thick and not color['specs'].get('THICKNESS OF THE WEARLAYER'):
        color['specs']['THICKNESS OF THE WEARLAYER'] = wear_thick
        # Also add to characteristics if exists
        if not color.get('characteristics'):
            color['characteristics'] = {}
        color['characteristics']['Debljina sloja habanja'] = wear_thick
        changed = True
    
    # Add packaging (Unit/box) if available
    # Try to extract from description or other sources
    if specs.get('PACKAGING') and not color['specs'].get('PACKAGING'):
        color['specs']['PACKAGING'] = specs['PACKAGING']
        if not color.get('characteristics'):
            color['characteristics'] = {}
        color['characteristics']['Pakovanje'] = specs['PACKAGING']
        changed = True
    
    # LRV - will be extracted separately from technical datasheets
    
    if changed:
        updated += 1
        if updated <= 10:
            print(f'✅ {collection} {code} - dodati wear layer i/ili pakovanje')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Ažurirano: {updated} proizvoda sa novim karakteristikama')
