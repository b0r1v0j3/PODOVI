#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popravlja preostalih 19 opisa sa engleskim
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Detaljni rečnik
translations = {
    'Removable flooring': 'Uklonjivi podovi',
    'to meet your needs': 'koji odgovaraju vašim potrebama',
    'Product :': 'Proizvod:',
    'Product:': 'Proizvod:',
    '4 sizes': '4 veličine',
    '5 sizes': '5 veličina',
    'including herringbone and XL planks': 'uključujući riblju kost i XL daske',
    'Exclusive construction « Duo Core »': 'Ekskluzivna konstrukcija « Duo Core »',
    'reinforced with a fiber glass for comfort & stability': 'ojačano staklenim vlaknima za komfor i stabilnost',
    'ProtecShield™ varnish  :  natural look and easy to clean': 'ProtecShield™ lak: prirodan izgled i lako za čišćenje',
    'Installation :': 'Ugradnja:',
    'Installation:': 'Ugradnja:',
    'Looselay up to 30sqm': 'Looselay do 30m²',
    'Removable installation with tackifier - suitable for raised floor': 'Uklonjiva ugradnja sa lepkom - pogodno za podignute podove',
    'suitable for raised floor': 'pogodno za podignute podove',
    'Direct on ceramic if joint <4mm': 'Direktno na keramiku ako je spoj <4mm',
    'Application :': 'Primena:',
    'Application:': 'Primena:',
    'Ideal for moderate traffic areas : office, hotel, shops - european class 33/42': 'Idealno za zone sa umerenim prometom: kancelarije, hoteli, prodavnice - evropska klasa 33/42',
    'Ideal for intense traffic areas : office, hotel, shops - european class 34-43': 'Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice - evropska klasa 34-43',
    'Environment :': 'Okruženje:',
    'Environment:': 'Okruženje:',
    '100% recyclable': '100% reciklabilno',
    '35% recycled content': '35% recikliranog sadržaja',
    'TVOC <10µg/m3': 'TVOC <10µg/m³',
    'Phtalate free': 'Bez ftalata',
}

updated = 0
for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    # Check if has English
    if not re.search(r'\b(Product|Installation|Application|Environment|Ideal\s+for|office,?\s+hotel,?\s+shops|european\s+class|moderate\s+traffic|intense\s+traffic|recyclable|Phtalate)\b', desc, re.IGNORECASE):
        continue
    
    original = desc
    
    # Apply translations
    for eng, srb in sorted(translations.items(), key=lambda x: -len(x[0])):
        desc = desc.replace(eng, srb)
    
    if desc != original:
        color['description'] = desc
        updated += 1
        if updated <= 10:
            print(f'✅ {color.get("collection", "")} {color.get("code", "")} {color.get("name", "")}')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Prevedeno: {updated} opisa')
