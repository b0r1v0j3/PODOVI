#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Raspakuje ZIP fajlove za Armonia kolekcije i premešta slike gde treba
"""

import sys
import zipfile
import shutil
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# ZIP fajlovi
zip_files = [
    'product-sku-media-resources-1768628509.zip',
    'product-sku-media-resources-1768628500.zip',
    'product-sku-media-resources-1768628490.zip'
]

# Temp folder
temp_dir = Path('temp_carpet_extract')
temp_dir.mkdir(exist_ok=True)

# Destination
dest_dir = Path('public/images/products/carpet')
dest_dir.mkdir(parents=True, exist_ok=True)

print('=' * 80)
print('RASPAKIVANJE I PREMEŠTANJE ARMONIA SLIKA')
print('=' * 80)

for zip_file in zip_files:
    zip_path = Path(zip_file)
    
    if not zip_path.exists():
        print(f'\n⚠️  {zip_file} ne postoji, preskačem')
        continue
    
    print(f'\n📦 Raspakovujem: {zip_file}')
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as z:
            # Ekstraktuj sve
            z.extractall(temp_dir)
            print(f'   ✅ Ekstraktovano {len(z.namelist())} fajlova')
            
            # Pronađi glavnu sliku (obično "main" ili "visual" ili "hero")
            files = z.namelist()
            
            # Najčešće je to prva slika ili ona sa "main" u imenu
            main_image = None
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    if 'main' in f.lower() or 'hero' in f.lower() or 'visual' in f.lower():
                        main_image = f
                        break
            
            if not main_image and files:
                # Uzmi prvu sliku
                main_image = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png'))][0] if any(f.lower().endswith(('.jpg', '.jpeg', '.png')) for f in files) else None
            
            if main_image:
                print(f'   🖼️  Glavna slika: {main_image}')
                
                # Kopiraj u dest
                src = temp_dir / main_image
                # Ime fajla će biti prema ZIP-u (ili mogu da koristim kod kolekcije)
                # Za sada, kopiram sa original imenom
                dest = dest_dir / Path(main_image).name
                
                if src.exists():
                    shutil.copy(src, dest)
                    print(f'   ✅ Kopirano u: {dest}')
                    
    except Exception as e:
        print(f'   ❌ Greška: {e}')

# Očisti temp
if temp_dir.exists():
    shutil.rmtree(temp_dir)
    print('\n🗑️  Temp folder očišćen')

print('\n✅ ZAVRŠENO!')
