#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FORSIRA dimenzije na prvo mesto u karakteristikama
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

for color in data['colors']:
    if color.get('characteristics'):
        chars = color['characteristics']
        
        # Kreiraj potpuno novi dict sa tačnim redosledom
        new_chars = {}
        
        # Eksplicitni redosled
        if 'Dimenzije' in chars:
            new_chars['Dimenzije'] = chars['Dimenzije']
        
        if 'Ukupna debljina' in chars or 'Overall thickness' in chars:
            new_chars['Ukupna debljina'] = chars.get('Ukupna debljina') or chars.get('Overall thickness')
        
        if 'Unit/box' in chars:
            new_chars['Unit/box'] = chars['Unit/box']
        
        if 'Installation system covering' in chars:
            new_chars['Installation system covering'] = chars['Installation system covering']
        
        if 'Format details' in chars:
            new_chars['Format details'] = chars['Format details']
        
        if 'NCS' in chars:
            new_chars['NCS'] = chars['NCS']
        
        if 'LRV' in chars:
            new_chars['LRV'] = chars['LRV']
        
        if 'Surface yarn' in chars:
            new_chars['Surface yarn'] = chars['Surface yarn']
        
        if 'Pile weight' in chars:
            new_chars['Pile weight'] = chars['Pile weight']
        
        if 'Klasa upotrebe' in chars:
            new_chars['Klasa upotrebe'] = chars['Klasa upotrebe']
        
        # Dodaj sve što je ostalo
        for key, value in chars.items():
            if key not in new_chars:
                new_chars[key] = value
        
        color['characteristics'] = new_chars

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('✅ Dimenzije su sada FORSIRANO na prvom mestu!')
print('\nRedosled:')
print('  1. Dimenzije')
print('  2. Ukupna debljina')
print('  3. Unit/box')
print('  4. Installation system covering')
print('  5. Format details')
print('  6. NCS')
print('  7. LRV')
print('  8. Surface yarn')
print('  9. Pile weight')
print(' 10. Klasa upotrebe')
