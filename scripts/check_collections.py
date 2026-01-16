#!/usr/bin/env python3
import json

data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
collections = set(c.get('collection') for c in data.get('colors', []))

print('Kolekcije u complete JSON:')
for c in sorted(collections):
    print(f'  - {c}')
