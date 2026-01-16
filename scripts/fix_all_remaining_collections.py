#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FIX SVE PREOSTALE KOLEKCIJE - strukturirani opisi kao na Gerflor sajtu
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

# Process ALL _descriptions.json files
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
    
    # Translate section titles to Serbian
    translations = {
        'Design & Product': 'Dizajn i proizvod',
        'Product & Design': 'Dizajn i proizvod',
        'Product': 'Proizvod',
        'Product :': 'Proizvod:',
        'Installation & Maintenance': 'Ugradnja i održavanje',
        'Installation': 'Ugradnja',
        'Installation :': 'Ugradnja:',
        'Maintenance': 'Održavanje',
        'Application': 'Primena',
        'Application :': 'Primena:',
        'Environment': 'Okruženje',
        'Environment :': 'Okruženje:',
        'Sustainability': 'Održivost',
        'Sustainability & Comfort': 'Održivost i komfor',
        'Comfort': 'Komfor',
    }
    
    for eng, srb in translations.items():
        full_text = full_text.replace(eng, srb)
    
    # Translate common phrases
    full_text = full_text.replace('Complete format offering:', 'Kompletan format:')
    full_text = full_text.replace('designed to meet every project need', 'dizajnirano da zadovolji svaki projekat')
    full_text = full_text.replace('Refined designs & harmonious color palettes:', 'Profinjeni dizajni i harmonične palete boja:')
    full_text = full_text.replace('every detail crafted to create exclusiv space', 'svaki detalj osmišljen da stvori ekskluzivan prostor')
    full_text = full_text.replace('New surface embosses:', 'Novi površinski utisci:')
    full_text = full_text.replace('ultra-realistic and varied textures that elevate each design', 'ultra-realistične i raznovrsne teksture koje uzdignu svaki dizajn')
    full_text = full_text.replace('Ultra-matt finish with Protecshield™:', 'Ultra-mat završetak sa Protecshield™:')
    full_text = full_text.replace('velvet touch and natural elegance', 'baršunasti dodir i prirodna elegancija')
    full_text = full_text.replace('Smart Design – up to 3sqm of design variation:', 'Smart Design – do 3 m² varijacije dizajna:')
    full_text = full_text.replace('enhanced visual variation on selected designs for deeper realism', 'poboljšana vizuelna varijacija na odabranim dizajnima za dublji realizam')
    full_text = full_text.replace('Smart Comfort innovation:', 'Smart Comfort inovacija:')
    full_text = full_text.replace('acoustic top layer for better walking (79dB) and thermal comfort', 'akustični gornji sloj za bolje hodanje (79dB) i toplotni komfor')
    full_text = full_text.replace('4 bevelled edges:', '4 zakošene ivice:')
    full_text = full_text.replace('authentic wood and tile effects', 'autentičan efekat drveta i pločica')
    full_text = full_text.replace('From floor to wall:', 'Od poda do zida:')
    full_text = full_text.replace('create seamless harmony with our Mural Revela Collection', 'stvorite besprekornu harmoniju sa našom Mural Revela kolekcijom')
    full_text = full_text.replace('Dry Back system:', 'Dry Back sistem:')
    full_text = full_text.replace('professional-grade installation for lasting performance', 'profesionalna ugradnja za dugotrajnu performansu')
    full_text = full_text.replace('Ideal for new build', 'Idealno za novu gradnju')
    full_text = full_text.replace('Protecshield™ surface treatment:', 'Protecshield™ površinska obrada:')
    full_text = full_text.replace('enhanced resistance, effortless cleaning', 'poboljšana otpornost, jednostavno čišćenje')
    full_text = full_text.replace('Efficient maintenance protocol:', 'Efikasan protokol održavanja:')
    full_text = full_text.replace('simplified care, maximum impact', 'pojednostavljena nega, maksimalan efekat')
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
    full_text = full_text.replace('rectangular tiles', 'pravougaone pločice')
    full_text = full_text.replace('square tiles', 'kvadratne pločice')
    full_text = full_text.replace('standard planks', 'standardne daske')
    full_text = full_text.replace('small planks', 'male daske')
    
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

print(f'\n✅ ZAVRŠENO! Ažurirano: {total_updated} boja sa strukturiranim opisima')
