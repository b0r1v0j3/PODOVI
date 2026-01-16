#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

# Load LVT colors
data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = data.get('colors', [])

# Find Creation Saga2 colors
saga_colors = [c for c in colors if c.get('collection') == 'creation-saga2']

print(f'Creation Saga2 boja: {len(saga_colors)}')
print()

# Check first few colors
for i, color in enumerate(saga_colors[:5]):
    slug = color.get('slug', '')
    has_desc = bool(color.get('description'))
    desc_preview = color.get('description', '')[:100] if color.get('description') else 'NO DESCRIPTION'
    
    print(f'{i+1}. {slug}')
    print(f'   Ima description: {has_desc}')
    print(f'   Preview: {desc_preview}...')
    print()
