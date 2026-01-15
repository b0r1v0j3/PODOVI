#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

data = json.load(open('scripts/gerflor_linoleum_final.json', encoding='utf-8'))

collections = data['collections']
colors = data['colors']

print("="*80)
print("ANALIZA PREUZITIH PODATAKA")
print("="*80)
print(f"\nKolekcije: {len(collections)}")
print(f"Boje: {len(colors)}")

# Check for duplicates
unique_urls = set(c['url'] for c in colors)
print(f"Unique URLs: {len(unique_urls)}")
print(f"Duplikati: {len(colors) - len(unique_urls)}")

# Check colors without code
without_code = [c for c in colors if not c.get('code') or c['code'] == '']
print(f"\nBoje bez koda: {len(without_code)}")

if without_code:
    print("\nBoje bez koda (možda su to kolekcije):")
    for c in without_code:
        print(f"  - {c['name'][:50]} | {c['url'].split('/')[-1]}")

# Count colors per collection
print("\n" + "="*80)
print("BOJE PO KOLEKCIJAMA:")
print("="*80)

total_colors_in_collections = 0
for coll in collections:
    color_count = len(coll['colors'])
    total_colors_in_collections += color_count
    print(f"{coll['name'][:30]:.<30} {color_count:>3} boja")

print(f"\n{'UKUPNO':.>30} {total_colors_in_collections:>3} boja (iz kolekcija)")
print(f"{'Standalone boje':.>30} {len(colors) - total_colors_in_collections:>3}")
print(f"{'TOTAL':.>30} {len(colors):>3}")
