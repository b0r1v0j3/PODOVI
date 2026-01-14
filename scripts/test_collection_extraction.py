# -*- coding: utf-8 -*-
"""
Test collection name extraction logic
"""
import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Load JSON
with open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Get all unique collections
all_collections = sorted(set(c['collection'] for c in data['colors']))

# Test product slugs - simulate what happens in ColorGrid
test_slugs = [
    'creation-saga2-terra-35021566',
    'creation-55-looselay-terra-39741566',
    'creation-55-clic-acoustic-ball-39750555',
    'creation-40-clic-acoustic-twist-39750417',
    'creation-70-megaclic-quartet-39750545',
    'gerflor-creation-30',
]

print("Testing collection name extraction:\n")
for slug in test_slugs:
    collectionName = slug.replace('gerflor-', '')
    
    # Simulate ColorGrid logic
    if collectionName.startswith('creation-'):
        parts = collectionName.split('-')
        if len(parts) >= 2:
            # Handle 4-part collections like "creation-55-clic-acoustic"
            if len(parts) >= 4 and parts[2] == 'clic' and parts[3] == 'acoustic':
                collectionName = '-'.join(parts[:4])
            # Handle 3-part collections
            elif len(parts) >= 3 and parts[2] in ['looselay', 'clic', 'zen', 'connect', 'megaclic', 'saga2']:
                collectionName = '-'.join(parts[:3])
            # Handle 2-part collections
            else:
                collectionName = '-'.join(parts[:2])
    
    # Check if exists
    exists = collectionName in all_collections
    matching = [c for c in data['colors'] if c['collection'] == collectionName]
    
    print(f"Slug: {slug}")
    print(f"  Extracted: {collectionName}")
    print(f"  Exists: {exists}")
    print(f"  Matching colors: {len(matching)}")
    if not exists:
        print(f"  ❌ FAILED - collection not found!")
        # Try to find similar
        similar = [c for c in all_collections if collectionName in c or c in collectionName]
        if similar:
            print(f"  Similar collections: {similar}")
    print()
