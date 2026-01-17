#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Finalni prevod svih engleskih reči i fraza
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

# Sveobuhvatni rečnik
translations = {
    # Removable flooring phrases
    'Removable flooring to meet your needs': 'Uklonjivi podovi koji odgovaraju vašim potrebama',
    'Product :': 'Proizvod:',
    '5 sizes : including herringbone and XL planks': '5 veličina: uključujući riblju kost i XL daske',
    'Exclusive construction « Duo Core », reinforced with a fiber glass for comfort & stability': 'Ekskluzivna konstrukcija « Duo Core », ojačano staklenim vlaknima za komfor i stabilnost',
    'ProtecShield™ varnish  :  natural look and easy to clean': 'ProtecShield™ lak: prirodan izgled i lako za čišćenje',
    'Installation :': 'Ugradnja:',
    'Removable installation with tackifier - suitable for raised floor': 'Uklonjiva ugradnja sa lepkom - pogodno za podignute podove',
    'Direct on ceramic if joint <4mm': 'Direktno na keramiku ako je spoj <4mm',
    'Application :': 'Primena:',
    'Ideal for intense traffic areas : office, hotel, shops - european class 34-43': 'Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice - evropska klasa 34-43',
    'Environment :': 'Okruženje:',
    '100% recyclable': '100% reciklabilno',
    '35% recycled content': '35% recikliranog sadržaja',
    'TVOC <10µg/m3': 'TVOC <10µg/m³',
    'Phtalate free': 'Bez ftalata',
}

def translate_description(desc):
    """Translate description"""
    if not desc:
        return desc
    
    result = desc
    
    # Replace common phrases (longer first)
    for eng, srb in sorted(translations.items(), key=lambda x: -len(x[0])):
        result = result.replace(eng, srb)
    
    return result

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

translated = 0
for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    new_desc = translate_description(desc)
    if new_desc != desc:
        color['description'] = new_desc
        translated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Prevedeno: {translated} opisa')
