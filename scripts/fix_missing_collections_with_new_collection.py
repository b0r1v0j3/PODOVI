#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popunjava kolekcije koje nemaju podatke - koristi new-collection verzije
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

# Mapping: collection -> new-collection file
collection_mappings = {
    'creation-40-clic': 'creation-40-clic-new-collection',
    'creation-40-clic-acoustic': 'creation-40-clic-acoustic-new-collection',
    'creation-55-clic': 'creation-55-clic-new-collection',
    'creation-55-clic-acoustic': 'creation-55-clic-acoustic-new-collection',
    'creation-70': 'creation-70-new-collection',
    'creation-70-clic': 'creation-70-clic-5mm-new-collection',
}

lvt_dir = Path('downloads/product_descriptions/lvt')
total_updated = 0

def translate_to_serbian(text):
    """Translate text to Serbian"""
    if not text:
        return text
    
    # Section titles
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
        text = text.replace(eng, srb)
    
    # Common phrases
    text = text.replace('Create without limits\n', '')
    text = text.replace('Create without limits ', '')
    text = text.replace('Kreirajte bez ograničenja\n', '')
    text = text.replace('Kreirajte bez ograničenja ', '')
    text = text.replace('Complete format offering:', 'Kompletan format:')
    text = text.replace('designed to meet every project need', 'dizajnirano da zadovolji svaki projekat')
    text = text.replace('Refined designs & harmonious color palettes:', 'Profinjeni dizajni i harmonične palete boja:')
    text = text.replace('every detail crafted to create exclusiv space', 'svaki detalj osmišljen da stvori ekskluzivan prostor')
    text = text.replace('New surface embosses:', 'Novi površinski utisci:')
    text = text.replace('ultra-realistic and varied textures that elevate each design', 'ultra-realistične i raznovrsne teksture koje uzdignu svaki dizajn')
    text = text.replace('Ultra-matt finish with Protecshield™:', 'Ultra-mat završetak sa Protecshield™:')
    text = text.replace('velvet touch and natural elegance', 'baršunasti dodir i prirodna elegancija')
    text = text.replace('Smart Design – up to 3sqm of design variation:', 'Smart Design – do 3 m² varijacije dizajna:')
    text = text.replace('enhanced visual variation on selected designs for deeper realism', 'poboljšana vizuelna varijacija na odabranim dizajnima za dublji realizam')
    text = text.replace('Smart Comfort innovation:', 'Smart Comfort inovacija:')
    text = text.replace('acoustic top layer for better walking (79dB) and thermal comfort', 'akustični gornji sloj za bolje hodanje (79dB) i toplotni komfor')
    text = text.replace('4 bevelled edges:', '4 zakošene ivice:')
    text = text.replace('authentic wood and tile effects', 'autentičan efekat drveta i pločica')
    text = text.replace('From floor to wall:', 'Od poda do zida:')
    text = text.replace('create seamless harmony with our Mural Revela Collection', 'stvorite besprekornu harmoniju sa našom Mural Revela kolekcijom')
    text = text.replace('Dry Back system:', 'Dry Back sistem:')
    text = text.replace('professional-grade installation for lasting performance', 'profesionalna ugradnja za dugotrajnu performansu')
    text = text.replace('Ideal for new build', 'Idealno za novu gradnju')
    text = text.replace('Protecshield™ surface treatment:', 'Protecshield™ površinska obrada:')
    text = text.replace('enhanced resistance, effortless cleaning', 'poboljšana otpornost, jednostavno čišćenje')
    text = text.replace('Efficient maintenance protocol:', 'Efikasan protokol održavanja:')
    text = text.replace('simplified care, maximum impact', 'pojednostavljena nega, maksimalan efekat')
    text = text.replace('rectangular tiles', 'pravougaone pločice')
    text = text.replace('square tiles', 'kvadratne pločice')
    text = text.replace('standard planks', 'standardne daske')
    text = text.replace('XL planks', 'XL daske')
    text = text.replace('small planks', 'male daske')
    
    return text

for coll_name, new_coll_name in collection_mappings.items():
    file_path = lvt_dir / f'{new_coll_name}_descriptions.json'
    
    if not file_path.exists():
        print(f'  ⚠️  {coll_name}: nema {file_path.name}')
        continue
    
    data = json.load(open(file_path, 'r', encoding='utf-8'))
    extracted = data.get('colors', [])
    
    if not extracted:
        continue
    
    # Get full_text template
    full_text_template = None
    for ec in extracted:
        desc = ec.get('description', {})
        if desc:
            full_text_template = desc.get('full_text', '')
            if full_text_template:
                break
    
    if not full_text_template:
        continue
    
    # Translate
    full_text = translate_to_serbian(full_text_template)
    
    # Find collection colors
    collection_colors = by_collection.get(coll_name, [])
    
    if collection_colors:
        updated = 0
        for color in collection_colors:
            color['description'] = full_text.strip()
            updated += 1
        
        if updated > 0:
            print(f'  ✅ {coll_name}: +{updated} boja')
            total_updated += updated

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ ZAVRŠENO! Ažurirano: {total_updated} boja')
