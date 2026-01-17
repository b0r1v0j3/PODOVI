#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ekstraktuje specs direktno iz HTML-a bez Selenium-a
Koristi requests i BeautifulSoup za brži i pouzdaniji pristup
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
        
        # Find all elements that might contain specifications
        # Look for divs/spans with characteristic data
        spec_elements = soup.find_all(['div', 'span', 'p', 'li', 'td'], 
                                     text=re.compile(r'(DIMENSION|FORMAT|OVERALL THICKNESS|WELDING ROD|WIDTH|LENGTH)', re.I))
        
        for elem in spec_elements:
            text = elem.get_text(strip=True)
            
            # Try to parse key:value format
            if ':' in text:
                parts = text.split(':', 1)
                key = parts[0].strip().upper()
                value = parts[1].strip()
                
                if any(keyword in key for keyword in ['DIMENSION', 'FORMAT', 'THICKNESS', 'WELDING', 'WIDTH', 'LENGTH']):
                    specs[key] = value
        
        # Also try to find in tables
        tables = soup.find_all('table')
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    key = cells[0].get_text(strip=True).upper()
                    value = cells[1].get_text(strip=True)
                    
                    if any(keyword in key for keyword in ['DIMENSION', 'FORMAT', 'THICKNESS', 'WELDING', 'WIDTH', 'LENGTH']):
                        specs[key] = value
        
        # Combine WIDTH and LENGTH into DIMENSION if found
        if 'WIDTH' in specs and 'LENGTH' in specs and 'DIMENSION' not in specs:
            specs['DIMENSION'] = f"{specs['WIDTH']} X {specs['LENGTH']}"
        elif 'WIDTH OF SHEET' in specs and 'LENGTH OF SHEET' in specs and 'DIMENSION' not in specs:
            specs['DIMENSION'] = f"{specs['WIDTH OF SHEET']} X {specs['LENGTH OF SHEET']}"

        # Extract NCS, LRV, Packaging (Unit/box), Weight
        # We search specifically for these keys in the parsed specs or raw text if needed
        # The loop above already captures most "Key: Value" pairs, so we just need to ensure
        # our filtering allows them or we manually look for them if they are not standard "Key: Value"

        # Additional specific fields to ensure we capture
        desired_fields = ['NCS', 'LRV', 'UNIT/BOX', 'WEIGHT', 'TOTAL WEIGHT', 'PACKAGING']
        
        # Re-scan elements for these specific fields if not already found
        spec_elements = soup.find_all(['div', 'span', 'p', 'li', 'td'])
        for elem in spec_elements:
            text = elem.get_text(strip=True)
            if ':' in text:
                parts = text.split(':', 1)
                key = parts[0].strip().upper()
                value = parts[1].strip()
                
                if any(field in key for field in desired_fields):
                    # Clean up keys
                    if 'UNIT/BOX' in key:
                        specs['PACKAGING'] = f"{value} kom/kutija"
                    elif 'WEIGHT' in key:
                        specs['WEIGHT'] = value
                    else:
                        specs[key] = value

        print(f"      Debugging specs found: {list(specs.keys())}")
        
        return specs
        
    except Exception as e:
        print(f"      ⚠️  Greška: {e}")
        return {}

def process_collection(collection_url, collection_slug, collection_type):
    """Procesira jednu kolekciju i ekstraktuje specs za sve boje"""
    print(f"\n{'='*80}")
    print(f"OBRADA: {collection_slug}")
    print(f"{'='*80}\n")
    
    # Load existing colors JSON to get URLs
    json_file = Path(f'downloads/product_descriptions/{collection_type}/{collection_slug}_colors.json')
    if not json_file.exists():
        print(f"  ⚠️  JSON fajl ne postoji: {json_file}")
        return 0
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    colors = data.get('colors', [])
    print(f"  📊 Procesuiram {len(colors)} boja...")
    
    updated = 0
    for i, color in enumerate(colors, 1):
        color_url = color.get('url')
        color_slug = color.get('slug', '')
        
        if not color_url:
            continue
        
        print(f"    [{i}/{len(colors)}] {color_slug[:50]}... ", end='')
        
        # Extract specs
        specs = extract_specs_from_html(color_url)
        
        if specs:
            color['specs'] = specs
            updated += 1
            print(f"✓ ({len(specs)} specs)")
        else:
            print("✗ (0 specs)")
        
        # Be nice to the server
        time.sleep(1)
    
    # Save updated JSON
    if updated > 0:
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\n  💾 Sačuvano: {updated}/{len(colors)} boja sa specs")
    
    return updated

