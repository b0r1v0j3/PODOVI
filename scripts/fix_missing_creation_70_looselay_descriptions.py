#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dodaje opise za 5 proizvoda u creation-70-looselay koji nemaju opise
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Default description for Creation 70 Looselay
default_description = """Uklonjivi podovi koji odgovaraju vašim potrebama

Proizvod:
5 veličina: uključujući riblju kost i XL daske
Ekskluzivna konstrukcija « Duo Core », ojačano staklenim vlaknima za komfor i stabilnost
ProtecShield™ lak: prirodan izgled i lako za čišćenje

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Direktno na keramiku ako je spoj <4mm

Primena:
Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice - evropska klasa 34-43

Okruženje:
100% reciklabilno
35% recikliranog sadržaja
TVOC <10µg/m³
Bez ftalata"""

# Missing codes from check: 1568, 1567, 1569, 1570, 1559
missing_codes = ['1568', '1567', '1569', '1570', '1559']

updated = 0
for color in colors:
    if color.get('collection') != 'creation-70-looselay':
        continue
    
    code = color.get('code', '').strip()
    if code not in missing_codes:
        continue
    
    if not color.get('description'):
        color['description'] = default_description
        updated += 1
        print(f'✅ {code} {color.get("name", "")} - dodat opis')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Ažurirano: {updated} proizvoda')
