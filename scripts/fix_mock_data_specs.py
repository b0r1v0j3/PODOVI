#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Popravlja specifikacije u mock-data.ts - normalizuje tip instalacije i drugo
"""

import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

print('=' * 100)
print('POPRAVKA SPECIFIKACIJA U MOCK-DATA.TS')
print('=' * 100)

# Read file
with open('lib/data/mock-data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

fixed_count = 0

# Fix installation types
replacements = [
    (r"'Glue down'", "'Lepljenje'"),
    (r'"Glue down"', '"Lepljenje"'),
    (r"'Loose lay'", "'Looselay'"),
    (r'"Loose lay"', '"Looselay"'),
    (r"'Loose-lay'", "'Looselay'"),
    (r'"Loose-lay"', '"Looselay"'),
]

for old, new in replacements:
    if re.search(old, content):
        content = re.sub(old, new, content)
        fixed_count += 1
        print(f'✅ Zamenjeno: {old} → {new}')

# Fix thickness format
thickness_pattern = r"value:\s*['\"](\d+)\s*mm['\"]"
def fix_thickness(match):
    num = match.group(1)
    return f"value: '{num}.00 mm'"

if re.search(thickness_pattern, content):
    content = re.sub(thickness_pattern, fix_thickness, content)
    fixed_count += 1
    print('✅ Normalizovane debljine (dodato .00)')

# Save
if fixed_count > 0:
    with open('lib/data/mock-data.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'\n✅ Popravljeno: {fixed_count} specifikacija')
else:
    print('\n⚠️  Nema specifikacija za popravku')
