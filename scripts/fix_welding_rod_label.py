#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Zameni 'Šifra šipke za varenje' sa 'Elektroda za varenje'"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

# Fix linoleum_colors_complete.json
data = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))
colors = data.get('colors', [])
changed = 0

for color in colors:
    chars = color.get('characteristics', {})
    if 'Šifra šipke za varenje' in chars:
        chars['Elektroda za varenje'] = chars.pop('Šifra šipke za varenje')
        changed += 1

json.dump(data, open('public/data/linoleum_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print(f'Promenjeno: {changed} boja')
