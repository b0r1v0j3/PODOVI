#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Uklanja Length i Width iz karakteristika - ostavljamo samo Dimenzije
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

fixed = 0
for color in data['colors']:
    if color.get('characteristics'):
        chars = color['characteristics']
        
        # Ukloni Length i Width, zadrži samo Dimenzije
        if 'Length' in chars:
            del chars['Length']
            fixed += 1
        if 'Width' in chars:
            del chars['Width']
            fixed += 1

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Uklonjeno {fixed} duplikata (Length i Width)')
print('Sada se prikazuje samo "Dimenzije: 50 cm X 50 cm"')
