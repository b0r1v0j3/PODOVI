#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Proverava rezultate ekstrakcije"""

import json
from pathlib import Path

lvt_dir = Path('downloads/product_descriptions/lvt')
linoleum_dir = Path('downloads/product_descriptions/linoleum')

lvt_files = list(lvt_dir.glob('*_colors.json'))
linoleum_files = list(linoleum_dir.glob('*_colors.json'))

print(f"LVT kolekcije: {len(lvt_files)}")
print(f"Linoleum kolekcije: {len(linoleum_files)}")
print()

total_colors = 0
colors_with_specs = 0
colors_with_description = 0
colors_with_full_text = 0

for f in lvt_files + linoleum_files:
    data = json.load(open(f, 'r', encoding='utf-8'))
    colors = data.get('colors', [])
    total_colors += len(colors)
    
    for color in colors:
        if color.get('specs') and len(color.get('specs', {})) > 0:
            colors_with_specs += 1
        if color.get('description', {}).get('intro_text'):
            colors_with_description += 1
        if color.get('description', {}).get('full_text'):
            colors_with_full_text += 1

print(f"Ukupno boja: {total_colors}")
print(f"Boja sa specs: {colors_with_specs} ({colors_with_specs/total_colors*100:.1f}%)")
print(f"Boja sa description: {colors_with_description} ({colors_with_description/total_colors*100:.1f}%)")
print(f"Boja sa full_text: {colors_with_full_text} ({colors_with_full_text/total_colors*100:.1f}%)")
