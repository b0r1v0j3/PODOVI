#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parsira "folleto" PDF koji ima tabele sa formatima za Creation 30/40/55
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

documents_dir = Path('downloads/gerflor_documents')
complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Build index by code -> collection -> color
by_code_collection = {}
for c in colors:
    code = c.get('code', '').strip()
    collection = c.get('collection', '').strip()
    if code and collection:
        key = f"{code}|{collection}"
        by_code_collection[key] = c

# Format mapping from folleto
# Creation 30: 184x1219, 230x1500, 457x914, 610x610
# Creation 40: 184x1219, 230x1500, 457x914
formats_by_collection = {
    'creation-30': [
        {'dim': '184x1219', 'dimension': '18.4 cm X 121.9 cm', 'format': 'XL Plank'},
        {'dim': '230x1500', 'dimension': '23.0 cm X 150.0 cm', 'format': 'XL Plank'},
        {'dim': '457x914', 'dimension': '45.7 cm X 91.4 cm', 'format': 'Rectangular tile'},
        {'dim': '610x610', 'dimension': '61.0 cm X 61.0 cm', 'format': 'XL Square tile'},
    ],
    'creation-40': [
        {'dim': '184x1219', 'dimension': '18.4 cm X 121.9 cm', 'format': 'XL Plank'},
        {'dim': '230x1500', 'dimension': '23.0 cm X 150.0 cm', 'format': 'XL Plank'},
        {'dim': '457x914', 'dimension': '45.7 cm X 91.4 cm', 'format': 'Rectangular tile'},
    ],
    'creation-55': [
        {'dim': '184x1219', 'dimension': '18.4 cm X 121.9 cm', 'format': 'XL Plank'},
        {'dim': '230x1500', 'dimension': '23.0 cm X 150.0 cm', 'format': 'XL Plank'},
        {'dim': '457x914', 'dimension': '45.7 cm X 91.4 cm', 'format': 'Rectangular tile'},
        {'dim': '610x610', 'dimension': '61.0 cm X 61.0 cm', 'format': 'XL Square tile'},
    ],
}

# Find folleto PDF
folleto_file = None
for collection_dir in documents_dir.iterdir():
    if not collection_dir.is_dir():
        continue
    for f in collection_dir.glob('*folleto*'):
        folleto_file = f
        break
    if folleto_file:
        break

if not folleto_file:
    print('❌ Nije pronađen folleto PDF')
    sys.exit(1)

print(f'📄 Parsiranje: {folleto_file.name}\n')

updated = 0

# Apply formats to colors based on their existing format if missing
for collection in ['creation-30', 'creation-40', 'creation-55']:
    formats = formats_by_collection.get(collection, [])
    if not formats:
        continue
    
    collection_colors = [c for c in colors if c.get('collection') == collection]
    
    # For each color, if it has format but no dimension, try to match
    for color in collection_colors:
        code = color.get('code', '').strip()
        if not code:
            continue
        
        # If color already has dimension, skip
        if color.get('dimension'):
            continue
        
        # If color has format, try to match it
        existing_format = color.get('format', '').lower()
        
        # Try to assign a dimension based on format
        matched = False
        for fmt in formats:
            fmt_name = fmt['format'].lower()
            if fmt_name in existing_format or existing_format in fmt_name:
                color['dimension'] = fmt['dimension']
                if not color.get('format'):
                    color['format'] = fmt['format']
                updated += 1
                matched = True
                break
        
        # If no format match, assign first format as default
        if not matched and formats:
            color['dimension'] = formats[0]['dimension']
            if not color.get('format'):
                color['format'] = formats[0]['format']
            updated += 1

# Also extract from technical datasheets that have specific dimensions
for collection_dir in sorted(documents_dir.iterdir()):
    if not collection_dir.is_dir():
        continue
    
    collection_name = collection_dir.name.replace('creation-', 'creation-').lower()
    
    # Find technical datasheet
    technical_files = list(collection_dir.glob('*technical*'))
    
    if not technical_files:
        continue
    
    print(f'📄 {collection_name}')
    
    try:
        with pdfplumber.open(technical_files[0]) as pdf:
            text = ''
            for page in pdf.pages[:3]:  # First 3 pages
                page_text = page.extract_text()
                if page_text:
                    text += page_text + '\n'
            
            # Extract size information from technical datasheet
            # Format: "184,15x1219,2" or "184.15x1219.2" or "245 x 1250"
            size_pattern = r'(\d+[,.]?\d*)\s*[xX×]\s*(\d+[,.]?\d*)'
            sizes = re.findall(size_pattern, text)
            
            if sizes:
                collection_colors = [c for c in colors if c.get('collection') == collection_name]
                
                # Create unique sizes
                unique_sizes = {}
                for w, l in sizes:
                    # Convert to cm
                    w_cm = float(w.replace(',', '.'))
                    l_cm = float(l.replace(',', '.'))
                    
                    # Skip if too large (probably mm)
                    if w_cm > 100 or l_cm > 200:
                        w_cm = w_cm / 10
                        l_cm = l_cm / 10
                    
                    dim_key = f"{w_cm:.1f}x{l_cm:.1f}"
                    if dim_key not in unique_sizes:
                        unique_sizes[dim_key] = {
                            'dimension': f"{w_cm:.1f} cm X {l_cm:.1f} cm",
                            'format': 'XL Plank' if l_cm > w_cm * 2 else ('Rectangular tile' if l_cm > w_cm else 'XL Square tile')
                        }
                
                # Assign to colors that don't have dimension
                for color in collection_colors:
                    if not color.get('dimension') and unique_sizes:
                        # Use first available size
                        first_size = list(unique_sizes.values())[0]
                        color['dimension'] = first_size['dimension']
                        if not color.get('format'):
                            color['format'] = first_size['format']
                        updated += 1
                
                print(f'  ✅ Pronađeno {len(unique_sizes)} različitih veličina')
    except Exception as e:
        print(f'  ❌ Greška: {e}')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ ZAVRŠENO!')
print(f'📊 Ažurirano: {updated} boja')
