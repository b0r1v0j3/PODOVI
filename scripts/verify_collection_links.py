#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proverava da li su linkovi kolekcija validni
"""

import sys
import requests
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

LVT_COLLECTIONS = [
    'https://www.gerflor-cee.com/products/creation-30-new-collection',
    'https://www.gerflor-cee.com/products/creation-40',
    'https://www.gerflor-cee.com/products/creation-40-clic',
    'https://www.gerflor-cee.com/products/creation-40-clic-acoustic',
    'https://www.gerflor-cee.com/products/creation-40-zen',
    'https://www.gerflor-cee.com/products/creation-55',
    'https://www.gerflor-cee.com/products/creation-55-clic',
    'https://www.gerflor-cee.com/products/creation-55-clic-acoustic',
    'https://www.gerflor-cee.com/products/creation-55-looselay',
    'https://www.gerflor-cee.com/products/creation-55-looselay-acoustic',
    'https://www.gerflor-cee.com/products/creation-55-zen',
    'https://www.gerflor-cee.com/products/creation-70',
    'https://www.gerflor-cee.com/products/creation-70-clic',
    'https://www.gerflor-cee.com/products/creation-70-connect',
    'https://www.gerflor-cee.com/products/creation-70-looselay',
    'https://www.gerflor-cee.com/products/creation-70-megaclic',
    'https://www.gerflor-cee.com/products/creation-70-zen',
    'https://www.gerflor-cee.com/products/creation-saga2',
]

LINOLEUM_COLLECTIONS = [
    'https://www.gerflor-cee.com/products/dlw-colorette',
    'https://www.gerflor-cee.com/products/dlw-colorette-acoustic-plus',
    'https://www.gerflor-cee.com/products/dlw-lino-art-moon',
    'https://www.gerflor-cee.com/products/dlw-lino-art-urban',
    'https://www.gerflor-cee.com/products/dlw-linodur',
    'https://www.gerflor-cee.com/products/dlw-marmorette-2-mm',
    'https://www.gerflor-cee.com/products/dlw-marmorette-25-mm',
    'https://www.gerflor-cee.com/products/dlw-marmorette-32-mm',
    'https://www.gerflor-cee.com/products/dlw-marmorette-acoustic',
    'https://www.gerflor-cee.com/products/dlw-marmorette-acousticplus',
    'https://www.gerflor-cee.com/products/dlw-marmorette-bfl-s1',
    'https://www.gerflor-cee.com/products/dlw-marmorette-lch',
    'https://www.gerflor-cee.com/products/dlw-marmorette-r10',
    'https://www.gerflor-cee.com/products/dlw-uni-walton',
    'https://www.gerflor-cee.com/products/dlw-uni-walton-acoustic-plus',
]

def verify_link(url):
    """Verify if link is accessible"""
    try:
        response = requests.get(url, timeout=10, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def main():
    print("="*80)
    print("PROVERA LINKOVA KOLEKCIJA")
    print("="*80)
    
    all_collections = [
        ('LVT', LVT_COLLECTIONS),
        ('Linoleum', LINOLEUM_COLLECTIONS),
    ]
    
    total_valid = 0
    total_invalid = 0
    invalid_links = []
    
    for collection_type, collections in all_collections:
        print(f"\n{collection_type} kolekcije:")
        print("-" * 80)
        
        for url in collections:
            slug = url.split('/')[-1]
            is_valid = verify_link(url)
            
            if is_valid:
                print(f"  ✓ {slug}")
                total_valid += 1
            else:
                print(f"  ✗ {slug} - NEVALIDAN")
                total_invalid += 1
                invalid_links.append((url, collection_type))
    
    print(f"\n{'='*80}")
    print(f"REZIME:")
    print(f"  ✓ Validni: {total_valid}")
    print(f"  ✗ Nevalidni: {total_invalid}")
    
    if invalid_links:
        print(f"\nNevalidni linkovi:")
        for url, col_type in invalid_links:
            print(f"  - {url.split('/')[-1]} ({col_type})")

if __name__ == '__main__':
    main()
