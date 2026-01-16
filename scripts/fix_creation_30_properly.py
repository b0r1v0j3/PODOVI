#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FIX CREATION 30 - koristi FULL_TEXT sa strukturom, uklanja "Kreirajte bez ograničenja"
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Load creation-30 descriptions
desc_file = json.load(open('downloads/product_descriptions/lvt/creation-30-new-collection_descriptions.json', 'r', encoding='utf-8'))
extracted = desc_file.get('colors', [])

# Build index by code
by_code = {c.get('code', '').strip(): c for c in colors if c.get('collection') == 'creation-30'}

print(f'Creation-30: {len(by_code)} boja\n')

updated = 0

for ec in extracted:
    slug = ec.get('slug', '')
    desc = ec.get('description', {})
    
    if not desc:
        continue
    
    # Extract code
    code_match = re.search(r'(\d{4})', slug)
    if not code_match:
        continue
    
    code = code_match.group(1)
    color = by_code.get(code)
    
    if not color:
        continue
    
    # Use FULL_TEXT (structured) instead of intro_text
    full_text = desc.get('full_text', '')
    if not full_text:
        continue
    
    # Remove "Kreirajte bez ograničenja" / "Create without limits"
    full_text = full_text.replace('Kreirajte bez ograničenja\n', '')
    full_text = full_text.replace('Kreirajte bez ograničenja ', '')
    full_text = full_text.replace('Create without limits\n', '')
    full_text = full_text.replace('Create without limits ', '')
    
    # Translate to Serbian
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
    
    # Replace common English phrases
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
    
    color['description'] = full_text.strip()
    updated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Ažurirano: {updated} boja sa strukturiranim opisima')
