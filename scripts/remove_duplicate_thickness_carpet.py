#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Uklanja duplikate debljine u carpet karakteristikama
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

fixed = 0
for color in data['colors']:
    if color.get('characteristics'):
        chars = color['characteristics']
        
        # Ukloni "Overall thickness" ako postoji "Ukupna debljina"
        # Ili obrnuto - zadrži samo jedan
        has_overall = 'Overall thickness' in chars
        has_ukupna = 'Ukupna debljina' in chars
        
        if has_overall and has_ukupna:
            # Zadrži "Overall thickness" (engleski), ukloni "Ukupna debljina"
            del chars['Ukupna debljina']
            fixed += 1
        elif has_overall:
            # Preimenuj u srpski
            chars['Ukupna debljina'] = chars['Overall thickness']
            del chars['Overall thickness']
            fixed += 1

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Uklonjeno duplikata debljine: {fixed}')
