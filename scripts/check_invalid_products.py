# -*- coding: utf-8 -*-
"""
Check for products with invalid data that could cause server-side errors
"""
import sys
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ts_file = 'lib/data/gerflor-products-generated.ts'

print("🔍 Proveravam proizvode sa neispravnim podacima...\n")

with open(ts_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find products without images array or with empty images
issues = []

# Pattern to find product blocks
product_pattern = r'\{[^}]*id:\s*[\'"]([^\'"]+)[\'"][^}]*name:\s*[\'"]([^\'"]+)[\'"][^}]*\}'

# More precise: find products and check their images field
lines = content.split('\n')
current_product = None
in_product = False
product_data = {}

for i, line in enumerate(lines):
    # Detect product start
    if line.strip().startswith('{') and 'id:' in line:
        in_product = True
        product_data = {'line': i + 1, 'id': None, 'name': None, 'has_images': False, 'images_count': 0}
    
    if in_product:
        # Extract id
        if 'id:' in line and not product_data.get('id'):
            match = re.search(r"id:\s*['\"]([^'\"]+)['\"]", line)
            if match:
                product_data['id'] = match.group(1)
        
        # Extract name
        if 'name:' in line and not product_data.get('name'):
            match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", line)
            if match:
                product_data['name'] = match.group(1)
        
        # Check for images array
        if 'images:' in line:
            product_data['has_images'] = True
            # Check if it's empty
            if '[]' in line:
                product_data['images_count'] = 0
                issues.append({
                    'type': 'empty_images',
                    'line': i + 1,
                    'id': product_data.get('id'),
                    'name': product_data.get('name')
                })
        
        # Count image objects
        if product_data.get('has_images') and '{' in line and 'id:' in line and 'url:' in line:
            product_data['images_count'] = product_data.get('images_count', 0) + 1
        
        # Detect product end
        if line.strip() == '},' or (line.strip() == '}' and i < len(lines) - 1 and lines[i+1].strip().startswith('}')):
            if in_product:
                # Check if product has no images field at all
                if not product_data.get('has_images'):
                    issues.append({
                        'type': 'missing_images',
                        'line': product_data.get('line'),
                        'id': product_data.get('id'),
                        'name': product_data.get('name')
                    })
                # Check if product has empty images
                elif product_data.get('images_count', 0) == 0:
                    issues.append({
                        'type': 'empty_images',
                        'line': product_data.get('line'),
                        'id': product_data.get('id'),
                        'name': product_data.get('name')
                    })
            in_product = False
            product_data = {}

print(f"Pronađeno {len(issues)} proizvoda sa problemima:\n")

for issue in issues[:20]:  # Show first 20
    print(f"  {issue['type']}: Line {issue['line']} - {issue.get('id', 'unknown')} - {issue.get('name', 'unknown')}")

if len(issues) > 20:
    print(f"\n  ... i još {len(issues) - 20} proizvoda")
