#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Koristi ČISTE engleske tekstove (intro_text) umesto losih prevoda
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])
colors_by_slug = {c.get('slug'): c for c in colors if c.get('slug')}

total_updated = 0

lvt_dir = Path('downloads/product_descriptions/lvt')
for file in sorted(lvt_dir.glob('*_colors.json')):
    data = json.load(open(file, 'r', encoding='utf-8'))
    extracted_colors = data.get('colors', [])
    
    updated = 0
    for ec in extracted_colors:
        desc = ec.get('description', {})
        if not desc:
            continue
        
        # Use intro_text (clean English) instead of full_text (mixed/messy)
        intro = desc.get('intro_text', '')
        if not intro or len(intro) < 20:
            continue
        
        full_slug = ec.get('slug', '')
        slug_match = re.search(r'-\d{4}-([\w-]+-\d+)$', full_slug)
        if not slug_match:
            # Try for "new-2025" format
            all_codes = re.findall(r'(\d{4})', full_slug)
            codes = [c for c in all_codes if c != '2025']
            if codes:
                # Extract part after first real code
                code = codes[0]
                parts = full_slug.split(f'-{code}-')
                if len(parts) > 1:
                    color_slug = parts[1]
                else:
                    continue
            else:
                continue
        else:
            color_slug = slug_match.group(1)
        
        color = colors_by_slug.get(color_slug)
        if color:
            # Replace with clean English intro
            color['description'] = intro
            updated += 1
    
    if updated > 0:
        print(f'  {file.name}: +{updated}')
        total_updated += updated

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print(f'\n✅ Zamenjeno sa čistim engleskim: {total_updated} boja')
