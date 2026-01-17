#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Menja "Proizvod i Dekor:" u "Proizvod:" za sve carpet opise
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

# Ažuriraj carpet JSON
data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

for color in data['colors']:
    if color.get('description'):
        color['description'] = color['description'].replace('Proizvod i Dekor:', 'Proizvod:')

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('✅ carpet_tiles_complete.json ažuriran')

# Ažuriraj mock-data.ts
with open('lib/data/mock-data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Zameni za Armonia proizvode
content = content.replace('Proizvod i Dekor:', 'Proizvod:')

with open('lib/data/mock-data.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ mock-data.ts ažuriran')
print('\nSada piše samo "Proizvod:" umesto "Proizvod i Dekor:"')
