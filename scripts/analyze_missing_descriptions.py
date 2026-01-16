#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analiziraj koje boje nemaju description i zašto"""

import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Load complete JSONs
lvt_data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
linoleum_data = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))

lvt_colors = lvt_data.get('colors', [])
linoleum_colors = linoleum_data.get('colors', [])

# Analyze LVT
lvt_with_desc = [c for c in lvt_colors if c.get('description')]
lvt_without_desc = [c for c in lvt_colors if not c.get('description')]

print(f"LVT boje:")
print(f"  Sa description: {len(lvt_with_desc)}/{len(lvt_colors)} ({len(lvt_with_desc)/len(lvt_colors)*100:.1f}%)")
print(f"  Bez description: {len(lvt_without_desc)}/{len(lvt_colors)} ({len(lvt_without_desc)/len(lvt_colors)*100:.1f}%)")

# Group by collection
collections_without = {}
for color in lvt_without_desc:
    collection = color.get('collection', 'Unknown')
    if collection not in collections_without:
        collections_without[collection] = 0
    collections_without[collection] += 1

print(f"\nBoje bez description po kolekcijama:")
for collection, count in sorted(collections_without.items(), key=lambda x: x[1], reverse=True):
    print(f"  {collection}: {count}")

# Check extracted files
print(f"\n\nProvera ekstraktovanih fajlova:")
lvt_dir = Path('downloads/product_descriptions/lvt')
for collection, count in sorted(collections_without.items(), key=lambda x: x[1], reverse=True)[:5]:
    # Try to find corresponding extracted file
    extracted_file = lvt_dir / f"{collection}_colors.json"
    if extracted_file.exists():
        extracted_data = json.load(open(extracted_file, 'r', encoding='utf-8'))
        extracted_colors = extracted_data.get('colors', [])
        print(f"\n  {collection}:")
        print(f"    Ekstraktovano: {len(extracted_colors)} boja")
        print(f"    Nedostaje u complete: {count} boja")
        
        # Show first missing color
        missing_in_complete = [c for c in lvt_colors if c.get('collection') == collection and not c.get('description')]
        if missing_in_complete:
            mc = missing_in_complete[0]
            print(f"    Primer nedostajuće:")
            print(f"      Slug: {mc.get('slug')}")
            print(f"      Code: {mc.get('code')}")
            print(f"      Name: {mc.get('name')}")
    else:
        print(f"\n  {collection}: Nema ekstraktovani fajl ({extracted_file.name})")
