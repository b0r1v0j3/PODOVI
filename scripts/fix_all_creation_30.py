#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FIX SVE CREATION 30 - koristi FULL_TEXT, uklanja "Kreirajte bez ograničenja", prevodi na srpski
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

# Build index by code for creation-30
by_code = {}
for c in colors:
    if c.get('collection') == 'creation-30':
        code = c.get('code', '').strip()
        if code:
            by_code[code] = c

print(f'Creation-30: {len(by_code)} boja\n')

updated = 0

# Get full_text from first color (all creation-30 have same description)
full_text_template = None
for ec in extracted:
    desc = ec.get('description', {})
    if desc:
        full_text_template = desc.get('full_text', '')
        if full_text_template:
            break

if not full_text_template:
    print('❌ Nema full_text template!')
    sys.exit(1)

# Remove "Kreirajte bez ograničenja" / "Create without limits"
full_text = full_text_template.replace('Create without limits\n', '')
full_text = full_text.replace('Create without limits ', '')
full_text = full_text.replace('Kreirajte bez ograničenja\n', '')
full_text = full_text.replace('Kreirajte bez ograničenja ', '')

# Translate to Serbian
translations = {
    'Design & Product': 'Dizajn i proizvod',
    'Installation & Maintenance': 'Ugradnja i održavanje',
    'Sustainability & Comfort': 'Održivost i komfor',
    'Complete format offering:': 'Kompletan format:',
    'designed to meet every project need': 'dizajnirano da zadovolji svaki projekat',
    'Refined designs & harmonious color palettes:': 'Profinjeni dizajni i harmonične palete boja:',
    'every detail crafted to create exclusiv space': 'svaki detalj osmišljen da stvori ekskluzivan prostor',
    'New surface embosses:': 'Novi površinski utisci:',
    'ultra-realistic and varied textures that elevate each design': 'ultra-realistične i raznovrsne teksture koje uzdignu svaki dizajn',
    'Ultra-matt finish with Protecshield™:': 'Ultra-mat završetak sa Protecshield™:',
    'velvet touch and natural elegance': 'baršunasti dodir i prirodna elegancija',
    'Smart Design – up to 3sqm of design variation:': 'Smart Design – do 3 m² varijacije dizajna:',
    'enhanced visual variation on selected designs for deeper realism': 'poboljšana vizuelna varijacija na odabranim dizajnima za dublji realizam',
    'Smart Comfort innovation:': 'Smart Comfort inovacija:',
    'acoustic top layer for better walking (79dB) and thermal comfort': 'akustični gornji sloj za bolje hodanje (79dB) i toplotni komfor',
    '4 bevelled edges:': '4 zakošene ivice:',
    'authentic wood and tile effects': 'autentičan efekat drveta i pločica',
    'From floor to wall:': 'Od poda do zida:',
    'create seamless harmony with our Mural Revela Collection': 'stvorite besprekornu harmoniju sa našom Mural Revela kolekcijom',
    'Dry Back system:': 'Dry Back sistem:',
    'professional-grade installation for lasting performance': 'profesionalna ugradnja za dugotrajnu performansu',
    'Ideal for new build': 'Idealno za novu gradnju',
    'Protecshield™ surface treatment:': 'Protecshield™ površinska obrada:',
    'enhanced resistance, effortless cleaning': 'poboljšana otpornost, jednostavno čišćenje',
    'Efficient maintenance protocol:': 'Efikasan protokol održavanja:',
    'simplified care, maximum impact': 'pojednostavljena nega, maksimalan efekat',
}

for eng, srb in translations.items():
    full_text = full_text.replace(eng, srb)

# Apply to ALL creation-30 colors
for code, color in by_code.items():
    color['description'] = full_text.strip()
    updated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Ažurirano: {updated} boja sa strukturiranim opisima na srpskom')
