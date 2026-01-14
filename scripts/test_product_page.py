# -*- coding: utf-8 -*-
"""
Test product page data to find potential runtime errors
"""
import sys
import json
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ts_file = 'lib/data/gerflor-products-generated.ts'

print("🔍 Proveravam proizvode za potencijalne runtime greške...\n")

with open(ts_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find products with potential issues
issues = []

# Check for products with missing or invalid fields
lines = content.split('\n')
current_product = {}
in_product = False
product_line = 0

for i, line in enumerate(lines):
    # Detect product start
    if line.strip().startswith('{') and ('id:' in line or 'name:' in line):
        in_product = True
        current_product = {'line': i + 1, 'fields': {}}
        product_line = i + 1
    
    if in_product:
        # Extract fields
        if 'id:' in line:
            match = re.search(r"id:\s*['\"]([^'\"]+)['\"]", line)
            if match:
                current_product['fields']['id'] = match.group(1)
        
        if 'name:' in line:
            match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", line)
            if match:
                current_product['fields']['name'] = match.group(1)
        
        if 'slug:' in line:
            match = re.search(r"slug:\s*['\"]([^'\"]+)['\"]", line)
            if match:
                current_product['fields']['slug'] = match.group(1)
        
        if 'categoryId:' in line:
            match = re.search(r"categoryId:\s*['\"]([^'\"]+)['\"]", line)
            if match:
                current_product['fields']['categoryId'] = match.group(1)
            elif 'categoryId:' in line and 'undefined' in line:
                issues.append({
                    'type': 'missing_categoryId',
                    'line': i + 1,
                    'product': current_product.get('fields', {})
                })
        
        if 'brandId:' in line:
            match = re.search(r"brandId:\s*['\"]([^'\"]+)['\"]", line)
            if match:
                current_product['fields']['brandId'] = match.group(1)
            elif 'brandId:' in line and 'undefined' in line:
                issues.append({
                    'type': 'missing_brandId',
                    'line': i + 1,
                    'product': current_product.get('fields', {})
                })
        
        if 'images:' in line:
            if '[]' in line or 'undefined' in line:
                issues.append({
                    'type': 'empty_images',
                    'line': i + 1,
                    'product': current_product.get('fields', {})
                })
        
        if 'specs:' in line:
            if '[]' in line or 'undefined' in line:
                # Empty specs is OK, but check if it's undefined
                if 'undefined' in line:
                    issues.append({
                        'type': 'undefined_specs',
                        'line': i + 1,
                        'product': current_product.get('fields', {})
                    })
        
        # Detect product end
        if line.strip() == '},' or (line.strip() == '}' and i < len(lines) - 1):
            if in_product:
                # Check for missing required fields
                fields = current_product.get('fields', {})
                if 'categoryId' not in fields:
                    issues.append({
                        'type': 'missing_categoryId',
                        'line': current_product.get('line', i + 1),
                        'product': fields
                    })
                if 'brandId' not in fields:
                    issues.append({
                        'type': 'missing_brandId',
                        'line': current_product.get('line', i + 1),
                        'product': fields
                    })
                if 'slug' not in fields:
                    issues.append({
                        'type': 'missing_slug',
                        'line': current_product.get('line', i + 1),
                        'product': fields
                    })
            in_product = False
            current_product = {}

print(f"Pronađeno {len(issues)} potencijalnih problema:\n")

for issue in issues[:20]:
    product_info = issue.get('product', {})
    print(f"  {issue['type']}: Line {issue['line']}")
    if product_info.get('id'):
        print(f"    ID: {product_info['id']}")
    if product_info.get('name'):
        print(f"    Name: {product_info['name']}")
    print()

if len(issues) > 20:
    print(f"  ... i još {len(issues) - 20} problema")
