#!/usr/bin/env python3
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = data.get('colors', [])

# Find all ballerinas
ballerinas = [c for c in colors if 'ballerina' in c.get('name', '').lower()]

print(f'Pronađeno {len(ballerinas)} BALLERINA boja\n')

for b in ballerinas:
    print(f'{b.get("collection", ""):<40} {b.get("code", ""):<10} {b.get("slug", "")}')
    print(f'  Description: {b.get("description", "NONE")[:100]}...')
    print(f'  Dimension: {b.get("dimension", "NONE")}')
    print(f'  Format: {b.get("format", "NONE")}')
    print()
