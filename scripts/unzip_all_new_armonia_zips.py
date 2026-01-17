#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Raspakuje SVE nove ZIP fajlove za Armonia boje
"""

import sys
import zipfile
import shutil
from pathlib import Path
import re

sys.stdout.reconfigure(encoding='utf-8')

# Pronađi sve ZIP-ove
zip_files = list(Path('.').glob('product-sku-media-resources-176862*.zip'))

print(f'Pronađeno {len(zip_files)} ZIP fajlova\n')

temp_dir = Path('temp_extract')
temp_dir.mkdir(exist_ok=True)

dest_dir = Path('public/images/products/carpet')
dest_dir.mkdir(parents=True, exist_ok=True)

extracted = 0

for zip_file in sorted(zip_files):
    try:
        with zipfile.ZipFile(zip_file, 'r') as z:
            files = z.namelist()
            
            # Pronađi glavnu sliku
            main_img = None
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    # Uzmi prvu sliku ili onu sa specifičnim imenom
                    if not main_img:
                        main_img = f
                    if 'color' in f.lower() or 'scan' in f.lower():
                        main_img = f
                        break
            
            if main_img:
                # Ekstraktuj
                z.extract(main_img, temp_dir)
                
                # Kopiraj u dest
                src = temp_dir / main_img
                dest = dest_dir / Path(main_img).name
                
                if src.exists():
                    shutil.copy(src, dest)
                    extracted += 1
                    print(f'✅ {Path(main_img).name}')
                    
    except Exception as e:
        print(f'❌ Greška sa {zip_file.name}: {e}')

# Očisti
if temp_dir.exists():
    shutil.rmtree(temp_dir)

print(f'\n✅ Ekstraktovano {extracted} slika')
