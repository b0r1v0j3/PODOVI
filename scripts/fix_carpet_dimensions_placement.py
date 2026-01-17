#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
1. Uklanja dimenzije iz opisa
2. Stavlja dimenzije na prvo mesto u karakteristikama
"""

import sys
import json
from collections import OrderedDict

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

for color in data['colors']:
    # 1. Ukloni dimenzije iz opisa
    if color.get('description'):
        desc = color['description']
        # Ukloni liniju sa dimenzijama
        desc = desc.replace('• 50×50cm format pločica\n', '')
        desc = desc.replace('• 50×50cm format pločica', '')
        color['description'] = desc
    
    # 2. Reorganizuj characteristics da Dimenzije budu prvo
    if color.get('characteristics'):
        chars = color['characteristics']
        
        # Kreiraj novi ordered dict sa Dimenzije prvo
        new_chars = OrderedDict()
        
        # Prvo dimenzije
        if 'Dimenzije' in chars:
            new_chars['Dimenzije'] = chars['Dimenzije']
        
        # Onda sve ostalo
        for key, value in chars.items():
            if key != 'Dimenzije':
                new_chars[key] = value
        
        color['characteristics'] = dict(new_chars)

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('✅ Dimenzije uklonjene iz opisa')
print('✅ Dimenzije su sada na prvom mestu u karakteristikama')
