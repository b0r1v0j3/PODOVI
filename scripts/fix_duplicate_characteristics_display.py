#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popravlja duplikate u karakteristikama:
- "Sloj habanja" se prikazuje 2 puta
- Jednom iz collection_specs (0.30mm)
- Drugi put iz specs (Debljina sloja habanja: 0.30 mm)

Rešenje: Uklanja "Sloj habanja" iz collection_specs ako postoji "Debljina sloja habanja"
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

fixed = 0

for color in colors:
    if not color.get('collection_specs'):
        continue
    
    collection_specs = color['collection_specs']
    
    # Check if we have "Debljina sloja habanja" in characteristics or specs
    has_debljina_sloja = False
    
    if color.get('characteristics') and 'Debljina sloja habanja' in color['characteristics']:
        has_debljina_sloja = True
    
    if color.get('specs') and color['specs'].get('THICKNESS OF THE WEARLAYER'):
        has_debljina_sloja = True
    
    if has_debljina_sloja:
        # Remove "Sloj habanja" from collection_specs
        new_collection_specs = [
            spec for spec in collection_specs 
            if spec.get('key') != 'wear_layer' and spec.get('label') != 'Sloj habanja'
        ]
        
        if len(new_collection_specs) < len(collection_specs):
            color['collection_specs'] = new_collection_specs
            fixed += 1
            if fixed <= 10:
                print(f'✅ {color.get("collection", "")} {color.get("code", "")} - uklonjeno "Sloj habanja" iz collection_specs')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Popravljeno: {fixed} duplikata')
