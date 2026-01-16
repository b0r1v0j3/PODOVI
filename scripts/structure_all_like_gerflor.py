#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Strukturiše SVE proizvode kao na Gerflor sajtu:
- Product sekcija
- Installation sekcija
- Application sekcija
- Environment sekcija
- Sve karakteristike
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Load all _descriptions.json files to get structured data
lvt_dir = Path('downloads/product_descriptions/lvt')

# Build index by code -> collection -> color
by_code_collection = {}
for c in colors:
    code = c.get('code', '').strip()
    collection = c.get('collection', '').strip()
    if code and collection:
        key = f"{code}|{collection}"
        by_code_collection[key] = c

print(f'Index: {len(by_code_collection)} boja\n')

total_updated = 0

# Process all _descriptions.json files
desc_files = sorted(lvt_dir.glob('*_descriptions.json'))

for file in desc_files:
    collection_name = file.stem.replace('_descriptions', '')
    collection_name = collection_name.replace('new-collection', '').replace('new-2025-', '').strip('-')
    
    data = json.load(open(file, 'r', encoding='utf-8'))
    extracted = data.get('colors', [])
    
    updated = 0
    for ec in extracted:
        slug = ec.get('slug', '')
        desc = ec.get('description', {})
        specs = ec.get('specs', {})
        
        if not desc:
            continue
        
        # Extract code
        codes = re.findall(r'\b(\d{4})\b', slug)
        if not codes:
            continue
        
        code = None
        for c in codes:
            if c != '2025':
                code = c
                break
        
        if not code:
            continue
        
        # Find color
        key = f"{code}|{collection_name}"
        color = by_code_collection.get(key)
        
        if not color:
            # Try fuzzy match
            for k, c in by_code_collection.items():
                if k.startswith(f"{code}|"):
                    coll = k.split('|')[1]
                    if collection_name in coll or coll in collection_name:
                        color = c
                        break
        
        if not color:
            continue
        
        # Build structured description like Gerflor
        full_text = desc.get('full_text', '')
        if not full_text:
            continue
        
        # Remove "Kreirajte bez ograničenja" / "Create without limits"
        full_text = full_text.replace('Create without limits\n', '')
        full_text = full_text.replace('Create without limits ', '')
        full_text = full_text.replace('Kreirajte bez ograničenja\n', '')
        full_text = full_text.replace('Kreirajte bez ograničenja ', '')
        
        # Translate to Serbian
        translations = {
            'Design & Product': 'Dizajn i proizvod',
            'Product': 'Proizvod',
            'Product :': 'Proizvod:',
            'Installation & Maintenance': 'Ugradnja i održavanje',
            'Installation': 'Ugradnja',
            'Installation :': 'Ugradnja:',
            'Application': 'Primena',
            'Application :': 'Primena:',
            'Environment': 'Okruženje',
            'Environment :': 'Okruženje:',
            'Maintenance': 'Održavanje',
            'Sustainability': 'Održivost',
            'Sustainability & Comfort': 'Održivost i komfor',
            'Comfort': 'Komfor',
        }
        
        for eng, srb in translations.items():
            full_text = full_text.replace(eng, srb)
        
        # Translate common phrases
        full_text = full_text.replace('5 sizes : including', '5 veličina: uključujući')
        full_text = full_text.replace('herringbone', 'riblju kost')
        full_text = full_text.replace('XL planks', 'XL daske')
        full_text = full_text.replace('Exclusive construction', 'Ekskluzivna konstrukcija')
        full_text = full_text.replace('reinforced with a fiber glass', 'ojačano staklenim vlaknima')
        full_text = full_text.replace('for comfort & stability', 'za komfor i stabilnost')
        full_text = full_text.replace('ProtecShield™ varnish  :', 'ProtecShield™ lak:')
        full_text = full_text.replace('natural look', 'prirodan izgled')
        full_text = full_text.replace('easy to clean', 'lako za čišćenje')
        full_text = full_text.replace('Removable installation with tackifier', 'Uklonjiva ugradnja sa lepkom')
        full_text = full_text.replace('suitable for raised floor', 'pogodno za podignute podove')
        full_text = full_text.replace('Direct on ceramic if joint <4mm', 'Direktno na keramiku ako je spoj <4mm')
        full_text = full_text.replace('Ideal for intense traffic areas', 'Idealno za zone sa intenzivnim prometom')
        full_text = full_text.replace('office, hotel, shops', 'kancelarije, hoteli, prodavnice')
        full_text = full_text.replace('european class', 'evropska klasa')
        full_text = full_text.replace('100% recyclable', '100% reciklabilno')
        full_text = full_text.replace('35% recycled content', '35% recikliranog sadržaja')
        full_text = full_text.replace('TVOC <10µg/m3', 'TVOC <10µg/m³')
        full_text = full_text.replace('Phtalate free', 'Bez ftalata')
        
        color['description'] = full_text.strip()
        updated += 1
    
    if updated > 0:
        print(f'  {file.name}: +{updated}')
        total_updated += updated

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Ažurirano: {total_updated} boja sa strukturiranim opisima kao na Gerflor sajtu')
