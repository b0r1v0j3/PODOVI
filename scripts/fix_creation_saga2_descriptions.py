#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popravlja opise za Creation Saga² - prevodi engleski i strukturiše
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Proper description for Creation Saga²
proper_description = """Proizvod:
5 veličina: uključujući riblju kost i XL daske
Ekskluzivna konstrukcija « Duo Core » sa pluto jezgrom za komfor i akustične performanse (15 dB smanjenje buke)
ProtecShield™ površinska obrada: lako za čišćenje, bez potrebe za voskom

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Direktno na keramiku ako je spoj <5mm

Primena:
Idealno za zone sa visokim prometom: prodavnice, kancelarije, recepcije, itd.

Okruženje:
100% reciklabilno
55% recikliranog sadržaja
Pluto: obnovljiva sirovina
TVOC <10µg/m³
Bez ftalata"""

def fix_saga_description(desc):
    """Fix Creation Saga² description"""
    if not desc:
        return proper_description
    
    # If already has proper structure, just clean it
    if 'Proizvod:' in desc and 'Ugradnja:' in desc:
        # Translate remaining English
        result = desc
        
        # Fix common issues
        result = result.replace('cork konstrukcija', 'pluto konstrukcija')
        result = result.replace('Duo jezgra', 'Duo Core')
        result = result.replace('more Komfor', 'za komfor')
        result = result.replace('acoustical performances', 'akustične performanse')
        result = result.replace('15 dB impact smanjenje buke', '15 dB smanjenje buke')
        result = result.replace('no wax needed', 'bez potrebe za voskom')
        result = result.replace('ceramics if spoj', 'keramiku ako je spoj')
        result = result.replace('high prometom zone', 'visokim prometom zone')
        result = result.replace('offices', 'kancelarije')
        result = result.replace('lobby', 'recepcije')
        result = result.replace('Renewable raw material', 'obnovljiva sirovina')
        result = result.replace('1 square tile format', 'Format: kvadratna pločica')
        
        return result
    
    return proper_description

updated = 0
for color in colors:
    if color.get('collection') == 'creation-saga2':
        desc = color.get('description', '')
        fixed = fix_saga_description(desc)
        if fixed != desc:
            color['description'] = fixed
            updated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Popravljeno: {updated} Creation Saga² opisa')
