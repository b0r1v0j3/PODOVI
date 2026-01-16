#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FIX SVE KOLEKCIJE - kao Creation 30:
1. Koristi FULL_TEXT sa strukturom
2. Uklanja "Kreirajte bez ograničenja" / "Create without limits"
3. Prevod na srpski
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Build index by collection
by_collection = {}
for c in colors:
    coll = c.get('collection', '')
    if coll:
        if coll not in by_collection:
            by_collection[coll] = []
        by_collection[coll].append(c)

print(f'Kolekcije: {len(by_collection)}\n')

# Process all _descriptions.json files
lvt_dir = Path('downloads/product_descriptions/lvt')
desc_files = sorted(lvt_dir.glob('*_descriptions.json'))

total_updated = 0

for file in desc_files:
    collection_name = file.stem.replace('_descriptions', '')
    collection_name = collection_name.replace('new-collection', '').replace('new-2025-', '').strip('-')
    
    data = json.load(open(file, 'r', encoding='utf-8'))
    extracted = data.get('colors', [])
    
    if not extracted:
        continue
    
    # Get full_text template from first color
    full_text_template = None
    for ec in extracted:
        desc = ec.get('description', {})
        if desc:
            full_text_template = desc.get('full_text', '')
            if full_text_template:
                break
    
    if not full_text_template:
        continue
    
    # Remove "Kreirajte bez ograničenja" / "Create without limits"
    full_text = full_text_template.replace('Create without limits\n', '')
    full_text = full_text.replace('Create without limits ', '')
    full_text = full_text.replace('Kreirajte bez ograničenja\n', '')
    full_text = full_text.replace('Kreirajte bez ograničenja ', '')
    
    # Translate section titles
    translations = {
        'Design & Product': 'Dizajn i proizvod',
        'Product & Design': 'Dizajn i proizvod',
        'Installation & Maintenance': 'Ugradnja i održavanje',
        'Installation': 'Ugradnja',
        'Maintenance': 'Održavanje',
        'Sustainability & Comfort': 'Održivost i komfor',
        'Sustainability': 'Održivost',
        'Comfort': 'Komfor',
        'Application': 'Primena',
        'Environment': 'Okruženje',
    }
    
    for eng, srb in translations.items():
        full_text = full_text.replace(eng, srb)
    
    # Find matching collection colors
    collection_colors = by_collection.get(collection_name, [])
    
    if not collection_colors:
        # Try fuzzy match
        for coll, cols in by_collection.items():
            if collection_name in coll or coll in collection_name:
                collection_colors = cols
                break
    
    if collection_colors:
        updated = 0
        for color in collection_colors:
            color['description'] = full_text.strip()
            updated += 1
        
        if updated > 0:
            print(f'  {file.name}: +{updated} boja')
            total_updated += updated

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ ZAVRŠENO! Ažurirano: {total_updated} boja')
