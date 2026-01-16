#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ekstraktuje specs samo za kolekcije koje nemaju specs
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
        
        # Find all text elements
        text_content = soup.get_text()
        
        # Look for specific patterns in text
        patterns = {
            'DIMENSION': r'DIMENSION[:\s]+([0-9.]+\s*cm\s*[Xx×]\s*[0-9.]+\s*cm)',
            'FORMAT': r'FORMAT[:\s]+([A-Za-z\s]+(?:tile|plank|roll))',
            'OVERALL THICKNESS': r'OVERALL THICKNESS[:\s]+([0-9.]+\s*mm)',
            'WIDTH': r'WIDTH[:\s]+([0-9.]+\s*[cm])',
            'LENGTH': r'LENGTH[:\s]+([0-9.]+\s*[cm])',
            'WELDING ROD': r'WELDING ROD[^:]*:[:\s]+([A-Z0-9]+)',
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, text_content, re.I)
            if match:
                specs[key] = match.group(1).strip()
        
        # Combine WIDTH and LENGTH into DIMENSION if found
        if 'WIDTH' in specs and 'LENGTH' in specs and 'DIMENSION' not in specs:
            specs['DIMENSION'] = f"{specs['WIDTH']} X {specs['LENGTH']}"
        
        return specs
        
    except Exception as e:
        return {}

def process_collection(collection_slug, collection_type):
    """Procesira jednu kolekciju"""
    json_file = Path(f'downloads/product_descriptions/{collection_type}/{collection_slug}_colors.json')
    
    if not json_file.exists():
        print(f"  ⚠️  JSON ne postoji: {json_file.name}")
        return 0
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    colors = data.get('colors', [])
    
    # Check how many already have specs
    existing_specs = sum(1 for c in colors if c.get('specs') and len(c.get('specs', {})) > 0)
    
    if existing_specs == len(colors):
        print(f"  ✅ {collection_slug}: sve boje već imaju specs ({existing_specs}/{len(colors)})")
        return 0
    
    print(f"\n📦 {collection_slug}: {len(colors)} boja, {existing_specs} sa specs")
    
    updated = 0
    for i, color in enumerate(colors, 1):
        # Skip if already has specs
        if color.get('specs') and len(color.get('specs', {})) > 0:
            continue
        
        color_url = color.get('url')
        if not color_url:
            continue
        
        print(f"  [{i}/{len(colors)}] ", end='', flush=True)
        specs = extract_specs_from_html(color_url)
        
        if specs:
            color['specs'] = specs
            updated += 1
            print(f"✓ ({len(specs)} specs)")
        else:
            print("✗")
        
        time.sleep(1)
    
    if updated > 0:
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  💾 Ažurirano: {updated} boja")
    
    return updated

# Collections that need specs (based on analysis)
COLLECTIONS_NEEDING_SPECS = [
    ('lvt', 'creation-40'),
    ('lvt', 'creation-40-clic-acoustic-new-collection'),
    ('lvt', 'creation-55-clic-new-collection'),
    ('lvt', 'creation-55-clic-acoustic-new-collection'),
    ('lvt', 'creation-55-looselay-acoustic'),
    ('lvt', 'creation-55-zen'),
    ('lvt', 'creation-70-clic-5mm-new-collection'),
    ('lvt', 'creation-70-connect'),
    ('lvt', 'creation-55-new-collection'),
    ('lvt', 'creation-70-new-collection'),
    ('lvt', 'creation-55-looselay'),
    ('lvt', 'creation-40-clic-new-collection'),
]

def main():
    print("="*80)
    print("EKSTRAKCIJA SPECS ZA PREOSTALE KOLEKCIJE")
    print("="*80)
    
    total = 0
    for collection_type, collection_slug in COLLECTIONS_NEEDING_SPECS:
        updated = process_collection(collection_slug, collection_type)
        total += updated
    
    print("\n" + "="*80)
    print(f"✅ ZAVRŠENO! Ažurirano: {total} boja")
    print("="*80)
    print("\nSledeći korak: python scripts/complete_integration.py")

if __name__ == '__main__':
    main()
