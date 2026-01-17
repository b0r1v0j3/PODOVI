#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NAJDETALJNIJI PREGLED SAJTA - sve stranice, svi proizvodi, sve greške
"""

import sys
import json
import re
from pathlib import Path
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

print('=' * 120)
print('NAJDETALJNIJI PREGLED SAJTA')
print('=' * 120)

# Load all data
lvt_data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
lvt_colors = lvt_data.get('colors', [])

linoleum_data = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))
linoleum_colors = linoleum_data.get('colors', [])

all_colors = lvt_colors + linoleum_colors

print(f'\n📊 UKUPNO: {len(all_colors)} proizvoda')
print(f'   - LVT: {len(lvt_colors)}')
print(f'   - Linoleum: {len(linoleum_colors)}')

# 1. DETALJNIJI PREGLED KARAKTERISTIKA
print('\n' + '=' * 120)
print('1. PREGLED KARAKTERISTIKA PO PROIZVODU')
print('=' * 120)

characteristics_stats = defaultdict(lambda: {
    'has_dimension': 0,
    'has_format': 0,
    'has_thickness': 0,
    'has_wear_layer': 0,
    'has_ncs': 0,
    'has_lrv': 0,
    'has_packaging': 0,
    'total': 0
})

for color in all_colors:
    coll = color.get('collection', 'unknown')
    characteristics_stats[coll]['total'] += 1
    
    if color.get('dimension'):
        characteristics_stats[coll]['has_dimension'] += 1
    if color.get('format'):
        characteristics_stats[coll]['has_format'] += 1
    if color.get('overall_thickness'):
        characteristics_stats[coll]['has_thickness'] += 1
    
    specs = color.get('specs', {})
    if specs:
        if specs.get('THICKNESS OF THE WEARLAYER'):
            characteristics_stats[coll]['has_wear_layer'] += 1
        if specs.get('NCS'):
            characteristics_stats[coll]['has_ncs'] += 1
        if specs.get('LRV'):
            characteristics_stats[coll]['has_lrv'] += 1
        if specs.get('PACKAGING'):
            characteristics_stats[coll]['has_packaging'] += 1
    
    # Also check characteristics dict
    chars = color.get('characteristics', {})
    if chars:
        if 'Debljina sloja habanja' in chars:
            characteristics_stats[coll]['has_wear_layer'] += 1

print(f'\n{"Kolekcija":<40} {"Dim":<8} {"Format":<8} {"Thick":<8} {"Wear":<8} {"NCS":<8} {"LRV":<8} {"Pack":<8}')
print('-' * 120)

for coll in sorted(characteristics_stats.keys()):
    s = characteristics_stats[coll]
    total = s['total']
    print(f"{coll:<40} {s['has_dimension']}/{total:<6} {s['has_format']}/{total:<6} {s['has_thickness']}/{total:<6} {s['has_wear_layer']}/{total:<6} {s['has_ncs']}/{total:<6} {s['has_lrv']}/{total:<6} {s['has_packaging']}/{total:<6}")

# 2. PREGLED OPISA
print('\n' + '=' * 120)
print('2. PREGLED OPISA')
print('=' * 120)

desc_issues = {
    'missing': [],
    'too_short': [],  # < 100 karaktera
    'no_sections': [],
    'english_words': [],
}

for color in all_colors:
    desc = color.get('description', '')
    slug = color.get('slug', '')
    collection = color.get('collection', '')
    code = color.get('code', '')
    
    if not desc:
        desc_issues['missing'].append(f"{collection} {code}")
    elif len(desc) < 100:
        desc_issues['too_short'].append(f"{collection} {code} ({len(desc)} chars)")
    else:
        # Check for sections
        if 'Proizvod:' not in desc and 'Product:' not in desc:
            desc_issues['no_sections'].append(f"{collection} {code}")
        
        # Check for English words
        english_patterns = [
            r'\b(Product|Installation|Application|Environment)\s*:',
            r'\bIdeal\s+for\b',
            r'\boffice,?\s+hotel,?\s+shops\b',
            r'\beuropean\s+class\b',
            r'\bmoderate\s+traffic\b',
            r'\bintense\s+traffic\b',
        ]
        for pattern in english_patterns:
            if re.search(pattern, desc, re.IGNORECASE):
                desc_issues['english_words'].append(f"{collection} {code}")
                break

print(f'\n❌ Nedostaje opis: {len(desc_issues["missing"])}')
print(f'⚠️  Prekratki opisi (< 100 chars): {len(desc_issues["too_short"])}')
if desc_issues['too_short'][:5]:
    for item in desc_issues['too_short'][:5]:
        print(f'   - {item}')

print(f'\n⚠️  Bez sekcija: {len(desc_issues["no_sections"])}')
if desc_issues['no_sections'][:5]:
    for item in desc_issues['no_sections'][:5]:
        print(f'   - {item}')

print(f'\n🔴 Sa engleskim: {len(desc_issues["english_words"])}')
if desc_issues['english_words'][:10]:
    print('\nPrimeri engleskog:')
    for item in desc_issues['english_words'][:10]:
        print(f'   - {item}')

# 3. PREGLED SLIKA
print('\n' + '=' * 120)
print('3. PREGLED SLIKA')
print('=' * 120)

image_stats = {
    'missing': 0,
    'has_image': 0,
    'has_texture': 0,
    'has_lifestyle': 0,
}

for color in all_colors:
    if not color.get('image_url') and not color.get('texture_url'):
        image_stats['missing'] += 1
    else:
        image_stats['has_image'] += 1
        if color.get('texture_url'):
            image_stats['has_texture'] += 1
        if color.get('lifestyle_url'):
            image_stats['has_lifestyle'] += 1

print(f'\n✅ Sa slikama: {image_stats["has_image"]}/{total} ({image_stats["has_image"]/total*100:.1f}%)')
print(f'❌ Bez slika: {image_stats["missing"]}')
print(f'📸 Sa texture slikom: {image_stats["has_texture"]}/{total}')
print(f'🖼️  Sa lifestyle slikom: {image_stats["has_lifestyle"]}/{total}')

# 4. FINALNI REZIME
print('\n' + '=' * 120)
print('FINALNI REZIME')
print('=' * 120)

total_issues = (
    len(desc_issues['missing']) + 
    len(desc_issues['too_short']) + 
    len(desc_issues['no_sections']) + 
    len(desc_issues['english_words']) + 
    image_stats['missing']
)

print(f'\n📊 UKUPNO PROBLEMA: {total_issues}')
print(f'\n🎯 PRIORITETI:')
print(f'   1. 🔴 Prevesti {len(desc_issues["english_words"])} opisa sa engleskim')
print(f'   2. ⚠️  Strukturirati {len(desc_issues["no_sections"])} opisa')
print(f'   3. ⚠️  Popraviti {len(desc_issues["too_short"])} prekratkih opisa')
print(f'   4. ❌ Dodati slike za {image_stats["missing"]} proizvoda')

print('\n' + '=' * 120)
