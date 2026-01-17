#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Strukturiše preostalih 16 opisa bez sekcija
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Load from _colors.json files
lvt_dir = Path('downloads/product_descriptions/lvt')

# Build index
by_code_collection = {}
for c in colors:
    code = c.get('code', '').strip()
    collection = c.get('collection', '').strip()
    if code and collection:
        key = f"{code}|{collection}"
        by_code_collection[key] = c

updated = 0

for file in sorted(lvt_dir.glob('*_colors.json')):
    collection_name = file.stem.replace('_colors', '')
    collection_name = collection_name.replace('new-collection', '').replace('new-2025-', '').strip('-')
    
    data = json.load(open(file, 'r', encoding='utf-8'))
    extracted_colors = data.get('colors', [])
    
    for ec in extracted_colors:
        slug = ec.get('slug', '')
        desc = ec.get('description', {})
        
        if not desc:
            continue
        
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
            # Try variations
            for k, c in by_code_collection.items():
                if k.startswith(f"{code}|"):
                    coll = k.split('|')[1]
                    if collection_name in coll or coll in collection_name:
                        color = c
                        break
        
        if not color:
            continue
        
        # Check if description needs structure
        current_desc = color.get('description', '')
        if current_desc and 'Proizvod:' in current_desc:
            continue  # Already structured
        
        # Use full_text
        full_text = desc.get('full_text', '')
        if full_text and len(full_text) > 200:
            # Translate and structure
            full_text = full_text.replace('Removable flooring to meet your needs', 'Uklonjivi podovi koji odgovaraju vašim potrebama')
            full_text = full_text.replace('Product :', 'Proizvod:')
            full_text = full_text.replace('Installation :', 'Ugradnja:')
            full_text = full_text.replace('Application :', 'Primena:')
            full_text = full_text.replace('Environment :', 'Okruženje:')
            full_text = full_text.replace('5 sizes : including', '5 veličina: uključujući')
            full_text = full_text.replace('herringbone and XL planks', 'riblju kost i XL daske')
            full_text = full_text.replace('Exclusive construction « Duo Core », reinforced with a fiber glass for comfort & stability', 'Ekskluzivna konstrukcija « Duo Core », ojačano staklenim vlaknima za komfor i stabilnost')
            full_text = full_text.replace('ProtecShield™ varnish  :  natural look and easy to clean', 'ProtecShield™ lak: prirodan izgled i lako za čišćenje')
            full_text = full_text.replace('Removable installation with tackifier - suitable for raised floor', 'Uklonjiva ugradnja sa lepkom - pogodno za podignute podove')
            full_text = full_text.replace('Direct on ceramic if joint <4mm', 'Direktno na keramiku ako je spoj <4mm')
            full_text = full_text.replace('Ideal for intense traffic areas : office, hotel, shops - european class 34-43', 'Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice - evropska klasa 34-43')
            full_text = full_text.replace('Ideal for moderate traffic areas : office, hotel, shops - european class 33/42', 'Idealno za zone sa umerenim prometom: kancelarije, hoteli, prodavnice - evropska klasa 33/42')
            full_text = full_text.replace('100% recyclable', '100% reciklabilno')
            full_text = full_text.replace('35% recycled content', '35% recikliranog sadržaja')
            full_text = full_text.replace('TVOC <10µg/m3', 'TVOC <10µg/m³')
            full_text = full_text.replace('Phtalate free', 'Bez ftalata')
            
            color['description'] = full_text.strip()
            updated += 1
            print(f'✅ {collection_name} {code} - struktuiran opis')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Strukturisano: {updated} opisa')
