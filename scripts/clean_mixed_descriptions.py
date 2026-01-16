#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Uklanja mešane prefikse iz opisa ("Dizajn i proizvod\n", "Kreirajte bez ograničenja", itd.)
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

cleaned = 0

for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    original = desc
    # Remove common prefixes
    desc = desc.replace('Dizajn i proizvod\n', '')
    desc = desc.replace('Dizajn i proizvod\n\n', '')
    desc = desc.replace('Dizajn i proizvod\n ', '')
    desc = desc.replace('Kreirajte bez ograničenja\n', '')
    desc = desc.replace('Kreirajte bez ograničenja\n\n', '')
    desc = desc.replace('Kreirajte bez ograničenja ', '')
    desc = desc.replace('Kreirajte bez ograničenja', '')
    
    # Remove " with" at start if it appears
    if desc.startswith(' with '):
        desc = desc[6:]
    if desc.startswith('with '):
        desc = desc[5:]
    
    # Clean up multiple newlines
    desc = desc.replace('\n\n\n', '\n\n')
    desc = desc.strip()
    
    if desc != original and desc:
        color['description'] = desc
        cleaned += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Očišćeno: {cleaned} opisa')
