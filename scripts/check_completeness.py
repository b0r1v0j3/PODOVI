#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proverava kompletnost podataka
"""

import sys
import json
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = data.get('colors', [])

stats = defaultdict(lambda: {'total': 0, 'has_desc': 0, 'has_dim': 0, 'has_format': 0, 'has_thick': 0, 'complete': 0})

for color in colors:
    coll = color.get('collection', 'unknown')
    stats[coll]['total'] += 1
    
    if color.get('description'):
        stats[coll]['has_desc'] += 1
    if color.get('dimension'):
        stats[coll]['has_dim'] += 1
    if color.get('format'):
        stats[coll]['has_format'] += 1
    if color.get('overall_thickness'):
        stats[coll]['has_thick'] += 1
    
    if (color.get('description') and color.get('dimension') and 
        color.get('format') and color.get('overall_thickness')):
        stats[coll]['complete'] += 1

print('=' * 80)
print('KOMPLETNOST PO KOLEKCIJAMA')
print('=' * 80)
print(f'{"Kolekcija":<40} {"Total":<8} {"Desc":<8} {"Dim":<8} {"Format":<8} {"Thick":<8} {"Complete":<8}')
print('-' * 80)

total_all = 0
complete_all = 0

for coll in sorted(stats.keys()):
    s = stats[coll]
    total_all += s['total']
    complete_all += s['complete']
    
    desc_pct = s['has_desc'] / s['total'] * 100 if s['total'] > 0 else 0
    dim_pct = s['has_dim'] / s['total'] * 100 if s['total'] > 0 else 0
    format_pct = s['has_format'] / s['total'] * 100 if s['total'] > 0 else 0
    thick_pct = s['has_thick'] / s['total'] * 100 if s['total'] > 0 else 0
    complete_pct = s['complete'] / s['total'] * 100 if s['total'] > 0 else 0
    
    print(f"{coll:<40} {s['total']:<8} {s['has_desc']:<8} {s['has_dim']:<8} {s['has_format']:<8} {s['has_thick']:<8} {s['complete']:<8}")
    print(f"{'':<40} {'':<8} {desc_pct:>6.1f}% {dim_pct:>6.1f}% {format_pct:>6.1f}% {thick_pct:>6.1f}% {complete_pct:>6.1f}%")
    print()

print('-' * 80)
print(f'{"UKUPNO":<40} {total_all:<8} {sum(s["has_desc"] for s in stats.values()):<8} {sum(s["has_dim"] for s in stats.values()):<8} {sum(s["has_format"] for s in stats.values()):<8} {sum(s["has_thick"] for s in stats.values()):<8} {complete_all:<8}')
print(f'{"":<40} {"":<8} {sum(s["has_desc"] for s in stats.values())/total_all*100:>6.1f}% {sum(s["has_dim"] for s in stats.values())/total_all*100:>6.1f}% {sum(s["has_format"] for s in stats.values())/total_all*100:>6.1f}% {sum(s["has_thick"] for s in stats.values())/total_all*100:>6.1f}% {complete_all/total_all*100:>6.1f}%')
print('=' * 80)
