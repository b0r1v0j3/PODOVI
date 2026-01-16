#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FINALNA INTEGRACIJA - koristi SVE postojeće fajlove:
1. _descriptions.json -> čist engleski intro_text
2. _colors.json -> dimension, format, overall_thickness
3. Uklanja "Kreirajte bez ograničenja"
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Load complete file
complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Build index: code -> collection -> color
by_code_collection = {}
for c in colors:
    code = c.get('code', '').strip()
    collection = c.get('collection', '').strip()
    if code and collection:
        key = f"{code}|{collection}"
        by_code_collection[key] = c

print(f'Index: {len(by_code_collection)} boja\n')

# Stats
descriptions_added = 0
specs_added = 0
kreirajte_removed = 0

# 1. Process _descriptions.json files (clean English intro_text)
lvt_dir = Path('downloads/product_descriptions/lvt')
desc_files = sorted(lvt_dir.glob('*_descriptions.json'))

print('=== DESCRIPTIONS ===')
for file in desc_files:
    collection_name = file.stem.replace('_descriptions', '')
    # Normalize collection name
    collection_name = collection_name.replace('new-collection', '').replace('new-2025-', '').strip('-')
    
    data = json.load(open(file, 'r', encoding='utf-8'))
    old_colors = data.get('colors', [])
    
    updated = 0
    for oc in old_colors:
        slug = oc.get('slug', '')
        desc = oc.get('description', {})
        
        if not desc:
            continue
        
        # Extract code from slug
        code_match = re.search(r'(\d{4})', slug)
        if not code_match:
            continue
        
        code = code_match.group(1)
        
        # Try to find by code + collection
        key = f"{code}|{collection_name}"
        color = by_code_collection.get(key)
        
        if not color:
            # Try variations
            for k, c in by_code_collection.items():
                if k.startswith(f"{code}|"):
                    # Check if collection matches (fuzzy)
                    coll = k.split('|')[1]
                    if collection_name in coll or coll in collection_name:
                        color = c
                        break
        
        if color:
            intro = desc.get('intro_text', '')
            if intro and len(intro) > 20:
                color['description'] = intro
                updated += 1
                descriptions_added += 1
    
    if updated > 0:
        print(f'  {file.name}: +{updated}')

# 2. Process _colors.json files (dimension, format, thickness)
print('\n=== SPECS (dimension, format, thickness) ===')
color_files = sorted(lvt_dir.glob('*_colors.json'))

for file in color_files:
    collection_name = file.stem.replace('_colors', '')
    # Normalize
    collection_name = collection_name.replace('new-collection', '').replace('new-2025-', '').strip('-')
    
    data = json.load(open(file, 'r', encoding='utf-8'))
    extracted_colors = data.get('colors', [])
    
    updated = 0
    for ec in extracted_colors:
        slug = ec.get('slug', '')
        specs = ec.get('specs', {})
        
        if not specs:
            continue
        
        # Extract code
        code_match = re.search(r'(\d{4})', slug)
        if not code_match:
            continue
        
        code = code_match.group(1)
        
        # Find color
        key = f"{code}|{collection_name}"
        color = by_code_collection.get(key)
        
        if not color:
            # Try variations
            for k, c in by_code_collection.items():
                if k.startswith(f"{code}|"):
                    coll = k.split('|')[1]
                    if collection_name in coll or coll in collection_name:
                        color = c
                        break
        
        if color:
            # Update dimension
            dim = specs.get('DIMENSION') or specs.get('dimension')
            if dim and not color.get('dimension'):
                color['dimension'] = dim
                specs_added += 1
            
            # Update format
            fmt = specs.get('FORMAT') or specs.get('format')
            if fmt and not color.get('format'):
                color['format'] = fmt
                specs_added += 1
            
            # Update thickness
            thick = specs.get('OVERALL THICKNESS') or specs.get('overall_thickness') or specs.get('THICKNESS')
            if thick and not color.get('overall_thickness'):
                color['overall_thickness'] = thick
                specs_added += 1
            
            if dim or fmt or thick:
                updated += 1
    
    if updated > 0:
        print(f'  {file.name}: +{updated}')

# 3. Remove "Kreirajte bez ograničenja"
print('\n=== REMOVING "Kreirajte bez ograničenja" ===')
for color in colors:
    desc = color.get('description', '')
    if desc and 'Kreirajte bez ograničenja' in desc:
        color['description'] = desc.replace('Kreirajte bez ograničenja', '').replace('\n\n\n', '\n\n').strip()
        kreirajte_removed += 1

print(f'  Uklonjeno iz {kreirajte_removed} opisa')

# Save
json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ ZAVRŠENO!')
print(f'  Descriptions: +{descriptions_added}')
print(f'  Specs: +{specs_added}')
print(f'  "Kreirajte bez ograničenja" uklonjeno: {kreirajte_removed}')
