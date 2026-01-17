#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dodaje nedostajuću 6103 POLVERE
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

# Pronađi 6103 ili 8103
found = False
for color in data['colors']:
    if color['collection'] == 'gerflor-armonia-620':
        code = color['code']
        if code in ['6103', '8103']:  # Možda sam stavio 8103 greš ko
            if color.get('specs'):
                color['specs']['NCS'] = "6010-Y30R"  # Sa screenshot-a
                color['specs']['LRV'] = "28.9"
                color['specs']['UNIT_BOX'] = "20"
                
            if color.get('characteristics'):
                color['characteristics']['NCS'] = "6010-Y30R"
                color['characteristics']['LRV'] = "28.9"
                color['characteristics']['Unit/box'] = "20"
            
            found = True
            print(f'✅ Pronađeno i ažurirano: {code} POLVERE')
            break

if not found:
    print('⚠️  6103/8103 POLVERE nije pronađeno - dodajem je')
    
    data['colors'].append({
        "collection": "gerflor-armonia-620",
        "collection_name": "Armonia 620",
        "code": "8103",  # Korektni kod
        "name": "8103 POLVERE",
        "full_name": "8103 POLVERE",
        "slug": "armonia-620-8103-polvere",
        "image_url": "/images/products/carpet/56706 - ARMONIA 620 Polvere - Color Scan.jpg",
        "texture_url": "/images/products/carpet/56711 - ARMONIA620Polvere-RoomSceneViewColour.jpg",
        "image_count": 2,
        "description": data['colors'][-1]['description'],  # Isti kao ostale 620
        "dimension": "50 cm X 50 cm",
        "format": "Square tile",
        "overall_thickness": "6.50 mm",
        "specs": {
            "NCS": "6010-Y30R",
            "LRV": "28.9",
            "UNIT_BOX": "20",
            "PILE_WEIGHT": "620 g/m²",
            "SURFACE_YARN": "Solution Dyed Nylon - Econyl®",
            "INSTALLATION": "Looselay (Tackified)",
            "CLASSIFICATION": "Class 33"
        },
        "characteristics": {
            "Length": "50 cm",
            "Width": "50 cm",
            "Unit/box": "20",
            "Overall thickness": "6.50 mm",
            "NCS": "6010-Y30R",
            "LRV": "28.9",
            "Surface yarn": "Econyl"
        }
    })
    data['total'] = len(data['colors'])

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'\nUkupno Armonia 620 boja: {sum(1 for c in data["colors"] if c["collection"] == "gerflor-armonia-620")}')
print(f'Ukupno svih boja: {data["total"]}')
