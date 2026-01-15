#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ukloni kolekcije iz liste boja
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json

# Load data
with open('scripts/gerflor_linoleum_final.json', encoding='utf-8') as f:
    data = json.load(f)

print("="*80)
print("ČIŠĆENJE LINOLEUM PODATAKA")
print("="*80)

print(f"\nPre: {len(data['colors'])} boja")

# Ukloni boje koje nemaju kod (to su zapravo kolekcije)
colors_with_code = [c for c in data['colors'] if c.get('code') and c['code'] != '']

print(f"Posle: {len(colors_with_code)} boja")
print(f"Uklonjeno: {len(data['colors']) - len(colors_with_code)} kolekcija iz liste boja")

# Update data
data['colors'] = colors_with_code
data['summary']['total_colors'] = len(colors_with_code)

# Save cleaned data
output_path = 'scripts/gerflor_linoleum_clean.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n✓ Očišćeni podaci sačuvani u: {output_path}")
print(f"\n✅ FINALNO:")
print(f"   Kolekcije: {data['summary']['total_collections']}")
print(f"   Boje: {data['summary']['total_colors']}")