def main():
    print("="*80)
    print("EKSTRAKCIJA SPECS DIREKTNO IZ HTML-A - SVE KOLEKCIJE")
    print("="*80)
    print("\n⚠️  Ova skripta koristi requests umesto Selenium-a")
    print("   Brže i pouzdanije za ekstrakciju specs podataka\n")
    
    # Process all collections
    collections = [
        # LVT
        ('lvt', 'creation-30-new-collection', 'https://www.gerflor-cee.com/products/creation-30-new-collection'),
        ('lvt', 'creation-55-new-collection', 'https://www.gerflor-cee.com/products/creation-55-new-collection'),
        ('lvt', 'creation-55-clic-new-collection', 'https://www.gerflor-cee.com/products/creation-55-clic-new-collection'),
        ('lvt', 'creation-55-looselay', 'https://www.gerflor-cee.com/products/creation-55-looselay'),
        ('lvt', 'creation-70-megaclic', 'https://www.gerflor-cee.com/products/creation-70-megaclic'),
        ('lvt', 'creation-saga2', 'https://www.gerflor-cee.com/products/creation-saga2'),
        ('lvt', 'new-2025-creation-70-looselay', 'https://www.gerflor-cee.com/products/new-2025-creation-70-looselay'),
        ('lvt', 'creation-70-zen', 'https://www.gerflor-cee.com/products/creation-70-zen'),
        ('lvt', 'creation-40-zen', 'https://www.gerflor-cee.com/products/creation-40-zen'),
        ('lvt', 'creation-55-clic-acoustic-new-collection', 'https://www.gerflor-cee.com/products/creation-55-clic-acoustic-new-collection'),
        ('lvt', 'creation-70-clic-5mm-new-collection', 'https://www.gerflor-cee.com/products/creation-70-clic-5mm-new-collection'),
        ('lvt', 'creation-40-clic-acoustic-new-collection', 'https://www.gerflor-cee.com/products/creation-40-clic-acoustic-new-collection'),
        ('lvt', 'creation-55-looselay-acoustic', 'https://www.gerflor-cee.com/products/creation-55-looselay-acoustic'),
        ('lvt', 'creation-70-connect', 'https://www.gerflor-cee.com/products/creation-70-connect'),
        ('lvt', 'creation-70-new-collection', 'https://www.gerflor-cee.com/products/creation-70-new-collection'),
        ('lvt', 'creation-55-zen', 'https://www.gerflor-cee.com/products/creation-55-zen'),
        ('lvt', 'creation-40-clic-new-collection', 'https://www.gerflor-cee.com/products/creation-40-clic-new-collection'),
        ('lvt', 'creation-40-new-collection', 'https://www.gerflor-cee.com/products/creation-40-new-collection'),
        # Linoleum
        ('linoleum', 'dlw-marmorette-2-mm', 'https://www.gerflor-cee.com/products/dlw-marmorette-2-mm'),
        ('linoleum', 'dlw-marmorette-25-mm', 'https://www.gerflor-cee.com/products/dlw-marmorette-25-mm'),
        ('linoleum', 'dlw-linodur', 'https://www.gerflor-cee.com/products/dlw-linodur'),
        ('linoleum', 'dlw-marmorette-lch', 'https://www.gerflor-cee.com/products/dlw-marmorette-lch'),
        ('linoleum', 'dlw-marmorette-r10', 'https://www.gerflor-cee.com/products/dlw-marmorette-r10'),
        ('linoleum', 'dlw-marmorette-32-mm', 'https://www.gerflor-cee.com/products/dlw-marmorette-32-mm'),
        ('linoleum', 'dlw-marmorette-acousticplus', 'https://www.gerflor-cee.com/products/dlw-marmorette-acousticplus'),
        ('linoleum', 'dlw-uni-walton-acoustic-plus', 'https://www.gerflor-cee.com/products/dlw-uni-walton-acoustic-plus'),
        ('linoleum', 'dlw-uni-walton', 'https://www.gerflor-cee.com/products/dlw-uni-walton'),
        ('linoleum', 'dlw-marmorette-acoustic', 'https://www.gerflor-cee.com/products/dlw-marmorette-acoustic'),
        ('linoleum', 'dlw-marmorette-bfl-s1', 'https://www.gerflor-cee.com/products/dlw-marmorette-bfl-s1'),
        ('linoleum', 'dlw-lino-art-urban', 'https://www.gerflor-cee.com/products/dlw-lino-art-urban'),
        ('linoleum', 'dlw-colorette-acoustic-plus', 'https://www.gerflor-cee.com/products/dlw-colorette-acoustic-plus'),
        ('linoleum', 'dlw-lino-art-moon', 'https://www.gerflor-cee.com/products/dlw-lino-art-moon'),
        ('linoleum', 'dlw-colorette', 'https://www.gerflor-cee.com/products/dlw-colorette'),
    ]
    
    total_updated = 0
    for collection_type, collection_slug, collection_url in collections:
        updated = process_collection(collection_url, collection_slug, collection_type)
        total_updated += updated
        print(f"\n⏳ Pauza 5 sekundi...")
        time.sleep(5)
    
    print("\n" + "="*80)
    print("✅ ZAVRŠENO!")
    print("="*80)
    print(f"   ✓ Ažurirano: {total_updated} boja sa specs")
    print(f"\n📝 Sledeći korak: python scripts/complete_integration.py")

if __name__ == '__main__':
    main()
