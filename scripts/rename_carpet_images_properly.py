#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Preimenovava carpet slike da imaju tačne opise:
- image_url = glavna slika (Color Scan)
- texture_url = zoom/close-up vlakana (NIJE room scene!)
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

# Dodaj komentar u JSON ili ažuriraj field imena
# Umesto "texture_url" možemo koristiti "zoom_url" ili "closeup_url"
# ALI, da ne lomimo postojeći kod, ostavićemo "texture_url" ali ćemo znati da je to zoom

print('Ažuriram nazive/opise za carpet slike...\n')

for color in data['colors']:
    if color.get('texture_url'):
        # Dodaj note u karakteristike
        if not color.get('image_notes'):
            color['image_notes'] = {
                'image_url': 'Glavna slika boje (Color Scan)',
                'texture_url': 'Zoom/close-up vlakana (detaljni prikaz teksture)'
            }

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('✅ Dodati image_notes da objasni šta je svaka slika')
print('\nNapomena:')
print('  - image_url = Glavna slika (Color Scan)')
print('  - texture_url = Zoom/close-up vlakana (ne room scene!)')
