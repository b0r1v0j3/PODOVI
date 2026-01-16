#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sveobuhvatan pregled sajta - pronalazi SVE probleme
"""

import sys
import json
import re
from pathlib import Path
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

print('=' * 100)
print('SVEOBUHVATNI PREGLED SAJTA')
print('=' * 100)

# Load data
lvt_data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
lvt_colors = lvt_data.get('colors', [])

linoleum_data = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))
linoleum_colors = linoleum_data.get('colors', [])

all_colors = lvt_colors + linoleum_colors

print(f'\n📊 UKUPNO PROIZVODA: {len(all_colors)}')
print(f'   - LVT: {len(lvt_colors)}')
print(f'   - Linoleum: {len(linoleum_colors)}')

# 1. PROVERA KOMPLETNOSTI PODATAKA
print('\n' + '=' * 100)
print('1. KOMPLETNOST PODATAKA')
print('=' * 100)

issues_data = {
    'missing_description': [],
    'empty_description': [],
    'missing_dimension': [],
    'missing_format': [],
    'missing_thickness': [],
    'missing_image': [],
    'missing_slug': [],
    'missing_code': [],
    'missing_name': [],
    'english_in_description': [],
    'no_sections': [],
    'invalid_image_url': [],
    'duplicate_slugs': [],
    'duplicate_codes': [],
}

for color in all_colors:
    slug = color.get('slug', '')
    collection = color.get('collection', '')
    name = color.get('name', '')
    code = color.get('code', '')
    
    # Missing slug
    if not slug:
        issues_data['missing_slug'].append({'collection': collection, 'code': code, 'name': name})
    
    # Missing code
    if not code:
        issues_data['missing_code'].append({'collection': collection, 'slug': slug, 'name': name})
    
    # Missing name
    if not name:
        issues_data['missing_name'].append({'collection': collection, 'slug': slug, 'code': code})
    
    # Missing description
    if not color.get('description'):
        issues_data['missing_description'].append({'slug': slug, 'collection': collection, 'code': code, 'name': name})
    else:
        desc = color.get('description', '')
        if desc.strip() == '':
            issues_data['empty_description'].append({'slug': slug, 'collection': collection, 'code': code, 'name': name})
        else:
            # Check for English
            english_patterns = [
                r'\b(Product|Installation|Application|Environment)\s*:',
                r'\b(Available|features|wear-layer|PVC flooring)',
                r'\b(crosslinked|polyurethane|surface treatment)',
                r'\b(glue-down|classified|according|standard)',
            ]
            for pattern in english_patterns:
                if re.search(pattern, desc, re.IGNORECASE):
                    if not any(item['slug'] == slug for item in issues_data['english_in_description']):
                        issues_data['english_in_description'].append({
                            'slug': slug, 'collection': collection, 'code': code, 'name': name
                        })
                    break
            
            # Check for sections
            if 'Proizvod:' not in desc and 'Product:' not in desc:
                issues_data['no_sections'].append({'slug': slug, 'collection': collection, 'code': code, 'name': name})
    
    # Missing dimension
    if not color.get('dimension'):
        issues_data['missing_dimension'].append({'slug': slug, 'collection': collection, 'code': code, 'name': name})
    
    # Missing format
    if not color.get('format'):
        issues_data['missing_format'].append({'slug': slug, 'collection': collection, 'code': code, 'name': name})
    
    # Missing thickness
    if not color.get('overall_thickness'):
        issues_data['missing_thickness'].append({'slug': slug, 'collection': collection, 'code': code, 'name': name})
    
    # Missing image
    if not color.get('image_url') and not color.get('texture_url'):
        issues_data['missing_image'].append({'slug': slug, 'collection': collection, 'code': code, 'name': name})
    else:
        # Check image URL validity
        img_url = color.get('image_url', '') or color.get('texture_url', '')
        if img_url:
            if not img_url.startswith('/') and not img_url.startswith('http'):
                issues_data['invalid_image_url'].append({'slug': slug, 'url': img_url, 'collection': collection})

# Check duplicates
slug_counts = defaultdict(list)
code_counts = defaultdict(list)

for color in all_colors:
    slug = color.get('slug', '')
    code = color.get('code', '')
    collection = color.get('collection', '')
    
    if slug:
        slug_counts[slug].append({'collection': collection, 'code': code, 'name': color.get('name', '')})
    if code:
        code_counts[code].append({'collection': collection, 'slug': slug, 'name': color.get('name', '')})

for slug, items in slug_counts.items():
    if len(items) > 1:
        issues_data['duplicate_slugs'].append({'slug': slug, 'items': items})

for code, items in code_counts.items():
    if len(items) > 1:
        issues_data['duplicate_codes'].append({'code': code, 'items': items})

# Print results
total_issues = sum(len(v) for v in issues_data.values())

print(f'\n❌ UKUPNO PROBLEMA: {total_issues}\n')

for issue_type, items in issues_data.items():
    if items:
        print(f'⚠️  {issue_type.upper().replace("_", " ")}: {len(items)}')
        if len(items) <= 10:
            for item in items[:5]:
                if 'slug' in item:
                    print(f'   - {item.get("collection", "")} {item.get("code", "")} {item.get("name", "")} ({item.get("slug", "")})')
                elif 'code' in item:
                    print(f'   - {item.get("code", "")}: {len(item.get("items", []))} duplikata')

# 2. PROVERA KOLEKCIJA
print('\n' + '=' * 100)
print('2. PROVERA KOLEKCIJA')
print('=' * 100)

collections = defaultdict(int)
for color in all_colors:
    coll = color.get('collection', 'unknown')
    collections[coll] += 1

print(f'\n📦 Ukupno kolekcija: {len(collections)}')
for coll, count in sorted(collections.items()):
    print(f'   - {coll}: {count} boja')

# 3. PROVERA KVALITETA OPISA
print('\n' + '=' * 100)
print('3. KVALITET OPISA')
print('=' * 100)

descriptions_with_issues = {
    'too_short': [],  # < 50 karaktera
    'no_structure': [],  # Nema sekcije
    'mixed_language': [],  # Mešavina srpskog i engleskog
}

for color in all_colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    slug = color.get('slug', '')
    collection = color.get('collection', '')
    
    # Too short
    if len(desc) < 50:
        descriptions_with_issues['too_short'].append({
            'slug': slug, 'collection': collection, 'length': len(desc)
        })
    
    # No structure
    if 'Proizvod:' not in desc and 'Product:' not in desc:
        descriptions_with_issues['no_structure'].append({
            'slug': slug, 'collection': collection
        })
    
    # Mixed language (rough check)
    serbian_chars = len(re.findall(r'[а-яА-Я]', desc))
    english_chars = len(re.findall(r'[a-zA-Z]', desc))
    if english_chars > serbian_chars * 0.3:  # More than 30% English
        descriptions_with_issues['mixed_language'].append({
            'slug': slug, 'collection': collection
        })

for issue_type, items in descriptions_with_issues.items():
    if items:
        print(f'\n⚠️  {issue_type.upper().replace("_", " ")}: {len(items)}')
        if len(items) <= 10:
            for item in items[:5]:
                print(f'   - {item.get("collection", "")} ({item.get("slug", "")})')

# 4. PROVERA SLIKA
print('\n' + '=' * 100)
print('4. PROVERA SLIKA')
print('=' * 100)

image_issues = {
    'missing': 0,
    'invalid_path': 0,
    'no_extension': 0,
}

for color in all_colors:
    img_url = color.get('image_url', '') or color.get('texture_url', '')
    if not img_url:
        image_issues['missing'] += 1
    else:
        if not img_url.startswith('/') and not img_url.startswith('http'):
            image_issues['invalid_path'] += 1
        if '.' not in img_url.split('/')[-1]:
            image_issues['no_extension'] += 1

for issue, count in image_issues.items():
    if count > 0:
        print(f'⚠️  {issue.replace("_", " ").upper()}: {count}')

print('\n' + '=' * 100)
print(f'📊 FINALNI REZIME: {total_issues} PROBLEMA PRONAĐENO')
print('=' * 100)
