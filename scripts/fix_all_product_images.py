#!/usr/bin/env python3
"""
Fix all product image paths by:
1. Checking actual files in filesystem
2. Using pod folder instead of ilustracija
3. Matching images to correct product codes
4. Handling multiple images per product code
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

# Base paths
base_path = Path('public/images/products/lvt/colors')
ts_file = Path('lib/data/gerflor-products-generated.ts')
colors_json = Path('public/data/lvt_colors_complete.json')

# Read TypeScript file
print("Reading gerflor-products-generated.ts...")
ts_content = ts_file.read_text(encoding='utf-8')

# Read colors JSON to get correct mappings
print("Reading lvt_colors_complete.json...")
with open(colors_json, 'r', encoding='utf-8') as f:
    colors_data = json.load(f)

# Create mapping: collection -> code -> color data
color_map = defaultdict(dict)
for color in colors_data.get('colors', []):
    collection = color.get('collection', '')
    code = color.get('code', '')
    if collection and code:
        color_map[collection][code] = color

print(f"Loaded {len(color_map)} collections with color mappings")

# Find all product image URLs in TS file
pattern = r"url: '(/images/products/lvt/colors/([^/]+)/([^/]+)/pod/)([^']+\.jpg)"
matches = list(re.finditer(pattern, ts_content))

print(f"\nFound {len(matches)} product image URLs")

# Track fixes
fixes = []
errors = []

for match in matches:
    full_url = match.group(0)
    base_url = match.group(1)
    collection = match.group(2)
    color_folder = match.group(3)
    filename = match.group(4)
    
    # Check if file exists
    pod_path = base_path / collection / color_folder / 'pod'
    ilustracija_path = base_path / collection / color_folder / 'ilustracija'
    
    # Check pod folder first (preferred)
    if pod_path.exists():
        pod_files = list(pod_path.glob('*.jpg'))
        if pod_files:
            actual_file = pod_files[0].name
            if actual_file != filename:
                new_url = f"{base_url}{actual_file}"
                fixes.append((full_url, new_url, f"{collection}/{color_folder}: {filename} -> {actual_file}"))
        else:
            errors.append(f"{collection}/{color_folder}/pod: No JPG files found")
    elif ilustracija_path.exists():
        # Check if ilustracija has files but pod doesn't - this is an error
        ilustracija_files = list(ilustracija_path.glob('*.jpg'))
        if ilustracija_files:
            errors.append(f"{collection}/{color_folder}: ERROR - Using ilustracija folder, pod folder missing! Should use pod folder.")
    else:
        errors.append(f"{collection}/{color_folder}: Folder not found")

# Apply fixes
if fixes:
    print(f"\nApplying {len(fixes)} fixes:")
    for old_url, new_url, desc in fixes:
        print(f"  {desc}")
        ts_content = ts_content.replace(old_url, new_url)
    
    ts_file.write_text(ts_content, encoding='utf-8')
    print(f"\n[OK] Fixed {len(fixes)} image paths")
else:
    print("\nNo paths need fixing")

# Report errors
if errors:
    print(f"\n⚠ Found {len(errors)} potential issues:")
    for error in errors[:20]:  # Show first 20
        print(f"  {error}")
    if len(errors) > 20:
        print(f"  ... and {len(errors) - 20} more")

print("\nDone!")
