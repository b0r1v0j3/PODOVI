#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popunjava creation-70-clic - proverava matching
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Find creation-70-clic colors
clic_colors = [c for c in colors if c.get('collection') == 'creation-70-clic']
print(f'Creation-70-clic: {len(clic_colors)} boja\n')

# Check what's missing
missing = []
for c in clic_colors:
    code = c.get('code', '')
    name = c.get('name', '')
    has_desc = bool(c.get('description'))
    has_dim = bool(c.get('dimension'))
    has_format = bool(c.get('format'))
    has_thick = bool(c.get('overall_thickness'))
    
    if not has_desc or not has_dim or not has_format or not has_thick:
        missing.append({
            'code': code,
            'name': name,
            'has_desc': has_desc,
            'has_dim': has_dim,
            'has_format': has_format,
            'has_thick': has_thick
        })

print(f'Nedostaje za {len(missing)} boja:\n')
for m in missing[:10]:
    print(f"  {m['code']} {m['name']}: desc={m['has_desc']}, dim={m['has_dim']}, format={m['has_format']}, thick={m['has_thick']}")

# Try to load creation-70-clic-5mm-new-collection files
print('\n=== LOADING EXTRACTED DATA ===')
try:
    colors_file = json.load(open('downloads/product_descriptions/lvt/creation-70-clic-5mm-new-collection_colors.json', 'r', encoding='utf-8'))
    desc_file = json.load(open('downloads/product_descriptions/lvt/creation-70-clic-5mm-new-collection_descriptions.json', 'r', encoding='utf-8'))
    
    extracted_colors = colors_file.get('colors', [])
    extracted_descs = desc_file.get('colors', [])
    
    print(f'Extracted: {len(extracted_colors)} boja sa specs, {len(extracted_descs)} sa opisima\n')
    
    # Build index by code
    by_code = {c.get('code', '').strip(): c for c in clic_colors if c.get('code')}
    
    updated = 0
    for ec in extracted_colors:
        slug = ec.get('slug', '')
        specs = ec.get('specs', {})
        
        codes = re.findall(r'\b(\d{4})\b', slug)
        if not codes:
            continue
        
        code = codes[0] if codes[0] != '2025' else (codes[1] if len(codes) > 1 else None)
        if not code:
            continue
        
        color = by_code.get(code)
        if not color:
            print(f'  Nije pronađeno: {code} (slug: {slug[:50]}...)')
            continue
        
        # Add specs
        if specs:
            if specs.get('DIMENSION') and not color.get('dimension'):
                color['dimension'] = specs.get('DIMENSION')
                updated += 1
            if specs.get('FORMAT DETAILS') or specs.get('FORMAT'):
                fmt = specs.get('FORMAT DETAILS') or specs.get('FORMAT')
                if fmt and not color.get('format'):
                    color['format'] = fmt
                    updated += 1
            if specs.get('OVERALL THICKNESS') and not color.get('overall_thickness'):
                color['overall_thickness'] = specs.get('OVERALL THICKNESS')
                updated += 1
    
    print(f'\n✅ Ažurirano: {updated} boja')
    
except Exception as e:
    print(f'Greška: {e}')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
