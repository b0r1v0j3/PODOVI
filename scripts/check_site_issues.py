#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Detaljna provera sajta - šta ne valja
"""

import sys
import json
import re
from pathlib import Path
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

lvt_data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
lvt_colors = lvt_data.get('colors', [])

linoleum_data = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))
linoleum_colors = linoleum_data.get('colors', [])

all_colors = lvt_colors + linoleum_colors

print('=' * 80)
print('DETALJNA PROVERA SAJTA')
print('=' * 80)

issues = {
    'missing_description': [],
    'missing_dimension': [],
    'missing_format': [],
    'missing_thickness': [],
    'english_in_description': [],
    'no_sections_in_description': [],
    'missing_image': [],
    'empty_description': [],
}

# Check each color
for color in all_colors:
    slug = color.get('slug', '')
    collection = color.get('collection', '')
    name = color.get('name', '')
    code = color.get('code', '')
    
    # Missing description
    if not color.get('description'):
        issues['missing_description'].append({
            'slug': slug,
            'collection': collection,
            'name': name,
            'code': code
        })
    else:
        desc = color.get('description', '')
        
        # Empty description
        if desc.strip() == '':
            issues['empty_description'].append({
                'slug': slug,
                'collection': collection,
                'name': name,
                'code': code
            })
        
        # Check for English words (common patterns)
        english_patterns = [
            r'\b(Product|Installation|Application|Environment|Design|Maintenance)\s*:',
            r'\b(Synthetic|decorative|flexible|PVC|flooring|solution)',
            r'\b(available|features|wear-layer|high definition)',
            r'\b(crosslinked|polyurethane|surface treatment)',
            r'\b(glue-down|classified|according|standard)',
            r'\b(recyclable|recycled|content|complies|regulations)',
            r'\b(emissions|below|earning|rating|highest|level)',
        ]
        
        for pattern in english_patterns:
            if re.search(pattern, desc, re.IGNORECASE):
                if not any(item['slug'] == slug for item in issues['english_in_description']):
                    issues['english_in_description'].append({
                        'slug': slug,
                        'collection': collection,
                        'name': name,
                        'code': code,
                        'matches': re.findall(pattern, desc, re.IGNORECASE)
                    })
                break
        
        # Check if description has sections
        section_titles = [
            'Proizvod:', 'Ugradnja:', 'Primena:', 'Okruženje:',
            'Product:', 'Installation:', 'Application:', 'Environment:'
        ]
        has_section = any(title in desc for title in section_titles)
        if not has_section and desc:
            issues['no_sections_in_description'].append({
                'slug': slug,
                'collection': collection,
                'name': name,
                'code': code
            })
    
    # Missing dimension
    if not color.get('dimension'):
        issues['missing_dimension'].append({
            'slug': slug,
            'collection': collection,
            'name': name,
            'code': code
        })
    
    # Missing format
    if not color.get('format'):
        issues['missing_format'].append({
            'slug': slug,
            'collection': collection,
            'name': name,
            'code': code
        })
    
    # Missing thickness
    if not color.get('overall_thickness'):
        issues['missing_thickness'].append({
            'slug': slug,
            'collection': collection,
            'name': name,
            'code': code
        })
    
    # Missing image
    if not color.get('image_url') and not color.get('texture_url'):
        issues['missing_image'].append({
            'slug': slug,
            'collection': collection,
            'name': name,
            'code': code
        })

# Report issues
print('\n📋 IZVEŠTAJ O PROBLEMIMA\n')

print(f'❌ NEDOSTAJU OPISI: {len(issues["missing_description"])}')
if issues['missing_description']:
    by_collection = defaultdict(list)
    for item in issues['missing_description']:
        by_collection[item['collection']].append(item)
    for coll, items in sorted(by_collection.items()):
        print(f'  • {coll}: {len(items)} proizvoda')
        if len(items) <= 5:
            for item in items[:5]:
                print(f'    - {item["code"]} {item["name"]} ({item["slug"]})')

print(f'\n⚠️  PRAZNI OPISI: {len(issues["empty_description"])}')

print(f'\n🔴 OPISI SA ENGLESKIM: {len(issues["english_in_description"])}')
if issues['english_in_description']:
    by_collection = defaultdict(list)
    for item in issues['english_in_description']:
        by_collection[item['collection']].append(item)
    for coll, items in sorted(by_collection.items())[:5]:
        print(f'  • {coll}: {len(items)} proizvoda')
        for item in items[:3]:
            print(f'    - {item["code"]} {item["name"]}: {", ".join(item["matches"][:3])}')

print(f'\n⚠️  OPISI BEZ SEKCIJA: {len(issues["no_sections_in_description"])}')
if issues['no_sections_in_description']:
    by_collection = defaultdict(list)
    for item in issues['no_sections_in_description']:
        by_collection[item['collection']].append(item)
    for coll, items in sorted(by_collection.items())[:5]:
        print(f'  • {coll}: {len(items)} proizvoda')

print(f'\n❌ NEDOSTAJU DIMENZIJE: {len(issues["missing_dimension"])}')
if issues['missing_dimension']:
    by_collection = defaultdict(list)
    for item in issues['missing_dimension']:
        by_collection[item['collection']].append(item)
    for coll, items in sorted(by_collection.items()):
        print(f'  • {coll}: {len(items)} proizvoda')

print(f'\n❌ NEDOSTAJU FORMATI: {len(issues["missing_format"])}')
if issues['missing_format']:
    by_collection = defaultdict(list)
    for item in issues['missing_format']:
        by_collection[item['collection']].append(item)
    for coll, items in sorted(by_collection.items()):
        print(f'  • {coll}: {len(items)} proizvoda')

print(f'\n❌ NEDOSTAJU DEBLJINE: {len(issues["missing_thickness"])}')
if issues['missing_thickness']:
    by_collection = defaultdict(list)
    for item in issues['missing_thickness']:
        by_collection[item['collection']].append(item)
    for coll, items in sorted(by_collection.items()):
        print(f'  • {coll}: {len(items)} proizvoda')

print(f'\n🖼️  NEDOSTAJU SLIKE: {len(issues["missing_image"])}')
if issues['missing_image']:
    by_collection = defaultdict(list)
    for item in issues['missing_image']:
        by_collection[item['collection']].append(item)
    for coll, items in sorted(by_collection.items())[:5]:
        print(f'  • {coll}: {len(items)} proizvoda')

print('\n' + '=' * 80)
print(f'UKUPNO PROBLEMA: {sum(len(v) for v in issues.values())}')
print('=' * 80)
