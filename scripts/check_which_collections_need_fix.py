#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proverava koje kolekcije još nemaju strukturirane opise
"""

import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Check which collections have structured descriptions (with section titles)
collections_status = {}

for color in colors:
    coll = color.get('collection', '')
    desc = color.get('description', '')
    
    if not coll:
        continue
    
    if coll not in collections_status:
        collections_status[coll] = {'total': 0, 'has_desc': 0, 'has_structured': 0}
    
    collections_status[coll]['total'] += 1
    
    if desc:
        collections_status[coll]['has_desc'] += 1
        
        # Check if structured (has section titles)
        has_sections = any(keyword in desc for keyword in [
            'Dizajn i proizvod',
            'Proizvod:',
            'Ugradnja:',
            'Primena:',
            'Okruženje:',
            'Održivost',
            'Design & Product',
            'Installation',
            'Application',
            'Environment'
        ])
        
        if has_sections:
            collections_status[coll]['has_structured'] += 1

print('=' * 80)
print('STATUS KOLEKCIJA - STRUKTURIRANI OPISI')
print('=' * 80)
print(f'{"Kolekcija":<40} {"Total":<8} {"Ima opis":<10} {"Strukturiran":<12} {"%":<8}')
print('-' * 80)

for coll in sorted(collections_status.keys()):
    s = collections_status[coll]
    desc_pct = s['has_desc'] / s['total'] * 100 if s['total'] > 0 else 0
    struct_pct = s['has_structured'] / s['total'] * 100 if s['total'] > 0 else 0
    
    status = '✅' if struct_pct > 90 else '⚠️' if struct_pct > 50 else '❌'
    
    print(f"{status} {coll:<38} {s['total']:<8} {s['has_desc']:<10} {s['has_structured']:<12} {struct_pct:>6.1f}%")

print('=' * 80)
