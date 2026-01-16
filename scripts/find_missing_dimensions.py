#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pronalazi boje bez dimension i proverava specs"""

import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

lvt = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = lvt.get('colors', [])

# Find colors without dimension
without_dim = [c for c in colors if not c.get('dimension')]

print(f'Boja bez dimension: {len(without_dim)}/{len(colors)}\n')

# Check by collection
by_collection = {}
for c in without_dim:
    coll = c.get('collection', 'unknown')
    if coll not in by_collection:
        by_collection[coll] = []
    by_collection[coll].append(c)

print('Po kolekcijama:')
for coll, colors_list in sorted(by_collection.items(), key=lambda x: len(x[1]), reverse=True):
    print(f'  {coll}: {len(colors_list)} boja')
    # Show first few slugs
    for c in colors_list[:3]:
        print(f'    - {c.get("slug")}')

# Check if extracted files have specs for these
print('\nProveravam ekstraktovane fajlove...')
for coll in list(by_collection.keys())[:5]:
    json_file = Path(f'downloads/product_descriptions/lvt/{coll}_colors.json')
    if json_file.exists():
        data = json.load(open(json_file, 'r', encoding='utf-8'))
        extracted_colors = data.get('colors', [])
        with_specs = sum(1 for c in extracted_colors if c.get('specs') and len(c.get('specs', {})) > 0)
        print(f'  {coll}: {with_specs}/{len(extracted_colors)} sa specs u ekstraktovanom')
