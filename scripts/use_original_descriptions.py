#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Koristi ORIGINALNE engleske tekstove iz _descriptions.json fajlova
umesto losih prevoda iz _colors.json fajlova
"""

import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Build index
colors_by_slug = {c.get('slug'): c for c in colors if c.get('slug')}

total_updated = 0

# Use old _descriptions.json files (they have clean English text)
lvt_dir = Path('downloads/product_descriptions/lvt')
for file in sorted(lvt_dir.glob('*_descriptions.json')):
    data = json.load(open(file, 'r', encoding='utf-8'))
    old_colors = data.get('colors', [])
    
    updated = 0
    for oc in old_colors:
        slug = oc.get('slug', '')
        desc = oc.get('description', {})
        
        if not desc:
            continue
        
        # Extract color slug from full slug
        import re
        slug_match = re.search(r'-\d{4}-([\w-]+-\d+)$', slug)
        if not slug_match:
            continue
        
        color_slug = slug_match.group(1)
        color = colors_by_slug.get(color_slug)
        
        if color:
            # Use intro_text (clean English)
            intro = desc.get('intro_text', '')
            if intro and len(intro) > 20:
                color['description'] = intro
                updated += 1
    
    if updated > 0:
        print(f'  {file.name}: +{updated}')
        total_updated += updated

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print(f'\n✅ Zamenjeno sa čistim engleskim: {total_updated} boja')
