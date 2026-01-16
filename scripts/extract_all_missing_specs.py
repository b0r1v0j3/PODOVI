#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ekstraktuje specs za SVE kolekcije koje nemaju 100% specs
"""

import sys
import json
import time
import requests
from bs4 import BeautifulSoup
from pathlib import Path
import re

sys.stdout.reconfigure(encoding='utf-8')

def extract_specs_from_html(url):
    """Ekstraktuje specs direktno iz HTML-a"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        specs = {}
        text_content = soup.get_text()
        
        patterns = {
            'DIMENSION': r'DIMENSION[:\s]+([0-9.]+\s*cm\s*[Xx×]\s*[0-9.]+\s*cm)',
            'FORMAT': r'FORMAT[:\s]+([A-Za-z\s]+(?:tile|plank|Plank|Tile|roll|Roll))',
            'FORMATS': r'FORMATS[:\s]+([A-Za-z\s]+)',
            'OVERALL THICKNESS': r'OVERALL THICKNESS[:\s]+([0-9.]+\s*mm)',
            'WIDTH': r'WIDTH[:\s]+([0-9.]+\s*cm)',
            'LENGTH': r'LENGTH[:\s]+([0-9.]+\s*cm)',
            'WIDTH OF SHEET': r'Width of sheet[:\s]+([0-9.]+\s*[m])',
            'LENGTH OF SHEET': r'Length of sheet[:\s]+([0-9.]+\s*[m])',
            'WELDING ROD': r'WELDING ROD[^:]*:[:\s]+([A-Z0-9]+)',
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, text_content, re.I | re.M)
            if match:
                specs[key] = match.group(1).strip()
        
        # Combine WIDTH and LENGTH
        if 'WIDTH' in specs and 'LENGTH' in specs and 'DIMENSION' not in specs:
            specs['DIMENSION'] = f"{specs['WIDTH']} X {specs['LENGTH']}"
        elif 'WIDTH OF SHEET' in specs and 'LENGTH OF SHEET' in specs and 'DIMENSION' not in specs:
            specs['DIMENSION'] = f"{specs['WIDTH OF SHEET']} X {specs['LENGTH OF SHEET']}"
        
        return specs
        
    except Exception as e:
        return {}

def process_collection(collection_slug, collection_type):
    """Procesira jednu kolekciju"""
    json_file = Path(f'downloads/product_descriptions/{collection_type}/{collection_slug}_colors.json')
    
    if not json_file.exists():
        return 0
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    colors = data.get('colors', [])
    existing_specs = sum(1 for c in colors if c.get('specs') and len(c.get('specs', {})) > 0)
    
    if existing_specs == len(colors):
        return 0
    
    print(f"\n📦 {collection_slug}: {len(colors) - existing_specs} boja bez specs")
    
    updated = 0
    for i, color in enumerate(colors, 1):
        if color.get('specs') and len(color.get('specs', {})) > 0:
            continue
        
        color_url = color.get('url')
        if not color_url:
            continue
        
        print(f"  [{updated+1}] ", end='', flush=True)
        specs = extract_specs_from_html(color_url)
        
        if specs:
            color['specs'] = specs
            updated += 1
            print(f"✓")
        else:
            print(f"✗")
        
        time.sleep(0.5)  # Brža pauza
    
    if updated > 0:
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  💾 Ažurirano: {updated} boja")
    
    return updated

# SVE kolekcije
ALL_COLLECTIONS = [
    ('lvt', 'creation-30-new-collection'),
    ('lvt', 'creation-40'),
    ('lvt', 'creation-40-clic-acoustic-new-collection'),
    ('lvt', 'creation-40-clic-new-collection'),
    ('lvt', 'creation-40-new-collection'),
    ('lvt', 'creation-40-zen'),
    ('lvt', 'creation-55-clic-acoustic-new-collection'),
    ('lvt', 'creation-55-clic-new-collection'),
    ('lvt', 'creation-55-looselay'),
    ('lvt', 'creation-55-looselay-acoustic'),
    ('lvt', 'creation-55-new-collection'),
    ('lvt', 'creation-55-zen'),
    ('lvt', 'creation-70-clic-5mm-new-collection'),
    ('lvt', 'creation-70-connect'),
    ('lvt', 'creation-70-megaclic'),
    ('lvt', 'creation-70-new-collection'),
    ('lvt', 'creation-70-zen'),
    ('lvt', 'creation-saga2'),
    ('lvt', 'new-2025-creation-70-looselay'),
    ('linoleum', 'dlw-colorette'),
    ('linoleum', 'dlw-colorette-acoustic-plus'),
    ('linoleum', 'dlw-lino-art-moon'),
    ('linoleum', 'dlw-lino-art-urban'),
    ('linoleum', 'dlw-linodur'),
    ('linoleum', 'dlw-marmorette-2-mm'),
    ('linoleum', 'dlw-marmorette-25-mm'),
    ('linoleum', 'dlw-marmorette-32-mm'),
    ('linoleum', 'dlw-marmorette-acoustic'),
    ('linoleum', 'dlw-marmorette-acousticplus'),
    ('linoleum', 'dlw-marmorette-bfl-s1'),
    ('linoleum', 'dlw-marmorette-lch'),
    ('linoleum', 'dlw-marmorette-r10'),
    ('linoleum', 'dlw-uni-walton'),
    ('linoleum', 'dlw-uni-walton-acoustic-plus'),
]

def main():
    print("="*80)
    print("EKSTRAKCIJA SPECS ZA SVE PREOSTALE BOJE - CILJ 100%")
    print("="*80)
    
    total = 0
    for collection_type, collection_slug in ALL_COLLECTIONS:
        updated = process_collection(collection_slug, collection_type)
        total += updated
    
    print("\n" + "="*80)
    print(f"✅ ZAVRŠENO! Ažurirano: {total} boja")
    print("="*80)

if __name__ == '__main__':
    main()
