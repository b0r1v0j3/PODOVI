#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pronalazi duplikate slug-ova i kodova
"""

import sys
import json
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

lvt_data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
lvt_colors = lvt_data.get('colors', [])

linoleum_data = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))
linoleum_colors = linoleum_data.get('colors', [])

all_colors = lvt_colors + linoleum_colors

print('=' * 100)
print('PROVERA DUPLIKATA')
print('=' * 100)

# Find duplicate slugs
slug_counts = defaultdict(list)
for color in all_colors:
    slug = color.get('slug', '').strip()
    if slug:
        slug_counts[slug].append({
            'collection': color.get('collection', ''),
            'code': color.get('code', ''),
            'name': color.get('name', ''),
        })

print(f'\n🔍 DUPLIKATI SLUG-OVA:')
duplicate_slugs = {k: v for k, v in slug_counts.items() if len(v) > 1}
print(f'   Ukupno: {len(duplicate_slugs)}')
for slug, items in list(duplicate_slugs.items())[:10]:
    print(f'\n   - {slug} ({len(items)} duplikata):')
    for item in items:
        print(f'     * {item["collection"]} {item["code"]} {item["name"]}')

# Find duplicate codes within same collection
code_counts_by_collection = defaultdict(lambda: defaultdict(list))
for color in all_colors:
    code = color.get('code', '').strip()
    collection = color.get('collection', '')
    if code and collection:
        code_counts_by_collection[collection][code].append({
            'slug': color.get('slug', ''),
            'name': color.get('name', ''),
        })

print(f'\n🔍 DUPLIKATI KODOVA U ISTOJ KOLEKCIJI:')
duplicate_codes_count = 0
for collection, codes in code_counts_by_collection.items():
    duplicates = {k: v for k, v in codes.items() if len(v) > 1}
    if duplicates:
        duplicate_codes_count += sum(len(v) for v in duplicates.values())
        print(f'\n   {collection}: {len(duplicates)} duplikata')
        for code, items in list(duplicates.items())[:3]:
            print(f'     - {code} ({len(items)} duplikata)')
            for item in items[:2]:
                print(f'       * {item["slug"]} {item["name"]}')

print(f'\n📊 UKUPNO: {len(duplicate_slugs)} duplikata slug-ova, {duplicate_codes_count} duplikata kodova')
