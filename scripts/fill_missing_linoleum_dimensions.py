#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popunjava nedostajuće dimenzije u linoleum kolekcijama
"""

import sys
import json
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

# Load both files
lvt_complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
linoleum_complete = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))

lvt_colors = lvt_complete.get('colors', [])
linoleum_colors = linoleum_complete.get('colors', [])

# Default dimensions for linoleum (usually 50x50cm tiles)
default_linoleum_dimension = '50 cm X 50 cm'
default_linoleum_format = 'Tile'
default_linoleum_thickness = '2.50 mm'

# Find most common values in linoleum
collection_stats = defaultdict(lambda: {'dimensions': defaultdict(int), 'formats': defaultdict(int), 'thicknesses': defaultdict(int)})

for color in linoleum_colors:
    coll = color.get('collection', '')
    if color.get('dimension'):
        collection_stats[coll]['dimensions'][color['dimension']] += 1
    if color.get('format'):
        collection_stats[coll]['formats'][color['format']] += 1
    if color.get('overall_thickness'):
        collection_stats[coll]['thicknesses'][color['overall_thickness']] += 1

# Get most common values
most_common_by_collection = {}
for coll, stats in collection_stats.items():
    most_common_by_collection[coll] = {
        'dimension': max(stats['dimensions'].items(), key=lambda x: x[1])[0] if stats['dimensions'] else None,
        'format': max(stats['formats'].items(), key=lambda x: x[1])[0] if stats['formats'] else None,
        'overall_thickness': max(stats['thicknesses'].items(), key=lambda x: x[1])[0] if stats['thicknesses'] else None,
    }

updated_dim = 0
updated_format = 0
updated_thick = 0

for color in linoleum_colors:
    coll = color.get('collection', '')
    most_common = most_common_by_collection.get(coll, {})
    
    if not color.get('dimension'):
        dimension = most_common.get('dimension') or default_linoleum_dimension
        color['dimension'] = dimension
        updated_dim += 1
    
    if not color.get('format'):
        format_val = most_common.get('format') or default_linoleum_format
        color['format'] = format_val
        updated_format += 1
    
    if not color.get('overall_thickness'):
        thickness = most_common.get('overall_thickness') or default_linoleum_thickness
        color['overall_thickness'] = thickness
        updated_thick += 1

json.dump(linoleum_complete, open('public/data/linoleum_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Linoleum popunjeno:')
print(f'   - Dimenzije: {updated_dim}')
print(f'   - Formati: {updated_format}')
print(f'   - Debljine: {updated_thick}')
