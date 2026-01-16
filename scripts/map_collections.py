#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mapiranje ekstraktovanih kolekcija na kolekcije u lvt_colors_complete.json
"""

import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Mapping from complete JSON collection slug to extracted file slug
COLLECTION_MAPPING = {
    'creation-30': 'creation-30-new-collection',
    'creation-40': 'creation-40-new-collection',
    'creation-40-clic': 'creation-40-clic-new-collection',
    'creation-40-clic-acoustic': 'creation-40-clic-acoustic-new-collection',
    'creation-55': 'creation-55-new-collection',
    'creation-55-clic': 'creation-55-clic-new-collection',
    'creation-55-clic-acoustic': 'creation-55-clic-acoustic-new-collection',
    'creation-70': 'creation-70-new-collection',
    'creation-70-clic': 'creation-70-clic-5mm-new-collection',
    'creation-70-looselay': 'new-2025-creation-70-looselay',
}

# Verify mappings
lvt_dir = Path('downloads/product_descriptions/lvt')
complete_data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
complete_colors = complete_data.get('colors', [])

print("Provera mapiranja:\n")
for complete_slug, extracted_slug in COLLECTION_MAPPING.items():
    extracted_file = lvt_dir / f"{extracted_slug}_colors.json"
    complete_count = sum(1 for c in complete_colors if c.get('collection') == complete_slug)
    
    if extracted_file.exists():
        extracted_data = json.load(open(extracted_file, 'r', encoding='utf-8'))
        extracted_count = len(extracted_data.get('colors', []))
        status = "✅" if extracted_count > 0 else "⚠️"
        print(f"{status} {complete_slug} ({complete_count} boja) -> {extracted_slug} ({extracted_count} boja)")
    else:
        print(f"❌ {complete_slug} ({complete_count} boja) -> {extracted_slug} (FAJL NE POSTOJI)")
