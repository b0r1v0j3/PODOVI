#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Uklanja Classification iz karakteristika - zadržavamo samo Klasa upotrebe
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

fixed = 0
for color in data['colors']:
    if color.get('characteristics'):
        chars = color['characteristics']
        
        # Ukloni "Classification (BS EN 13307)" ako postoji "Klasa upotrebe"
        keys_to_remove = []
        for key in chars.keys():
            if 'classification' in key.lower() and 'BS EN' in key:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del chars[key]
            fixed += 1

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Uklonjeno {fixed} duplikata (Classification)')
print('Zadržano samo "Klasa upotrebe: 33"')
