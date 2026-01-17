#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Redosled karakteristika:
1. Dimenzije
2. Ukupna debljina (Overall thickness)
3. Unit/box
4. Ostalo...
"""

import sys
import json
from collections import OrderedDict

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

for color in data['colors']:
    if color.get('characteristics'):
        chars = color['characteristics']
        
        # Kreiraj novi ordered dict
        new_chars = OrderedDict()
        
        # 1. Dimenzije
        if 'Dimenzije' in chars:
            new_chars['Dimenzije'] = chars['Dimenzije']
        
        # 2. Ukupna debljina / Overall thickness
        if 'Ukupna debljina' in chars:
            new_chars['Ukupna debljina'] = chars['Ukupna debljina']
        elif 'Overall thickness' in chars:
            new_chars['Overall thickness'] = chars['Overall thickness']
        
        # 3. Unit/box
        if 'Unit/box' in chars:
            new_chars['Unit/box'] = chars['Unit/box']
        
        # 4. Sve ostalo
        for key, value in chars.items():
            if key not in new_chars:
                new_chars[key] = value
        
        color['characteristics'] = dict(new_chars)

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('✅ Karakteristike reordovane:')
print('  1. Dimenzije')
print('  2. Ukupna debljina')
print('  3. Unit/box')
print('  4. Ostalo...')
