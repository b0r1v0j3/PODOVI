#!/usr/bin/env python3
"""
Fix all creation-55-clic products with Unknown sku or Unknown- folders
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
            # Also map variations
            color_to_code[name.replace(' ', '-').replace('_', '-').lower()] = code
            color_to_code[name.replace(' ', '').lower()] = code

print(f"Found {len(color_to_code)} color mappings")

# Folder name to code mapping
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

# Read TS file
print("\nReading gerflor-products-generated.ts...")
ts_content = ts_file.read_text(encoding='utf-8')

# Find all creation-55-clic products
product_pattern = r"(\{[^}]*?id: 'creation-55-clic-[^']+',[^}]*?name: '([^']+)',[^}]*?slug: '([^']+)',[^}]*?sku: '([^']+)',[^}]*?shortDescription: 'Gerflor Creation 55 Clic - ([^']+)',[^}]*?description: '([^']+)',[^}]*?images: \[{([^}]+)}\],[^}]*?specs: \[([^\]]+)\],[^}]*?\})"
products = list(re.finditer(product_pattern, ts_content, re.DOTALL))

print(f"Found {len(products)} creation-55-clic products")

fixes = []

for match in products:
    full_product = match.group(0)
    product_id = match.group(1) if match.group(1) else ''
    name = match.group(2)
    slug = match.group(3)
    sku = match.group(4)
    color_name = match.group(5)
    description = match.group(6)
    images_block = match.group(7)
    specs_block = match.group(8)
    
    # Check if sku is Unknown
    if sku == 'Unknown':
        # Try to extract code from name
        code_match = re.search(r'^(\d{4})\s+', name)
        if code_match:
            code = code_match.group(1)
        else:
            # Try to find code from color name
            code = color_to_code.get(color_name.upper()) or folder_to_code.get(color_name.lower().replace(' ', '-'))
        
        if code:
            # Update sku, name, description, specs
            new_name = f"{code} {color_name}" if not name.startswith(code) else name
            new_description = description.replace('Unknown', code)
            new_specs = specs_block.replace("'Unknown'", f"'{code}'")
            
            # Update image path if it uses Unknown- folder
            new_images = images_block
            if 'Unknown-' in images_block:
                folder_match = re.search(r"Unknown-([^/]+)", images_block)
                if folder_match:
                    folder_name = folder_match.group(1)
                    new_folder = f"{code}-{folder_name}"
                    new_images = images_block.replace(f"Unknown-{folder_name}", new_folder)
            
            # Build new product
            new_product = full_product.replace(f"sku: 'Unknown'", f"sku: '{code}'")
            new_product = new_product.replace(f"name: '{name}'", f"name: '{new_name}'")
            new_product = new_product.replace(description, new_description)
            new_product = new_product.replace(specs_block, new_specs)
            if new_images != images_block:
                new_product = new_product.replace(images_block, new_images)
            
            fixes.append((full_product, new_product, f"{name}: Unknown -> {code}"))
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
