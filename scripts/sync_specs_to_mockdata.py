#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sinhronizuje NCS i LRV iz lvt_colors_complete.json u mock-data.ts
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Load enriched data
json_path = Path("public/data/lvt_colors_complete.json")
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Build lookup: collection -> list of (code, name, NCS, LRV)
specs_by_collection = {}
for color in data['colors']:
    coll = color.get('collection', '')
    code = color.get('code', '')
    name = color.get('name', '')
    specs = color.get('specs', {})
    ncs = specs.get('NCS')
    lrv = specs.get('LRV')
    
    if ncs or lrv:
        if coll not in specs_by_collection:
            specs_by_collection[coll] = []
        specs_by_collection[coll].append({
            'code': code,
            'name': name,
            'NCS': ncs,
            'LRV': lrv
        })

print(f"Loaded specs for {len(specs_by_collection)} collections")
for coll, items in specs_by_collection.items():
    print(f"  {coll}: {len(items)} colors with NCS/LRV")

# Read mock-data.ts
ts_path = Path("lib/data/mock-data.ts")
with open(ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

# For each collection in mock-data, find its slug and add specs
# Pattern: find product blocks with slug: 'gerflor-creation-XX'
# Then find the specs: [ ... ], block and inject NCS/LRV before the closing ]

lines = content.split('\n')
new_lines = []
current_slug = None
in_specs = False
specs_indent = ''

for i, line in enumerate(lines):
    # Detect product slug
    slug_match = re.search(r"slug:\s*'gerflor-(creation-[^']+)'", line)
    if slug_match:
        current_slug = slug_match.group(1)
    
    # Detect specs array start
    if 'specs: [' in line:
        in_specs = True
        specs_indent = line[:line.index('specs:')]
    
    # Detect specs array end
    if in_specs and '],\n' in line or (in_specs and line.strip() == '],'):
        # Add NCS/LRV if available for this collection
        if current_slug and current_slug in specs_by_collection:
            # We have 1 product representing many colors, so we take first color's data
            # (or aggregate if needed, but usually all colors in a product share similar NCS)
            first_color = specs_by_collection[current_slug][0]
            ncs = first_color.get('NCS')
            lrv = first_color.get('LRV')
            
            # Check if NCS/LRV already exists in previous lines
            # Simple check: look back a few lines
            already_has_ncs = any('ncs' in lines[max(0, i-10):i][j].lower() for j in range(len(lines[max(0, i-10):i])))
            
            if not already_has_ncs:
                if ncs:
                    new_lines.append(f"{specs_indent}  {{ key: 'ncs', label: 'NCS Oznaka', value: '{ncs}' }},")
                    print(f"  Added NCS to {current_slug}")
                if lrv:
                    new_lines.append(f"{specs_indent}  {{ key: 'lrv', label: 'LRV', value: '{lrv}' }},")
                    print(f"  Added LRV to {current_slug}")
        
        in_specs = False
        current_slug = None
    
    new_lines.append(line)

# Write back
with open(ts_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("\n✅ Done!")
