#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skripta za obradu svih LVT i Linoleum kolekcija
"""

import sys
import subprocess
import os

sys.stdout.reconfigure(encoding='utf-8')

# LVT kolekcije (bez creation-30-new-collection jer je već obrađena)
LVT_COLLECTIONS = [
    'creation-40',
    'creation-40-clic',
    'creation-40-clic-acoustic',
    'creation-40-zen',
    'creation-55',
    'creation-55-clic',
    'creation-55-clic-acoustic',
    'creation-55-looselay',
    'creation-55-looselay-acoustic',
    'creation-55-zen',
    'creation-70',
    'creation-70-clic',
    'creation-70-connect',
    'creation-70-looselay',
    'creation-70-megaclic',
    'creation-70-zen',
    'creation-saga2',
]

# Linoleum kolekcije
LINOLEUM_COLLECTIONS = [
    'dlw-colorette',
    'dlw-colorette-acoustic-plus',
    'dlw-lino-art-moon',
    'dlw-lino-art-urban',
    'dlw-linodur',
    'dlw-marmorette-2-mm',
    'dlw-marmorette-25-mm',
    'dlw-marmorette-32-mm',
    'dlw-marmorette-acoustic',
    'dlw-marmorette-acousticplus',
    'dlw-marmorette-bfl-s1',
    'dlw-marmorette-lch',
    'dlw-marmorette-r10',
    'dlw-uni-walton',
    'dlw-uni-walton-acoustic-plus',
]

def process_collections(collections, collection_type):
    """Process all collections of a given type"""
    print(f"\n{'='*80}")
    print(f"OBRADA {collection_type.upper()} KOLEKCIJA")
    print(f"{'='*80}\n")
    
    total = len(collections)
    for i, collection_slug in enumerate(collections, 1):
        print(f"\n[{i}/{total}] Obrađujem: {collection_slug}")
        print("-" * 80)
        
        try:
            result = subprocess.run(
                ['python', 'scripts/extract_collection_descriptions.py', collection_slug, collection_type],
                cwd=os.getcwd(),
                capture_output=True,
                text=True,
                encoding='utf-8'
            )
            
            if result.returncode == 0:
                print(f"✓ {collection_slug} - uspešno obrađena")
            else:
                print(f"✗ {collection_slug} - greška:")
                print(result.stderr)
        except Exception as e:
            print(f"✗ {collection_slug} - izuzetak: {e}")
        
        print()

if __name__ == '__main__':
    print("="*80)
    print("OBRADA SVIH KOLEKCIJA")
    print("="*80)
    
    # Process LVT collections
    process_collections(LVT_COLLECTIONS, 'lvt')
    
    # Process Linoleum collections
    process_collections(LINOLEUM_COLLECTIONS, 'linoleum')
    
    print("\n" + "="*80)
    print("✅ OBRADA ZAVRŠENA!")
    print("="*80)
    print("\nSledeći korak: pokreni 'python scripts/update_lvt_colors_with_dimensions.py'")
    print("za ažuriranje dimenzija u JSON fajlovima.")
