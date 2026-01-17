#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Uklanja duplikat sloja habanja - ostavlja samo jedan
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

fixed = 0

for color in colors:
    if not color.get('characteristics'):
        continue
    
    chars = color['characteristics']
    
    # Check if both exist
    has_debljina = 'Debljina sloja habanja' in chars
    has_sloj = 'Sloj habanja' in chars
    
    if has_debljina and has_sloj:
        # Keep "Debljina sloja habanja", remove "Sloj habanja"
        del chars['Sloj habanja']
        fixed += 1
        if fixed <= 10:
            print(f'✅ {color.get("collection", "")} {color.get("code", "")} - uklonjeno "Sloj habanja"')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Uklonjeno duplikata: {fixed}')
