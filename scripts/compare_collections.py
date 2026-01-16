#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Uporedi kolekcije u complete JSON vs ekstraktovane"""

import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Load complete JSON
lvt_data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
lvt_colors = lvt_data.get('colors', [])

# Get all collections in complete JSON
collections_in_complete = set(c.get('collection') for c in lvt_colors)
print(f"Kolekcije u lvt_colors_complete.json ({len(collections_in_complete)}):")
for col in sorted(collections_in_complete):
    count = sum(1 for c in lvt_colors if c.get('collection') == col)
    print(f"  {col}: {count} boja")

# Get all extracted collections
lvt_dir = Path('downloads/product_descriptions/lvt')
extracted_files = list(lvt_dir.glob('*_colors.json'))
extracted_collections = set(f.stem.replace('_colors', '') for f in extracted_files)

print(f"\n\nEkstraktovane kolekcije ({len(extracted_collections)}):")
for col in sorted(extracted_collections):
    print(f"  {col}")

# Find missing
missing = collections_in_complete - extracted_collections
print(f"\n\nNedostajuće ekstraktovane kolekcije ({len(missing)}):")
for col in sorted(missing):
    count = sum(1 for c in lvt_colors if c.get('collection') == col)
    print(f"  {col}: {count} boja")
