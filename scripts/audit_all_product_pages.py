#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proverava sve proizvode u mock-data.ts i poredi sa JSON fajlovima
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

# Load mock products
mock_data_file = open('lib/data/mock-data.ts', 'r', encoding='utf-8')
mock_content = mock_data_file.read()

# Find all Gerflor products
import re
gerflor_products = re.findall(r"slug:\s*['\"](gerflor-[^'\"]+)['\"]", mock_content)

print('=' * 100)
print('PROVERA PROIZVODA U MOCK-DATA.TS')
print('=' * 100)

print(f'\n📦 Pronađeno Gerflor proizvoda: {len(gerflor_products)}')
for slug in gerflor_products:
    print(f'   - {slug}')

# Check if descriptions are structured
structured = 0
unstructured = 0
short_descriptions = []

desc_pattern = r"description:\s*['\"]([^'\"]+)['\"]"
descriptions = re.findall(desc_pattern, mock_content)

for desc in descriptions:
    # Unescape
    desc = desc.replace('\\n', '\n')
    
    if 'Proizvod:' in desc or 'Ugradnja:' in desc:
        structured += 1
    else:
        unstructured += 1
        if len(desc) < 100:
            short_descriptions.append(desc[:80])

print(f'\n📝 OPISI:')
print(f'   - Strukturirani: {structured}')
print(f'   - Nestrukturirani: {unstructured}')
if short_descriptions:
    print(f'\n   ⚠️  Kratki opisi (< 100 karaktera):')
    for desc in short_descriptions[:5]:
        print(f'      "{desc}..."')
