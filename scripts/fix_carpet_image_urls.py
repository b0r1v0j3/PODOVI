#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popravlja putanje do slika u carpet JSON-u
"""

import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

# Pronađi sve slike u folderu
carpet_images = Path('public/images/products/carpet')
all_images = {f.name: f for f in carpet_images.glob('*.jpg')}

print(f'Pronađeno {len(all_images)} slika u folderu\n')

# Mapiranje kodova na slike
code_to_images = {}
for img_name in all_images.keys():
    # Ekstraktuj kod iz imena fajla
    # Npr: "57596 - ARMONIA 400 Indigo - Color Scan.jpg" -> 1801
    if '1801' in img_name or 'Indigo' in img_name:
        if '1801' not in code_to_images:
            code_to_images['1801'] = []
        code_to_images['1801'].append(img_name)
    elif '6501' in img_name or 'Beige' in img_name:
        if '6501' not in code_to_images:
            code_to_images['6501'] = []
        code_to_images['6501'].append(img_name)
    # ... itd za ostale boje

# Za sada, ažuriram da koriste tačne putanje
fixed = 0
for color in data['colors']:
    code = color['code']
    
    # Pronađi slike za ovaj kod
    matching_images = [img for img in all_images.keys() if code in img]
    
    if matching_images:
        # Sortiraj: Color Scan prvo, onda Room Scene/Zoom
        color_scan = [img for img in matching_images if 'Color Scan' in img]
        zoom = [img for img in matching_images if 'Room' in img or 'Colour' in img or 'zoom' in img.lower()]
        
        if color_scan:
            color['image_url'] = f"/images/products/carpet/{color_scan[0]}"
            fixed += 1
        
        if zoom:
            color['texture_url'] = f"/images/products/carpet/{zoom[0]}"
        
        if color_scan or zoom:
            print(f'✅ {code} {color.get("name", "")}: {len(color_scan)} + {len(zoom)} slika')

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'\n✅ Popravljeno: {fixed} boja')
