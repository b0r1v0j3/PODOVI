#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popravlja duplikate slug-ova - dodaje prefiks kolekcije
"""

import sys
import json
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

print('=' * 100)
print('POPRAVKA DUPLIKATA SLUG-OVA')
print('=' * 100)

# Load data
lvt_data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
lvt_colors = lvt_data.get('colors', [])

linoleum_data = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))
linoleum_colors = linoleum_data.get('colors', [])

all_colors = lvt_colors + linoleum_colors

# Find duplicate slugs
slug_counts = defaultdict(list)
for color in all_colors:
    slug = color.get('slug', '').strip()
    if slug:
        slug_counts[slug].append({
            'collection': color.get('collection', ''),
            'code': color.get('code', ''),
            'name': color.get('name', ''),
            'full_name': color.get('full_name', ''),
        })

# Find duplicates
duplicate_slugs = {k: v for k, v in slug_counts.items() if len(v) > 1}

print(f'\n📊 Pronađeno {len(duplicate_slugs)} duplikata slug-ova\n')

# Fix duplicates - add collection prefix
fixed_count = 0
for slug, items in duplicate_slugs.items():
    print(f'🔧 Popravljam: {slug} ({len(items)} duplikata)')
    
    # Group by collection
    by_collection = defaultdict(list)
    for item in items:
        by_collection[item['collection']].append(item)
    
    # For each collection with this slug, make unique
    for collection, coll_items in by_collection.items():
        if len(coll_items) > 1:
            # Multiple items in same collection with same slug - use code
            for idx, item in enumerate(coll_items):
                new_slug = f"{collection}-{slug}"
                if idx > 0:
                    new_slug = f"{collection}-{slug}-{item['code']}"
                
                # Find and update in all_colors
                for color in all_colors:
                    if (color.get('slug') == slug and 
                        color.get('collection') == collection and
                        color.get('code') == item['code']):
                        color['slug'] = new_slug
                        fixed_count += 1
                        print(f'   ✅ {item["collection"]} {item["code"]} {item["name"]}: {slug} → {new_slug}')
        else:
            # Single item - just add collection prefix
            item = coll_items[0]
            new_slug = f"{collection}-{slug}"
            
            # Find and update
            for color in all_colors:
                if (color.get('slug') == slug and 
                    color.get('collection') == collection and
                    color.get('code') == item['code']):
                    color['slug'] = new_slug
                    fixed_count += 1
                    print(f'   ✅ {item["collection"]} {item["code"]} {item["name"]}: {slug} → {new_slug}')

# Separate back to LVT and Linoleum
lvt_colors_fixed = [c for c in all_colors if c.get('collection') in [col.get('collection') for col in lvt_colors]]
linoleum_colors_fixed = [c for c in all_colors if c.get('collection') in [col.get('collection') for col in linoleum_colors]]

# Actually, let's just update the original lists
lvt_data['colors'] = [c for c in all_colors if any(col.get('collection') == c.get('collection') for col in lvt_colors)]
linoleum_data['colors'] = [c for c in all_colors if any(col.get('collection') == c.get('collection') for col in linoleum_colors)]

# Save
if fixed_count > 0:
    json.dump(lvt_data, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    json.dump(linoleum_data, open('public/data/linoleum_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print(f'\n✅ Popravljeno: {fixed_count} slug-ova')
else:
    print('\n⚠️  Nema slug-ova za popravku')
