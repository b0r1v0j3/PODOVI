#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analizira koje kolekcije nemaju podatke"""

import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Load LVT
lvt = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = lvt.get('colors', [])

# Analyze by collection
collections = {}
for c in colors:
    coll = c.get('collection')
    if coll not in collections:
        collections[coll] = {'total': 0, 'with_desc': 0, 'with_dim': 0, 'missing_desc': [], 'missing_dim': []}
    
    collections[coll]['total'] += 1
    
    if c.get('description'):
        collections[coll]['with_desc'] += 1
    else:
        collections[coll]['missing_desc'].append(c.get('slug'))
    
    if c.get('dimension'):
        collections[coll]['with_dim'] += 1
    else:
        collections[coll]['missing_dim'].append(c.get('slug'))

print('='*80)
print('ANALIZA PO KOLEKCIJAMA - LVT')
print('='*80)

for coll, stats in sorted(collections.items()):
    desc_pct = stats['with_desc']/stats['total']*100
    dim_pct = stats['with_dim']/stats['total']*100
    
    print(f'\n{coll}:')
    print(f'  Ukupno: {stats["total"]} boja')
    print(f'  Description: {stats["with_desc"]}/{stats["total"]} ({desc_pct:.1f}%)')
    print(f'  Dimension: {stats["with_dim"]}/{stats["total"]} ({dim_pct:.1f}%)')
    
    if desc_pct < 100:
        print(f'  ⚠️  Nedostaje description: {len(stats["missing_desc"])} boja')
    if dim_pct < 100:
        print(f'  ⚠️  Nedostaje dimension: {len(stats["missing_dim"])} boja')

# Check which collections need work
print('\n' + '='*80)
print('PRIORITET ZA DORADU:')
print('='*80)

needs_work = []
for coll, stats in sorted(collections.items(), key=lambda x: x[1]['with_dim']/x[1]['total']):
    dim_pct = stats['with_dim']/stats['total']*100
    if dim_pct < 100:
        needs_work.append((coll, dim_pct, stats['total'] - stats['with_dim']))

for i, (coll, pct, missing) in enumerate(needs_work, 1):
    print(f'{i}. {coll:40} - {missing:3} boja bez dimension ({100-pct:.1f}% nedostaje)')
