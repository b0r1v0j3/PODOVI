#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dodaje SVE nedostajuće karakteristike: LRV, Unit/box, Wear layer
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

try:
    import pdfplumber
    has_pdf = True
except ImportError:
    print('⚠️  pdfplumber nije instaliran')
    has_pdf = False

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Extract LRV from technical datasheets
lvt_dir = Path('downloads/product_descriptions/lvt')
docs_dir = Path('downloads/gerflor_documents')

# Build index: code -> collection -> color
by_code_collection = {}
for c in colors:
    code = c.get('code', '').strip()
    collection = c.get('collection', '').strip()
    if code and collection:
        key = f"{code}|{collection}"
        by_code_collection[key] = c

print(f'Index: {len(by_code_collection)} boja\n')

# 1. Add LRV from existing specs files
lrv_added = 0
wear_added = 0
packaging_added = 0

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
        
        if not color:
            continue
        
        # Ensure specs dict exists
        if not color.get('specs'):
            color['specs'] = {}
        
        if not color.get('characteristics'):
            color['characteristics'] = {}
        
        # Add wear layer
        wear_layer = specs.get('THICKNESS OF THE WEARLAYER')
        if wear_layer:
            if not color['specs'].get('THICKNESS OF THE WEARLAYER'):
                color['specs']['THICKNESS OF THE WEARLAYER'] = wear_layer
                wear_added += 1
            if 'Debljina sloja habanja' not in color['characteristics']:
                color['characteristics']['Debljina sloja habanja'] = wear_layer
        
        # Add LRV if available
        lrv = specs.get('LRV')
        if lrv:
            if not color['specs'].get('LRV'):
                color['specs']['LRV'] = lrv
                lrv_added += 1
            if 'LRV' not in color['characteristics']:
                color['characteristics']['LRV'] = lrv
        
        # Add packaging if available
        packaging = specs.get('PACKAGING') or specs.get('NUMBER OF PLANKS')
        if packaging:
            if not color['specs'].get('PACKAGING'):
                color['specs']['PACKAGING'] = packaging
                packaging_added += 1
            if 'Pakovanje' not in color['characteristics']:
                color['characteristics']['Pakovanje'] = packaging

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Dodato:')
print(f'   - Wear layer: {wear_added}')
print(f'   - LRV: {lrv_added}')
print(f'   - Pakovanje: {packaging_added}')
