#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Direktno popunjava creation-70-looselay koristeći code iz slug-a
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Build index: code -> collection -> color
by_code = {}
for c in colors:
    code = c.get('code', '').strip()
    collection = c.get('collection', '').strip()
    if code and collection == 'creation-70-looselay':
        by_code[code] = c

print(f'Creation-70-looselay: {len(by_code)} boja\n')

# Load extracted data
looselay_file = Path('downloads/product_descriptions/lvt/new-2025-creation-70-looselay_colors.json')
data = json.load(open(looselay_file, 'r', encoding='utf-8'))
extracted = data.get('colors', [])

updated = 0

for ec in extracted:
    slug = ec.get('slug', '')
    desc = ec.get('description', {})
    specs = ec.get('specs', {})
    
    # Extract code from slug like "new-2025-creation-70-looselay-0060-arena-39770060"
    # Find 4-digit code
    codes = re.findall(r'\b(\d{4})\b', slug)
    if not codes:
        continue
    
    # Use first 4-digit code that's not 2025
    code = None
    for c in codes:
        if c != '2025':
            code = c
            break
    
    if not code:
        continue
    
    color = by_code.get(code)
    if not color:
        print(f'  Nije pronađeno: {code} (slug: {slug})')
        continue
    
    # Add description
    if desc and not color.get('description'):
        full = desc.get('full_text', '')
        if full:
            # Use first meaningful sentence
            lines = full.split('\n')
            intro = lines[0] if lines and len(lines[0]) > 20 else full[:200]
            color['description'] = intro
            updated += 1
    
    # Add specs
    if specs:
        dim = specs.get('DIMENSION')
        if dim and not color.get('dimension'):
            color['dimension'] = dim
            updated += 1
        
        fmt = specs.get('FORMAT DETAILS') or specs.get('FORMAT')
        if fmt and not color.get('format'):
            color['format'] = fmt
            updated += 1
        
        thick = specs.get('OVERALL THICKNESS')
        if thick and not color.get('overall_thickness'):
            color['overall_thickness'] = thick
            updated += 1

print(f'✅ Ažurirano: {updated} boja')

# Save
json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
