#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ažurira carpet boje da vode na kolekciju sa color parametrom
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

# Dodaj collection_slug za svaku boju
for color in data['colors']:
    collection = color.get('collection', '')
    
    # Dodaj collection_slug field koji će ProductCard koristiti za link
    if collection == 'gerflor-armonia-400':
        color['collection_slug'] = 'gerflor-armonia-400'
    elif collection == 'gerflor-armonia-540':
        color['collection_slug'] = 'gerflor-armonia-540'
    elif collection == 'gerflor-armonia-620':
        color['collection_slug'] = 'gerflor-armonia-620'

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Dodato collection_slug za sve carpet boje')
print('\nURL struktura će biti:')
print('  /proizvodi/gerflor-armonia-400?color=armonia-400-1801-indigo')
print('  umesto')
print('  /proizvodi/armonia-400-1801-indigo')
