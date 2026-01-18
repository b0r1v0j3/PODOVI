#!/usr/bin/env python3
import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Check category image
data = json.load(open('lib/data/mock-data.ts', 'r', encoding='utf-8').read().replace('export const categories: Category[] = ', '').replace('];', ']').replace('export ', ''))

# Check if image file exists
img_path = Path('public/images/products/carpet/64941 - JPG 72 dpi-Armonia-540-1796 Oceano.jpg')

if img_path.exists():
    print(f'✅ Slika postoji: {img_path}')
    print(f'   Veličina: {img_path.stat().st_size} bytes')
else:
    print(f'❌ Slika NE postoji: {img_path}')

# List all Oceano images
print('\nSve Oceano slike:')
for img in Path('public/images/products/carpet').glob('*Oceano*'):
    print(f'  {img.name}')
    print(f'  {img.name}')
