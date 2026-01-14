# -*- coding: utf-8 -*-
import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Proveri slug za product
product_slug = 'creation-saga2-terra-35021566'

# Učitaj JSON
with open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Proveri da li postoji color sa ovim slug-om
for color in data['colors']:
    if 'terra-35021566' in color.get('slug', '') or '1566' in color.get('code', ''):
        print(f"Found color: {color['code']} {color['name']}")
        print(f"  Collection: {color['collection']}")
        print(f"  Slug: {color['slug']}")
        print(f"  Image URL: {color.get('texture_url', 'N/A')}")
        print()

# Izvuci collection name iz slug-a
# creation-saga2-terra-35021566 -> creation-saga2
if 'creation-' in product_slug:
    parts = product_slug.split('-')
    # Pronađi gde počinje collection (creation-X)
    collection_parts = []
    for i, part in enumerate(parts):
        if part == 'creation':
            # Uzmi creation i sledeći deo
            collection_parts = parts[:i+2]
            break
    if collection_parts:
        collection_name = '-'.join(collection_parts)
        print(f"Extracted collection name: {collection_name}")
        
        # Proveri da li postoji u JSON-u
        matching_colors = [c for c in data['colors'] if c['collection'] == collection_name]
        print(f"Found {len(matching_colors)} colors in collection {collection_name}")
