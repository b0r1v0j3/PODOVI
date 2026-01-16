#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popunjava nedostajuće dimenzije i debljine na osnovu kolekcije
"""

import sys
import json
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Default values by collection
defaults_by_collection = {
    'creation-40-clic': {
        'dimension': '18.4 cm X 121.9 cm',
        'format': 'Plank',
        'overall_thickness': '2.00 mm'
    },
    'creation-55-clic': {
        'dimension': '18.4 cm X 121.9 cm',
        'format': 'Plank',
        'overall_thickness': '2.50 mm'
    },
    'creation-55-clic-acoustic': {
        'dimension': '18.4 cm X 121.9 cm',
        'format': 'Plank',
        'overall_thickness': '4.25 mm'
    },
    'creation-70-clic': {
        'dimension': '18.4 cm X 121.9 cm',
        'format': 'Plank',
        'overall_thickness': '3.00 mm'
    },
    'creation-70-looselay': {
        'dimension': '22.86 cm X 122 cm',
        'format': 'Plank',
        'overall_thickness': '5.00 mm'
    },
    'creation-55': {
        'overall_thickness': '2.50 mm'
    },
    'dlw-uni-walton': {
        'dimension': '50 cm X 50 cm',  # Common linoleum size
        'format': 'Tile',
        'overall_thickness': '2.50 mm'
    },
    'dlw-uni-walton-acoustic-plus': {
        'dimension': '50 cm X 50 cm',
        'format': 'Tile',
        'overall_thickness': '3.50 mm'
    }
}

# First, find most common values in each collection
collection_stats = defaultdict(lambda: {'dimensions': defaultdict(int), 'formats': defaultdict(int), 'thicknesses': defaultdict(int)})

for color in colors:
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

for color in colors:
    coll = color.get('collection', '')
    
    # Use defaults or most common
    defaults = defaults_by_collection.get(coll, {})
    most_common = most_common_by_collection.get(coll, {})
    
    if not color.get('dimension'):
        dimension = defaults.get('dimension') or most_common.get('dimension')
        if dimension:
            color['dimension'] = dimension
            updated_dim += 1
    
    if not color.get('format'):
        format_val = defaults.get('format') or most_common.get('format')
        if format_val:
            color['format'] = format_val
            updated_format += 1
    
    if not color.get('overall_thickness'):
        thickness = defaults.get('overall_thickness') or most_common.get('overall_thickness')
        if thickness:
            color['overall_thickness'] = thickness
            updated_thick += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Popunjeno:')
print(f'   - Dimenzije: {updated_dim}')
print(f'   - Formati: {updated_format}')
print(f'   - Debljine: {updated_thick}')
