#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
1. Popunjava creation-70-looselay (ima podatke u new-2025-creation-70-looselay_colors.json)
2. Dodaje format za sve kolekcije koje nemaju
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

looselay_updated = 0
format_added = 0

# 1. Fix creation-70-looselay
print('=== CREATION-70-LOOSELAY ===')
looselay_file = Path('downloads/product_descriptions/lvt/new-2025-creation-70-looselay_colors.json')
if looselay_file.exists():
    data = json.load(open(looselay_file, 'r', encoding='utf-8'))
    extracted = data.get('colors', [])
    
    for ec in extracted:
        slug = ec.get('slug', '')
        desc = ec.get('description', {})
        specs = ec.get('specs', {})
        
        # Extract code from slug like "new-2025-creation-70-looselay-0060-arena-39770060"
        code_match = re.search(r'(\d{4})', slug)
        if not code_match:
            continue
        
        code = code_match.group(1)
        key = f"{code}|creation-70-looselay"
        color = by_code_collection.get(key)
        
        if color:
            # Add description (use full_text if intro_text is null)
            if desc:
                intro = desc.get('intro_text')
                if not intro:
                    full = desc.get('full_text', '')
                    if full:
                        # Use first sentence or first 200 chars
                        lines = full.split('\n')
                        intro = lines[0] if lines else full[:200]
                if intro and len(intro) > 20:
                    color['description'] = intro
                    looselay_updated += 1
            
            # Add specs
            if specs:
                dim = specs.get('DIMENSION')
                if dim and not color.get('dimension'):
                    color['dimension'] = dim
                    looselay_updated += 1
                
                fmt = specs.get('FORMAT DETAILS') or specs.get('FORMAT')
                if fmt and not color.get('format'):
                    color['format'] = fmt
                    looselay_updated += 1
                
                thick = specs.get('OVERALL THICKNESS')
                if thick and not color.get('overall_thickness'):
                    color['overall_thickness'] = thick
                    looselay_updated += 1

print(f'  Ažurirano: {looselay_updated} boja')

# 2. Add format for collections missing it
print('\n=== ADDING FORMAT ===')
collections_needing_format = [
    'creation-55-looselay',
    'creation-55-looselay-acoustic',
    'creation-55-zen',
    'creation-70-connect',
    'creation-70-megaclic',
    'creation-70-zen',
    'creation-saga2'
]

# Try to infer format from dimension
for color in colors:
    coll = color.get('collection', '')
    if coll not in collections_needing_format:
        continue
    
    if color.get('format'):
        continue
    
    dim = color.get('dimension', '')
    if not dim:
        continue
    
    # Infer format from dimension
    # Square tiles: similar width and length
    # Planks: longer than wide
    # Tiles: rectangular but not too long
    
    try:
        # Parse dimension like "22.86 cm X 122 cm"
        parts = dim.split('X')
        if len(parts) == 2:
            w = float(parts[0].replace('cm', '').strip())
            l = float(parts[1].replace('cm', '').strip())
            
            ratio = l / w if w > 0 else 1
            
            if 0.9 <= ratio <= 1.1:
                # Square
                if w >= 60:
                    color['format'] = 'XL Square tile'
                else:
                    color['format'] = 'Square tile'
                format_added += 1
            elif ratio > 2:
                # Plank
                if w >= 20:
                    color['format'] = 'XL Plank'
                else:
                    color['format'] = 'Plank'
                format_added += 1
            else:
                # Rectangular tile
                color['format'] = 'Rectangular tile'
                format_added += 1
    except:
        pass

print(f'  Dodato format: {format_added} boja')

# Save
json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ ZAVRŠENO!')
print(f'  Looselay: +{looselay_updated}')
print(f'  Format: +{format_added}')
