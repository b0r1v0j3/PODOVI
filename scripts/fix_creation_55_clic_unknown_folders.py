#!/usr/bin/env python3
"""
Fix creation-55-clic products with Unknown- folders by:
1. Finding products that use Unknown- folders
2. Looking up correct codes from JSON or other collections
3. Updating paths and product data
"""

import re
import json
from pathlib import Path
from collections import defaultdict

ts_file = Path('lib/data/gerflor-products-generated.ts')
colors_json = Path('public/data/lvt_colors_complete.json')
base_path = Path('public/images/products/lvt/colors/creation-55-clic')

# Read JSON to get code mappings
print("Reading lvt_colors_complete.json...")
with open(colors_json, 'r', encoding='utf-8') as f:
    colors_data = json.load(f)

# Create mapping: color name -> code for Creation 55 Clic
color_to_code = {}
for color in colors_data.get('colors', []):
    if color.get('collection') == 'Creation 55 Clic' or color.get('collection_name') == 'Creation 55 Clic':
        name = color.get('name', '').upper()
        code = color.get('code', '')
        if name and code:
            color_to_code[name] = code
            # Also map without spaces/dashes
            color_to_code[name.replace(' ', '-').replace('_', '-').lower()] = code

print(f"Found {len(color_to_code)} color mappings for Creation 55 Clic")

# Read TS file
print("\nReading gerflor-products-generated.ts...")
ts_content = ts_file.read_text(encoding='utf-8')

# Find all creation-55-clic products with Unknown folders
pattern = r"(url: '/images/products/lvt/colors/creation-55-clic/Unknown-([^/]+)/pod/)([^']+\.jpg)"
matches = list(re.finditer(pattern, ts_content))

print(f"\nFound {len(matches)} products using Unknown- folders")

# Also find products with sku: 'Unknown'
unknown_sku_pattern = r"sku: 'Unknown'.*?url: '/images/products/lvt/colors/creation-55-clic/([^']+)"
unknown_sku_matches = list(re.finditer(unknown_sku_pattern, ts_content, re.DOTALL))

print(f"Found {len(unknown_sku_matches)} products with sku: 'Unknown'")

# Map folder names to codes
folder_to_code = {
    'ballerina': '0347',
    'cedar-brown': '0850',
    'cedar-dark-brown': '1605',
    'cedar-golden': '1606',
    'honey-oak': '0441',
    'longboard': '0455',
    'lounge-oak-beige': '1272',
    'lounge-oak-chestnut': '1274',
    'lounge-oak-golden': '1271',
    'lounge-oak-natural-eir': '1273',
    'quartet': '0503',
    'quartet-honey': '0870',
    'ranch': '0456',
    'twist': '0504',
    'white-lime': '0584',
}

fixes = []

# Fix image paths
for match in matches:
    full_match = match.group(0)
    base_url = match.group(1)
    color_name = match.group(2)
    filename = match.group(3)
    
    # Get code from mapping
    code = folder_to_code.get(color_name.lower())
    if not code:
        # Try to find in JSON
        code = color_to_code.get(color_name.upper()) or color_to_code.get(color_name.lower())
    
    if code:
        new_folder = f"{code}-{color_name}"
        new_url = f"url: '/images/products/lvt/colors/creation-55-clic/{new_folder}/pod/{filename}"
        fixes.append((full_match, new_url, f"Unknown-{color_name} -> {new_folder}"))
    else:
        print(f"  WARNING: Could not find code for {color_name}")

# Apply fixes
if fixes:
    print(f"\nApplying {len(fixes)} fixes...")
    for old, new, desc in fixes:
        print(f"  {desc}")
        ts_content = ts_content.replace(old, new)
    
    ts_file.write_text(ts_content, encoding='utf-8')
    print(f"\n[OK] Fixed {len(fixes)} image paths")
else:
    print("\nNo fixes to apply")

print("\nDone!")
