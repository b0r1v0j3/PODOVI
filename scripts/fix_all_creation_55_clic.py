#!/usr/bin/env python3
"""
Comprehensive fix for all creation-55-clic products:
1. Fix Unknown sku codes
2. Fix incorrect image paths (use proper folder structure)
3. Update product names and descriptions
"""

import re
import json
from pathlib import Path

ts_file = Path('lib/data/gerflor-products-generated.ts')
colors_json = Path('public/data/lvt_colors_complete.json')
base_path = Path('public/images/products/lvt/colors/creation-55-clic')

# Read JSON
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

print(f"Found {len(color_to_code)} color mappings")

# Folder name to code mapping (from other collections)
folder_to_code = {
    'ballerina': '0347',
    'cedar-brown': '0850',
    'cedar-dark-brown': '1605',
    'cedar-golden': '1606',
    'honey-oak': '0441',
    'longboard': '0455',
    'long-board': '0455',
    'lounge-oak-beige': '1272',
    'lounge-oak-chestnut': '1274',
    'lounge-oak-golden': '1271',
    'lounge-oak-natural-eir': '1273',
    'natural-eir': '1273',
    'beige-eir': '1272',
    'chestnut-eir': '1274',
    'golden-eir': '1271',
    'quartet': '0503',
    'quartet-honey': '0870',
    'ranch': '0456',
    'twist': '0504',
    'white-lime': '0584',
    'dark-brown': '1605',
}

# Read TS file
print("\nReading gerflor-products-generated.ts...")
ts_content = ts_file.read_text(encoding='utf-8')

# Find all creation-55-clic products with issues
# Pattern to find products with sku: 'Unknown' or wrong image paths
fixes = []

# Fix products with sku: 'Unknown'
unknown_pattern = r"(id: 'creation-55-clic-[^']+',\s+name: '([^']+)',\s+slug: '[^']+',\s+sku: 'Unknown',[^}]+?url: '([^']+)',[^}]+?alt: '([^']+)',[^}]+?specs: \[([^\]]+)\])"
matches = list(re.finditer(unknown_pattern, ts_content, re.DOTALL))

print(f"Found {len(matches)} products with sku: 'Unknown'")

for match in matches:
    product_id = match.group(1)
    name = match.group(2)
    image_url = match.group(3)
    alt = match.group(4)
    specs = match.group(5)
    
    # Extract color name from various sources
    color_name = alt.upper() if alt else ''
    
    # Try to get code from name
    code_match = re.search(r'^(\d{4})\s+', name)
    if code_match:
        code = code_match.group(1)
    else:
        # Try color_to_code
        code = color_to_code.get(color_name)
        if not code:
            # Try folder name from image URL
            folder_match = re.search(r'creation-55-clic/([^/]+)', image_url)
            if folder_match:
                folder_name = folder_match.group(1).replace('.jpg', '').replace('collection-', '')
                code = folder_to_code.get(folder_name)
    
    if code:
        # Check if Unknown- folder exists
        unknown_folder = None
        for folder_name in folder_to_code.keys():
            if folder_name in image_url.lower():
                unknown_folder = f"Unknown-{folder_name}"
                break
        
        # Find actual folder
        actual_folder = None
        if unknown_folder and (base_path / unknown_folder / 'pod').exists():
            pod_files = list((base_path / unknown_folder / 'pod').glob('*.jpg'))
            if pod_files:
                actual_folder = f"{code}-{folder_name}"
                actual_file = pod_files[0].name
                new_url = f"/images/products/lvt/colors/creation-55-clic/{actual_folder}/pod/{actual_file}"
            else:
                new_url = image_url  # Keep old URL if no pod file
        else:
            # Check if folder with code exists
            for folder in base_path.iterdir():
                if folder.is_dir() and folder.name.startswith(f"{code}-"):
                    pod_files = list((folder / 'pod').glob('*.jpg'))
                    if pod_files:
                        actual_file = pod_files[0].name
                        new_url = f"/images/products/lvt/colors/creation-55-clic/{folder.name}/pod/{actual_file}"
                        break
            else:
                new_url = image_url  # Keep old URL
        
        # Update product
        new_name = f"{code} {color_name}" if not name.startswith(code) else name
        new_specs = specs.replace("'Unknown'", f"'{code}'")
        
        # Build replacement
        old_block = match.group(0)
        new_block = old_block.replace(f"sku: 'Unknown'", f"sku: '{code}'")
        new_block = new_block.replace(f"name: '{name}'", f"name: '{new_name}'")
        new_block = new_block.replace(image_url, new_url)
        new_block = new_block.replace(specs, new_specs)
        
        fixes.append((old_block, new_block, f"{name}: Unknown -> {code}"))
    else:
        print(f"  WARNING: Could not find code for {color_name}")

# Apply fixes
if fixes:
    print(f"\nApplying {len(fixes)} fixes...")
    for old, new, desc in fixes:
        print(f"  {desc}")
        ts_content = ts_content.replace(old, new)
    
    ts_file.write_text(ts_content, encoding='utf-8')
    print(f"\n[OK] Fixed {len(fixes)} products")
else:
    print("\nNo fixes to apply")

print("\nDone!")
