#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skripta za sekvencijalnu obradu svih LVT i Linoleum kolekcija
Obrađuje jednu po jednu da ne preoptereti sistem
"""

import sys
import subprocess
import os
import time

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

def process_collection(collection_slug, collection_type):
    """Process a single collection"""
    print(f"\n{'='*80}")
    print(f"Obrađujem: {collection_slug} ({collection_type})")
    print(f"{'='*80}\n")
    
    try:
        result = subprocess.run(
            ['python', 'scripts/extract_collection_descriptions.py', collection_slug, collection_type],
            cwd=os.getcwd(),
            capture_output=False,  # Show output in real-time
            text=True,
            encoding='utf-8'
        )
        
        if result.returncode == 0:
            print(f"\n✓ {collection_slug} - uspešno obrađena\n")
            return True
        else:
            print(f"\n✗ {collection_slug} - greška (exit code: {result.returncode})\n")
            return False
    except Exception as e:
        print(f"\n✗ {collection_slug} - izuzetak: {e}\n")
        return False

if __name__ == '__main__':
    print("="*80)
    print("SEKVENCIJALNA OBRADA SVIH KOLEKCIJA")
    print("="*80)
    print("\nOva skripta obrađuje kolekcije jednu po jednu.")
    print("Može potrajati nekoliko sati za sve kolekcije.\n")
    
    all_collections = [
        ('lvt', LVT_COLLECTIONS),
        ('linoleum', LINOLEUM_COLLECTIONS),
    ]
    
    total = sum(len(cols) for _, cols in all_collections)
    current = 0
    
    for collection_type, collections in all_collections:
        print(f"\n{'='*80}")
        print(f"OBRADA {collection_type.upper()} KOLEKCIJA ({len(collections)} kolekcija)")
        print(f"{'='*80}\n")
        
        for collection_slug in collections:
            current += 1
            print(f"\n[{current}/{total}]")
            success = process_collection(collection_slug, collection_type)
            
            # Wait a bit between collections to avoid overwhelming the server
            if current < total:
                print("⏳ Čekam 5 sekundi pre sledeće kolekcije...")
                time.sleep(5)
    
    print("\n" + "="*80)
    print("✅ OBRADA ZAVRŠENA!")
    print("="*80)
    print("\nSledeći korak: pokreni 'python scripts/update_lvt_colors_with_dimensions.py'")
    print("za ažuriranje dimenzija u JSON fajlovima.")
