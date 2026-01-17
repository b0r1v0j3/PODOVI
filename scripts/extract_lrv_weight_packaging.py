#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ekstraktuje LRV, Weight, Packaging iz technical datasheet PDF-ova
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

try:
    import pdfplumber
except ImportError:
    print('❌ pdfplumber nije instaliran')
    sys.exit(1)

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Build index
by_collection = {}
for c in colors:
    coll = c.get('collection', '')
    if coll:
        if coll not in by_collection:
            by_collection[coll] = []
        by_collection[coll].append(c)

docs_dir = Path('downloads/gerflor_documents')

lrv_added = 0
weight_added = 0
packaging_added = 0

# Process each collection's technical datasheet
for collection_dir in sorted(docs_dir.iterdir()):
    if not collection_dir.is_dir():
        continue
    
    collection_name = collection_dir.name
    collection_colors = by_collection.get(collection_name, [])
    
    if not collection_colors:
        continue
    
    # Find technical datasheet
    tech_files = list(collection_dir.glob('*technical*'))
    tech_files.extend(collection_dir.glob('*datasheet*'))
    
    if not tech_files:
        continue
    
    print(f'📄 {collection_name}: {tech_files[0].name}')
    
    try:
        with pdfplumber.open(tech_files[0]) as pdf:
            # Extract all text
            full_text = ''
            for page in pdf.pages[:3]:
                text = page.extract_text()
                if text:
                    full_text += text + '\n'
            
            # Extract LRV
            lrv_match = re.search(r'LRV[:\s]+(\d+\.?\d*)', full_text, re.IGNORECASE)
            if lrv_match:
                lrv_value = lrv_match.group(1)
                print(f'  ✅ LRV pronađen: {lrv_value}')
                
                # Add to all colors in collection
                for color in collection_colors:
                    if not color.get('specs'):
                        color['specs'] = {}
                    if not color.get('characteristics'):
                        color['characteristics'] = {}
                    
                    if not color['specs'].get('LRV'):
                        color['specs']['LRV'] = lrv_value
                        color['characteristics']['LRV'] = lrv_value
                        lrv_added += 1
            
            # Extract Weight
            weight_match = re.search(r'Weight.*?(\d+\.?\d*)\s*g/m[²2]', full_text, re.IGNORECASE)
            if weight_match:
                weight_value = f"{weight_match.group(1)} g/m²"
                print(f'  ✅ Weight pronađen: {weight_value}')
                
                for color in collection_colors:
                    if not color.get('specs'):
                        color['specs'] = {}
                    if not color.get('characteristics'):
                        color['characteristics'] = {}
                    
                    if not color['specs'].get('WEIGHT'):
                        color['specs']['WEIGHT'] = weight_value
                        color['characteristics']['Težina'] = weight_value
                        weight_added += 1
            
            # Extract packaging
            packaging_patterns = [
                r'(\d+)\s*/\s*(\d+\.?\d*)\s*m[²2]',  # "14 / 4.29 m²"
                r'(\d+)\s*planks.*?(\d+\.?\d*)\s*m[²2]',
                r'(\d+)\s*tiles.*?(\d+\.?\d*)\s*m[²2]',
            ]
            
            for pattern in packaging_patterns:
                pack_match = re.search(pattern, full_text)
                if pack_match:
                    units = pack_match.group(1)
                    area = pack_match.group(2)
                    packaging_value = f"{units} komada / {area} m²"
                    print(f'  ✅ Pakovanje pronađeno: {packaging_value}')
                    
                    for color in collection_colors:
                        if not color.get('specs'):
                            color['specs'] = {}
                        if not color.get('characteristics'):
                            color['characteristics'] = {}
                        
                        if not color['specs'].get('PACKAGING'):
                            color['specs']['PACKAGING'] = packaging_value
                            color['characteristics']['Pakovanje'] = packaging_value
                            packaging_added += 1
                    break
                    
    except Exception as e:
        print(f'  ❌ Greška: {e}')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Dodato:')
print(f'   - LRV: {lrv_added}')
print(f'   - Težina: {weight_added}')
print(f'   - Pakovanje: {packaging_added}')
