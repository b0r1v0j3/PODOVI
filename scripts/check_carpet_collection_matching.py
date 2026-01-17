#!/usr/bin/env python3
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

print('Collection slugs u JSON-u:')
collections = set()
for c in data['colors']:
    collections.add(c['collection'])

for coll in sorted(collections):
    count = sum(1 for c in data['colors'] if c['collection'] == coll)
    print(f'  {coll}: {count} boja')

print('\nMock-data.ts slugs:')
print('  gerflor-armonia-400')
print('  gerflor-armonia-540')
print('  gerflor-armonia-620')

print('\nColorGrid getCollectionName() bi trebalo da vrati:')
print('  gerflor-armonia-400 -> armonia-400 ili gerflor-armonia-400?')
print('\nPROBLEM: JSON ima "gerflor-armonia-400" ali ColorGrid mozda trazi "armonia-400"')
