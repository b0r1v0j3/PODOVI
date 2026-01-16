#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Proverava STVARNO stanje u JSON fajlovima koje sajt koristi"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

lvt = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = lvt.get('colors', [])

# Group by collection and check what they have
collections = {}
for c in colors:
    coll = c.get('collection', 'unknown')
    if coll not in collections:
        collections[coll] = {
            'total': 0,
            'with_desc': 0,
            'with_dim': 0,
            'with_format': 0,
            'with_thickness': 0,
            'complete': 0  # has all 4
        }
    
    stats = collections[coll]
    stats['total'] += 1
    
    if c.get('description'):
        stats['with_desc'] += 1
    if c.get('dimension'):
        stats['with_dim'] += 1
    if c.get('format'):
        stats['with_format'] += 1
    if c.get('overall_thickness'):
        stats['with_thickness'] += 1
    
    # Complete = has all 4
    if c.get('description') and c.get('dimension') and c.get('format') and c.get('overall_thickness'):
        stats['complete'] += 1

print('='*80)
print('STVARNO STANJE NA SAJTU (iz lvt_colors_complete.json)')
print('='*80)

for coll, stats in sorted(collections.items(), key=lambda x: x[1]['complete']/x[1]['total'], reverse=True):
    complete_pct = stats['complete']/stats['total']*100
    dim_pct = stats['with_dim']/stats['total']*100
    
    print(f'\n{coll}:')
    print(f'  Ukupno: {stats["total"]} boja')
    print(f'  Kompletno (sve 4): {stats["complete"]}/{stats["total"]} ({complete_pct:.1f}%)')
    print(f'  Description: {stats["with_desc"]}/{stats["total"]}')
    print(f'  Dimension: {stats["with_dim"]}/{stats["total"]} ({dim_pct:.1f}%)')
    print(f'  Format: {stats["with_format"]}/{stats["total"]}')
    print(f'  Thickness: {stats["with_thickness"]}/{stats["total"]}')
    
    if complete_pct < 100:
        missing = stats['total'] - stats['complete']
        print(f'  ⚠️  NEDOSTAJE {missing} boja za 100%')
