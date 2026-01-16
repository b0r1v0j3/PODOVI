#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popunjava preostale boje iz postojećih fajlova
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

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

descriptions_added = 0
specs_added = 0

# Process ALL _colors.json files
lvt_dir = Path('downloads/product_descriptions/lvt')
color_files = sorted(lvt_dir.glob('*_colors.json'))

print('=== PROCESSING ALL _colors.json FILES ===')
for file in color_files:
    collection_name = file.stem.replace('_colors', '')
    # Normalize
    collection_name = collection_name.replace('new-collection', '').replace('new-2025-', '').strip('-')
    
    data = json.load(open(file, 'r', encoding='utf-8'))
    extracted_colors = data.get('colors', [])
    
    updated_desc = 0
    updated_specs = 0
    
    for ec in extracted_colors:
        slug = ec.get('slug', '')
        desc = ec.get('description', {})
        specs = ec.get('specs', {})
        
        # Extract code
        codes = re.findall(r'\b(\d{4})\b', slug)
        if not codes:
            continue
        
        code = None
        for c in codes:
            if c != '2025':
                code = c
                break
        
        if not code:
            continue
        
        # Find color - try exact match first
        key = f"{code}|{collection_name}"
        color = by_code_collection.get(key)
        
        if not color:
            # Try fuzzy match
            for k, c in by_code_collection.items():
                if k.startswith(f"{code}|"):
                    coll = k.split('|')[1]
                    if collection_name in coll or coll in collection_name:
                        color = c
                        break
        
        if not color:
            continue
        
        # Add description if missing
        if desc and not color.get('description'):
            intro = desc.get('intro_text')
            if not intro:
                full = desc.get('full_text', '')
                if full:
                    lines = full.split('\n')
                    intro = lines[0] if lines and len(lines[0]) > 20 else full[:200]
            if intro and len(intro) > 20:
                color['description'] = intro
                updated_desc += 1
                descriptions_added += 1
        
        # Add specs if missing
        if specs:
            dim = specs.get('DIMENSION') or specs.get('dimension')
            if dim and not color.get('dimension'):
                color['dimension'] = dim
                updated_specs += 1
                specs_added += 1
            
            fmt = specs.get('FORMAT DETAILS') or specs.get('FORMAT') or specs.get('format')
            if fmt and not color.get('format'):
                color['format'] = fmt
                updated_specs += 1
                specs_added += 1
            
            thick = specs.get('OVERALL THICKNESS') or specs.get('overall_thickness') or specs.get('THICKNESS')
            if thick and not color.get('overall_thickness'):
                color['overall_thickness'] = thick
                updated_specs += 1
                specs_added += 1
    
    if updated_desc > 0 or updated_specs > 0:
        print(f'  {file.name}: +{updated_desc} desc, +{updated_specs} specs')

# Save
json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ ZAVRŠENO!')
print(f'  Descriptions: +{descriptions_added}')
print(f'  Specs: +{specs_added}')
