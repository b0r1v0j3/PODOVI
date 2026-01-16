#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pokreće extract_collection_colors_only.py za svaku kolekciju jednu po jednu
Nakon svake kolekcije se gasi i prikazuje rezultate
"""

import sys
import subprocess
import os
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Category URLs
LVT_CATEGORY = "https://www.gerflor-cee.com/category/lvt-tiles-planks"
LINOLEUM_CATEGORY = "https://www.gerflor-cee.com/category/linoleum"

# Tačni linkovi kolekcija (ažurirano)
LVT_COLLECTIONS = [
    'https://www.gerflor-cee.com/products/creation-30-new-collection',
    'https://www.gerflor-cee.com/products/creation-55-new-collection',
    'https://www.gerflor-cee.com/products/creation-55-clic-new-collection',
    'https://www.gerflor-cee.com/products/creation-55-looselay',
    'https://www.gerflor-cee.com/products/creation-70-megaclic',
    'https://www.gerflor-cee.com/products/creation-saga2',
    'https://www.gerflor-cee.com/products/new-2025-creation-70-looselay',
    'https://www.gerflor-cee.com/products/creation-70-zen',
    'https://www.gerflor-cee.com/products/creation-40-zen',
    'https://www.gerflor-cee.com/products/creation-55-clic-acoustic-new-collection',
    'https://www.gerflor-cee.com/products/creation-70-clic-5mm-new-collection',
    'https://www.gerflor-cee.com/products/creation-40-clic-acoustic-new-collection',
    'https://www.gerflor-cee.com/products/creation-55-looselay-acoustic',
    'https://www.gerflor-cee.com/products/creation-70-connect',
    'https://www.gerflor-cee.com/products/creation-70-new-collection',
    'https://www.gerflor-cee.com/products/creation-55-zen',
    'https://www.gerflor-cee.com/products/creation-40-clic-new-collection',
    'https://www.gerflor-cee.com/products/creation-40-new-collection',
]

LINOLEUM_COLLECTIONS = [
    'https://www.gerflor-cee.com/products/dlw-marmorette-2-mm',
    'https://www.gerflor-cee.com/products/dlw-marmorette-25-mm',
    'https://www.gerflor-cee.com/products/dlw-linodur',
    'https://www.gerflor-cee.com/products/dlw-marmorette-lch',
    'https://www.gerflor-cee.com/products/dlw-marmorette-r10',
    'https://www.gerflor-cee.com/products/dlw-marmorette-32-mm',
    'https://www.gerflor-cee.com/products/dlw-marmorette-acousticplus',
    'https://www.gerflor-cee.com/products/dlw-uni-walton-acoustic-plus',
    'https://www.gerflor-cee.com/products/dlw-uni-walton',
    'https://www.gerflor-cee.com/products/dlw-marmorette-acoustic',
    'https://www.gerflor-cee.com/products/dlw-marmorette-bfl-s1',
    'https://www.gerflor-cee.com/products/dlw-lino-art-urban',
    'https://www.gerflor-cee.com/products/dlw-colorette-acoustic-plus',
    'https://www.gerflor-cee.com/products/dlw-lino-art-moon',
    'https://www.gerflor-cee.com/products/dlw-colorette',
]

def process_collection(collection_url, collection_type):
    """Process a single collection"""
    collection_slug = collection_url.split('/')[-1]
    print(f"\n{'='*80}")
    print(f"OBRADA: {collection_slug.upper()}")
    print(f"{'='*80}\n")
    
    try:
        result = subprocess.run(
            ['python', 'scripts/extract_collection_colors_only.py', collection_url, '--type', collection_type],
            cwd=os.getcwd(),
            capture_output=False,  # Show output in real-time
            text=True,
            encoding='utf-8'
        )
        
        if result.returncode == 0:
            # Check if file was created
            output_file = Path(f'downloads/product_descriptions/{collection_type}/{collection_slug}_colors.json')
            if output_file.exists():
                with open(output_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    colors_count = len(data.get('colors', []))
                    colors_with_specs = sum(1 for c in data.get('colors', []) if c.get('specs'))
                    print(f"\n✅ {collection_slug} - uspešno obrađena")
                    print(f"   Boja: {colors_count}")
                    print(f"   Boja sa specs: {colors_with_specs}")
                    return True
            else:
                print(f"\n⚠️  {collection_slug} - obrađena ali fajl nije kreiran")
                return False
        else:
            print(f"\n❌ {collection_slug} - greška (exit code: {result.returncode})")
            return False
    except Exception as e:
        print(f"\n❌ {collection_slug} - izuzetak: {e}")
        return False

def main():
    print("="*80)
    print("OBRADA SVIH KOLEKCIJA - JEDNA PO JEDNA")
    print("="*80)
    print("\nOva skripta obrađuje kolekcije jednu po jednu.")
    print("Nakon svake kolekcije se gasi i prikazuje rezultate.\n")
    
    all_collections = [
        ('lvt', LVT_COLLECTIONS),
        ('linoleum', LINOLEUM_COLLECTIONS),
    ]
    
    total = sum(len(cols) for _, cols in all_collections)
    current = 0
    successful = 0
    failed = []
    
    for collection_type, collections in all_collections:
        print(f"\n{'='*80}")
        print(f"OBRADA {collection_type.upper()} KOLEKCIJA ({len(collections)} kolekcija)")
        print(f"{'='*80}\n")
        
        for collection_url in collections:
            current += 1
            print(f"\n[{current}/{total}]")
            
            success = process_collection(collection_url, collection_type)
            
            if success:
                successful += 1
            else:
                failed.append((collection_url, collection_type))
            
            print(f"\n{'─'*80}")
    
    print("\n" + "="*80)
    print("✅ OBRADA ZAVRŠENA!")
    print("="*80)
    print(f"\n📊 Rezime:")
    print(f"   ✓ Uspešno: {successful}/{total}")
    print(f"   ✗ Neuspešno: {len(failed)}/{total}")
    
    if failed:
        print(f"\n❌ Neuspešne kolekcije:")
        for url, col_type in failed:
            print(f"   - {url.split('/')[-1]} ({col_type})")
    
    print(f"\n💡 Sledeći korak: pokreni skripte za ažuriranje JSON fajlova:")
    print(f"   python scripts/update_lvt_colors_with_dimensions.py")
    print(f"   python scripts/update_linoleum_colors_with_dimensions.py")

if __name__ == '__main__':
    main()
