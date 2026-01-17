#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popravlja prekratke opise za creation-70-looselay
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Full description for creation-70-looselay
full_description = """Uklonjivi podovi koji odgovaraju vašim potrebama

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

updated = 0
for color in colors:
    if color.get('collection') != 'creation-70-looselay':
        continue
    
    desc = color.get('description', '')
    if len(desc) < 100:
        color['description'] = full_description
        updated += 1
        print(f'✅ {color.get("code", "")} {color.get("name", "")} - popravljen opis')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Popravljeno: {updated} prekratkih opisa')
