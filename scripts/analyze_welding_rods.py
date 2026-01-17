#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analizira elektrode za varenje i grupiše boje po elektrodama
"""

import sys
import json
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

linoleum_data = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))
linoleum_colors = linoleum_data.get('colors', [])

# Group by welding rod
by_welding_rod = defaultdict(list)

for color in linoleum_colors:
    welding_rod = color.get('welding_rod', '').strip()
    if welding_rod:
        by_welding_rod[welding_rod].append({
            'code': color.get('code', ''),
            'name': color.get('name', ''),
            'collection': color.get('collection', ''),
            'slug': color.get('slug', ''),
            'image_url': color.get('image_url', ''),
        })

print('=' * 100)
print('ELEKTRODE ZA VARENJE')
print('=' * 100)

print(f'\n📊 Ukupno elektroda: {len(by_welding_rod)}')
print(f'📊 Ukupno boja: {len(linoleum_colors)}')
print(f'📊 Boja bez elektrode: {sum(1 for c in linoleum_colors if not c.get("welding_rod"))}')

print('\n🔧 Elektrode sa brojem boja:')
for weld_rod, colors_list in sorted(by_welding_rod.items(), key=lambda x: -len(x[1]))[:20]:
    print(f'   {weld_rod}: {len(colors_list)} boja')

# Create welding rod pages data
welding_rod_pages = []

for weld_rod, colors_list in sorted(by_welding_rod.items()):
    # Extract color info from first color
    first_color = colors_list[0]
    
    # Parse welding rod reference to extract color info
    # Format: R8970001 where 897 is collection, 0001 is code
    slug = f"lino-welding-rod-4mm-mat-40-{first_color['code']}-{first_color['name'].lower().replace(' ', '-')}-{weld_rod.lower()}"
    
    welding_rod_pages.append({
        'welding_rod_ref': weld_rod,
        'slug': slug,
        'code': first_color['code'],
        'name': first_color['name'],
        'colors_count': len(colors_list),
        'colors': colors_list
    })

# Save
output_file = 'public/data/welding_rods.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        'total': len(welding_rod_pages),
        'welding_rods': welding_rod_pages
    }, f, indent=2, ensure_ascii=False)

print(f'\n✅ Kreirano: {len(welding_rod_pages)} stranica za elektrode')
print(f'📁 Sačuvano u: {output_file}')
