#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Raspakuje SVE slike za Armonia boje (svaki ZIP ima 2 slike)
"""

import sys
import zipfile
import shutil
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Pronađi sve ZIP-ove
zip_files = list(Path('.').glob('product-sku-media-resources-176862*.zip'))

print(f'Pronađeno {len(zip_files)} ZIP fajlova\n')

temp_dir = Path('temp_armonia')
temp_dir.mkdir(exist_ok=True)

dest_dir = Path('public/images/products/carpet')
dest_dir.mkdir(parents=True, exist_ok=True)

# Mapiranje ZIP -> boja (na osnovu redosleda ili imena)
all_images_by_zip = {}

for zip_file in sorted(zip_files):
    try:
        with zipfile.ZipFile(zip_file, 'r') as z:
            # Ekstraktuj sve slike
            images = [f for f in z.namelist() if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            if images:
                print(f'📦 {zip_file.name}: {len(images)} slika')
                
                # Ekstraktuj sve
                for img in images:
                    z.extract(img, temp_dir)
                    src = temp_dir / img
                    dest = dest_dir / Path(img).name
                    
                    if src.exists():
                        shutil.copy(src, dest)
                        print(f'   ✅ {Path(img).name}')
                
                all_images_by_zip[zip_file.name] = [Path(img).name for img in images]
                
    except Exception as e:
        print(f'❌ {zip_file.name}: {e}')

# Očisti temp
if temp_dir.exists():
    shutil.rmtree(temp_dir)

print(f'\n✅ Završeno!')
print(f'📊 Ekstraktovano iz {len(all_images_by_zip)} ZIP-ova')
