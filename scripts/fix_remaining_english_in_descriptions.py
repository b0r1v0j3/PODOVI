#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popravlja preostale engleske fraze u opisima
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Dodatni rečnik prevoda
translations = {
    'Ideal for moderate traffic areas - office, hotel, shops - european class 33/42': 'Idealno za zone sa umerenim prometom: kancelarije, hoteli, prodavnice - evropska klasa 33/42',
    'Ideal for intense traffic areas - office, hotel, shops - european class 34-43': 'Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice - evropska klasa 34-43',
    'european class': 'evropska klasa',
    'Looselay up to 30sqm': 'Looselay do 30m²',
    '4 sizes': '4 veličine',
    '5 sizes': '5 veličina',
    'Exclusive construction': 'Ekskluzivna konstrukcija',
    'reinforced with': 'ojačano sa',
    'fiber glass': 'staklenim vlaknima',
    'for comfort': 'za komfor',
    'stability': 'stabilnost',
    'natural look': 'prirodan izgled',
    'easy to clean': 'lako za čišćenje',
    'suitable for raised floor': 'pogodno za podignute podove',
    'Direct on ceramic if joint <4mm': 'Direktno na keramiku ako je spoj <4mm',
    'Direct on ceramic': 'Direktno na keramiku',
    'Ideal for': 'Idealno za',
    'ideal for': 'idealno za',
    'moderate traffic areas': 'zone sa umerenim prometom',
    'intense traffic areas': 'zone sa intenzivnim prometom',
    'high traffic areas': 'zone sa visokim prometom',
    'office, hotel, shops': 'kancelarije, hoteli, prodavnice',
    'recyclable': 'reciklabilno',
    'recycled content': 'recikliranog sadržaja',
    'Phtalate free': 'Bez ftalata',
    'phthalate free': 'bez ftalata',
}

updated = 0
for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    original = desc
    
    # Replace all phrases
    for eng, srb in sorted(translations.items(), key=lambda x: -len(x[0])):
        desc = desc.replace(eng, srb)
    
    if desc != original:
        color['description'] = desc
        updated += 1
        if updated <= 10:
            print(f'✅ {color.get("collection", "")} {color.get("code", "")} {color.get("name", "")}')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Prevedeno: {updated} opisa')
