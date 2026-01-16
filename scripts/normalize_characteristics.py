#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Normalizuje karakteristike - format, debljina, tip instalacije
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

def normalize_thickness(value):
    """Normalize thickness: '2mm' -> '2.00 mm', '2.5mm' -> '2.50 mm'"""
    if not value:
        return value
    
    # Extract number
    match = re.search(r'(\d+\.?\d*)', str(value))
    if match:
        num = float(match.group(1))
        return f"{num:.2f} mm"
    
    return value

def normalize_installation(value):
    """Normalize installation type"""
    if not value:
        return value
    
    value_lower = value.lower().strip()
    
    translations = {
        'glue down': 'Lepljenje',
        'glue-down': 'Lepljenje',
        'lepljenje': 'Lepljenje',
        'loose lay': 'Looselay',
        'loose-lay': 'Looselay',
        'looselay': 'Looselay',
        'click sistem': 'Click sistem',
        'click system': 'Click sistem',
        'click': 'Click sistem',
    }
    
    return translations.get(value_lower, value)

def normalize_format(value):
    """Normalize format"""
    if not value:
        return value
    
    value_lower = value.lower().strip()
    
    translations = {
        'plank': 'Ploča',
        'ploča': 'Ploča',
        'tile': 'Pločica',
        'pločica': 'Pločica',
        'square tile': 'Kvadratna pločica',
        'kvadratna pločica': 'Kvadratna pločica',
        'xl': 'XL',
        'herringbone': 'Riblja kost',
        'riblja kost': 'Riblja kost',
    }
    
    return translations.get(value_lower, value.title())

print('=' * 100)
print('NORMALIZACIJA KARAKTERISTIKA')
print('=' * 100)

# Load data
lvt_data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
lvt_colors = lvt_data.get('colors', [])

linoleum_data = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))
linoleum_colors = linoleum_data.get('colors', [])

all_colors = lvt_colors + linoleum_colors

fixed_count = 0

for color in all_colors:
    updated = False
    
    # Normalize thickness
    thickness = color.get('overall_thickness', '')
    if thickness:
        new_thickness = normalize_thickness(thickness)
        if new_thickness != thickness:
            color['overall_thickness'] = new_thickness
            updated = True
    
    # Normalize format (in format field and characteristics)
    format_val = color.get('format', '')
    if format_val:
        new_format = normalize_format(format_val)
        if new_format != format_val:
            color['format'] = new_format
            updated = True
    
    # Normalize installation (in characteristics)
    if color.get('characteristics'):
        for key, value in color['characteristics'].items():
            if isinstance(value, str) and ('installation' in key.lower() or 'ugradnja' in key.lower() or 'instalacija' in key.lower()):
                new_value = normalize_installation(value)
                if new_value != value:
                    color['characteristics'][key] = new_value
                    updated = True
    
    if updated:
        fixed_count += 1
        if fixed_count <= 10:
            print(f'✅ {color.get("collection", "")} {color.get("code", "")}')

if fixed_count > 0:
    json.dump(lvt_data, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    json.dump(linoleum_data, open('public/data/linoleum_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print(f'\n✅ Normalizovano: {fixed_count} proizvoda')
else:
    print('\n⚠️  Nema karakteristika za normalizaciju')
