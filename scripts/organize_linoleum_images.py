#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Raspakovaj ZIP fajlove i organizuj slike za linoleum
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json
import zipfile
import shutil
from pathlib import Path
import re

print("="*80)
print("ORGANIZOVANJE LINOLEUM SLIKA")
print("="*80)

# Load clean data
with open('scripts/gerflor_linoleum_clean.json', encoding='utf-8') as f:
    data = json.load(f)

collections = data['collections']
colors = data['colors']

# Setup folders
zip_folder = Path("downloads/linoleum_final")
output_folder = Path("public/images/products/linoleum")
output_folder.mkdir(parents=True, exist_ok=True)

print(f"\nZIP folder: {zip_folder}")
print(f"Output folder: {output_folder}")
print(f"\nKolekcije: {len(collections)}")
print(f"Boje: {len(colors)}")

# Get all ZIP files
zip_files = sorted(list(zip_folder.glob("*.zip")))
print(f"\nZIP fajlova: {len(zip_files)}")

# Create mapping: URL -> ZIP file (by timestamp)
print("\n" + "="*80)
print("RASPAKIVANJE I ORGANIZOVANJE")
print("="*80)

processed_count = 0

# Process collections
print("\n1. KOLEKCIJE:")
for coll_idx, collection in enumerate(collections, 1):
    slug = collection['slug']
    print(f"\n[{coll_idx}/15] {collection['name']}")
    
    # Create folder for collection
    coll_folder = output_folder / slug
    coll_folder.mkdir(exist_ok=True)
    
    # Find corresponding ZIP (first few ZIPs are for collections)
    if coll_idx - 1 < len(zip_files):
        zip_file = zip_files[coll_idx - 1]
        
        try:
            with zipfile.ZipFile(zip_file, 'r') as zf:
                # Extract all files
                file_list = zf.namelist()
                print(f"  ZIP: {zip_file.name} ({len(file_list)} fajlova)")
                
                for file_name in file_list:
                    if file_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                        # Extract to collection folder
                        zf.extract(file_name, coll_folder)
                        print(f"    ✓ {file_name}")
                        processed_count += 1
        
        except Exception as e:
            print(f"  ✗ Greška: {e}")

# Process colors
print("\n2. BOJE:")
color_zip_start_idx = 15  # First 15 ZIPs are for collections

for color_idx, color in enumerate(colors, 1):
    if not color.get('code'):
        continue  # Skip colors without code
    
    collection_slug = ""
    
    # Find collection slug
    for coll in collections:
        if color['url'] in coll.get('colors', []) or color.get('collection') == coll['name']:
            collection_slug = coll['slug']
            break
    
    # If no collection found, try to extract from URL
    if not collection_slug:
        url_parts = color['url'].split('/')[-1].split('-')
        if len(url_parts) >= 3:
            collection_slug = '-'.join(url_parts[:3])
    
    if not collection_slug:
        print(f"  ⚠️  [{color_idx}] {color['code']} - ne mogu da nadjem kolekciju")
        continue
    
    # Create color folder
    color_slug = f"{color['code']}-{color['name'].lower().replace(' ', '-')}"
    color_folder = output_folder / collection_slug / color_slug
    color_folder.mkdir(parents=True, exist_ok=True)
    
    # Find corresponding ZIP
    zip_idx = color_zip_start_idx + color_idx - 1
    if zip_idx < len(zip_files):
        zip_file = zip_files[zip_idx]
        
        try:
            with zipfile.ZipFile(zip_file, 'r') as zf:
                file_list = zf.namelist()
                
                for file_name in file_list:
                    if file_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                        zf.extract(file_name, color_folder)
                        processed_count += 1
            
            if color_idx % 20 == 0:
                print(f"  [{color_idx}/203] {color['code']} {color['name'][:20]:.<20} ✓")
        
        except Exception as e:
            if color_idx % 20 == 0:
                print(f"  [{color_idx}/203] {color['code']} - Greška: {e}")

print("\n" + "="*80)
print("GOTOVO!")
print("="*80)
print(f"Procesuirano slika: {processed_count}")
print(f"Output folder: {output_folder}")
