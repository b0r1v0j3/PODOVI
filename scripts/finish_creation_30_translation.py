#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Završava prevod Creation 30 - prevodi preostale engleske reči
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

updated = 0

for color in colors:
    if color.get('collection') != 'creation-30':
        continue
    
    desc = color.get('description', '')
    if not desc:
        continue
    
    # Translate remaining English words
    desc = desc.replace('rectangular tiles', 'pravougaone pločice')
    desc = desc.replace('square tiles', 'kvadratne pločice')
    desc = desc.replace('standard planks', 'standardne daske')
    desc = desc.replace('XL planks', 'XL daske')
    
    color['description'] = desc
    updated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Ažurirano: {updated} boja - sve na srpskom')
