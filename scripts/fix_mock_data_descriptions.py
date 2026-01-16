#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popravlja opise u mock-data.ts za Gerflor proizvode - učitava iz JSON-a i struktuira
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

# Load color data
lvt_data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
lvt_colors = lvt_data.get('colors', [])

# Read mock-data.ts
with open('lib/data/mock-data.ts', 'r', encoding='utf-8') as f:
    mock_content = f.read()

# Map of slugs to collection names
collection_mapping = {
    'gerflor-creation-30': 'creation-30',
    'gerflor-creation-40': 'creation-40',
    'gerflor-creation-40-clic': 'creation-40-clic',
    'gerflor-creation-40-clic-acoustic': 'creation-40-clic-acoustic',
    'gerflor-creation-40-zen': 'creation-40-zen',
    'gerflor-creation-55': 'creation-55',
    'gerflor-creation-55-clic': 'creation-55-clic',
    'gerflor-creation-55-clic-acoustic': 'creation-55-clic-acoustic',
    'gerflor-creation-55-looselay': 'creation-55-looselay',
    'gerflor-creation-55-looselay-acoustic': 'creation-55-looselay-acoustic',
    'gerflor-creation-55-zen': 'creation-55-zen',
    'gerflor-creation-70': 'creation-70',
    'gerflor-creation-70-clic': 'creation-70-clic',
    'gerflor-creation-70-connect': 'creation-70-connect',
    'gerflor-creation-70-megaclic': 'creation-70-megaclic',
    'gerflor-creation-70-zen': 'creation-70-zen',
    'gerflor-creation-70-looselay': 'creation-70-looselay',
    'gerflor-creation-saga': 'creation-saga2',
}

def get_collection_description(collection_slug):
    """Get a representative description from the collection"""
    collection_colors = [c for c in lvt_colors if c.get('collection') == collection_slug]
    
    if not collection_colors:
        return None
    
    # Find first color with a good description
    for color in collection_colors:
        desc = color.get('description', '')
        if desc and 'Proizvod:' in desc and len(desc) > 200:
            return desc
    
    # If no good description found, try any description
    for color in collection_colors:
        desc = color.get('description', '')
        if desc and len(desc) > 100:
            return desc
    
    return None

updated_count = 0

# Fix each product
for mock_slug, collection_slug in collection_mapping.items():
    desc = get_collection_description(collection_slug)
    if not desc:
        print(f'⚠️  Nema opisa za {mock_slug}')
        continue
    
    # Escape for TypeScript string
    desc_escaped = desc.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
    desc_escaped = desc_escaped.replace('\n', '\\n')
    
    # Find the product block
    pattern = rf"(slug:\s*['\"]{re.escape(mock_slug)}['\"][\s\S]*?description:\s*)(['\"][^'\"]*['\"]|`[^`]*`)"
    
    match = re.search(pattern, mock_content)
    if match:
        old_desc = match.group(2)
        new_desc = f"`{desc_escaped}`"
        
        if old_desc.strip() != new_desc.strip():
            mock_content = re.sub(pattern, rf"\g<1>{re.escape(new_desc)}", mock_content, count=1)
            updated_count += 1
            print(f'✅ Ažuriran {mock_slug}')
    else:
        print(f'⚠️  Ne može pronaći {mock_slug}')

# Write back
if updated_count > 0:
    with open('lib/data/mock-data.ts', 'w', encoding='utf-8') as f:
        f.write(mock_content)
    print(f'\n✅ Ažurirano: {updated_count} proizvoda')
else:
    print('\n⚠️  Nema promena')
