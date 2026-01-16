#!/usr/bin/env python3
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

ballerina = [c for c in colors if c.get('slug') == 'ballerina-61300347']

print(f'Pronađeno: {len(ballerina)}')
if ballerina:
    b = ballerina[0]
    print(f'Dimension: {b.get("dimension")}')
    print(f'Collection: {b.get("collection")}')
    print(f'Format: {b.get("format")}')
    print(f'Overall thickness: {b.get("overall_thickness")}')
