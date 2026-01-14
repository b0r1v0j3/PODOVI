#!/usr/bin/env python3
"""
Comprehensive image analysis and fixing script.
Detects and fixes:
1. Images using ilustracija instead of pod
2. Missing images
3. Multiple images per code
4. Multiple codes per image
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

base_path = Path('public/images/products/lvt/colors')
ts_file = Path('lib/data/gerflor-products-generated.ts')

print("Reading gerflor-products-generated.ts...")
ts_content = ts_file.read_text(encoding='utf-8')

# Find all products with their codes and image paths
product_pattern = r"sku: '([^']+)'.*?url: '(/images/products/lvt/colors/([^/]+)/([^/]+)/pod/)([^']+\.jpg)"
products = []

for match in re.finditer(product_pattern, ts_content, re.DOTALL):
    sku = match.group(1)
    base_url = match.group(2)
    collection = match.group(3)
    color_folder = match.group(4)
    filename = match.group(5)
    
    # Find the product name
    name_match = re.search(rf"name: '([^']+)'.*?sku: '{re.escape(sku)}'", ts_content, re.DOTALL)
    product_name = name_match.group(1) if name_match else "Unknown"
    
    products.append({
        'sku': sku,
        'name': product_name,
        'collection': collection,
        'folder': color_folder,
        'filename': filename,
        'full_path': base_path / collection / color_folder / 'pod' / filename,
        'base_url': base_url
    })

print(f"Found {len(products)} products with images\n")

# Analyze problems
problems = {
    'ilustracija_in_pod_path': [],
    'missing_files': [],
    'multiple_images_per_code': defaultdict(list),
    'wrong_folder': []
}

# Check each product
for product in products:
    pod_path = base_path / product['collection'] / product['folder'] / 'pod'
    ilustracija_path = base_path / product['collection'] / product['folder'] / 'ilustracija'
    
    # Check if filename contains "ilustracija"
    if 'ilustracija' in product['filename'].lower():
        problems['ilustracija_in_pod_path'].append(product)
    
    # Check if file exists
    if not product['full_path'].exists():
        # Check if ilustracija exists
        if ilustracija_path.exists():
            ilustracija_files = list(ilustracija_path.glob('*.jpg'))
            if ilustracija_files:
                problems['wrong_folder'].append({
                    'product': product,
                    'ilustracija_file': ilustracija_files[0].name
                })
        else:
            problems['missing_files'].append(product)
    
    # Track multiple images per code
    if product['sku'] != 'Unknown':
        problems['multiple_images_per_code'][product['sku']].append(product)

# Report problems
print("=" * 60)
print("PROBLEM ANALYSIS")
print("=" * 60)

# 1. Ilustracija in pod path
if problems['ilustracija_in_pod_path']:
    print(f"\n1. Images using ilustracija filename in pod path ({len(problems['ilustracija_in_pod_path'])}):")
    for p in problems['ilustracija_in_pod_path']:
        print(f"   {p['collection']}/{p['folder']}: {p['filename']}")

# 2. Wrong folder (ilustracija instead of pod)
if problems['wrong_folder']:
    print(f"\n2. Images in ilustracija folder, should be in pod ({len(problems['wrong_folder'])}):")
    for item in problems['wrong_folder']:
        p = item['product']
        print(f"   {p['collection']}/{p['folder']}: File exists in ilustracija: {item['ilustracija_file']}")

# 3. Missing files
if problems['missing_files']:
    print(f"\n3. Missing image files ({len(problems['missing_files'])}):")
    for p in problems['missing_files'][:10]:
        print(f"   {p['collection']}/{p['folder']}: {p['filename']}")
    if len(problems['missing_files']) > 10:
        print(f"   ... and {len(problems['missing_files']) - 10} more")

# 4. Multiple images per code
multi_code = {k: v for k, v in problems['multiple_images_per_code'].items() if len(v) > 1}
if multi_code:
    print(f"\n4. Multiple images for same code ({len(multi_code)} codes):")
    for code, prods in list(multi_code.items())[:10]:
        print(f"   Code {code}: {len(prods)} images")
        for p in prods:
            print(f"      - {p['collection']}/{p['folder']}: {p['filename']}")
    if len(multi_code) > 10:
        print(f"   ... and {len(multi_code) - 10} more codes")

print("\n" + "=" * 60)

# Fix issues
fixes = []

# Fix 1: Replace ilustracija filenames with actual pod files
for product in problems['ilustracija_in_pod_path']:
    pod_path = base_path / product['collection'] / product['folder'] / 'pod'
    if pod_path.exists():
        pod_files = list(pod_path.glob('*.jpg'))
        if pod_files:
            actual_file = pod_files[0].name
            old_url = f"{product['base_url']}{product['filename']}"
            new_url = f"{product['base_url']}{actual_file}"
            fixes.append((old_url, new_url, f"{product['collection']}/{product['folder']}: ilustracija -> pod"))

# Fix 2: Use pod files from ilustracija folder (move reference)
for item in problems['wrong_folder']:
    product = item['product']
    # Find actual pod file
    pod_path = base_path / product['collection'] / product['folder'] / 'pod'
    if pod_path.exists():
        pod_files = list(pod_path.glob('*.jpg'))
        if pod_files:
            actual_file = pod_files[0].name
            old_url = f"{product['base_url']}{product['filename']}"
            new_url = f"{product['base_url']}{actual_file}"
            fixes.append((old_url, new_url, f"{product['collection']}/{product['folder']}: fixed pod path"))
    else:
        # Pod folder doesn't exist, check if we should use ilustracija file
        ilustracija_file = item['ilustracija_file']
        # But we want pod, so this is an error - skip for now
        print(f"   WARNING: {product['collection']}/{product['folder']} has ilustracija but no pod folder!")

# Apply fixes
if fixes:
    print(f"\nApplying {len(fixes)} fixes...")
    for old_url, new_url, desc in fixes:
        print(f"  {desc}")
        ts_content = ts_content.replace(old_url, new_url)
    
    ts_file.write_text(ts_content, encoding='utf-8')
    print(f"\n[OK] Fixed {len(fixes)} image paths")
else:
    print("\nNo automatic fixes available")

print("\nDone!")
