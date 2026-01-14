# -*- coding: utf-8 -*-
"""
Scrape Gerflor website to find product codes for Unknown products
"""
import json
import sys
import re
import time
from pathlib import Path
from urllib.parse import urljoin, quote
import requests
from bs4 import BeautifulSoup

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Gerflor CEE website base URL
GERFLOR_BASE = "https://www.gerflor-cee.com"
GERFLOR_PRODUCTS = f"{GERFLOR_BASE}/products/creation-40-clic"

json_path = Path('public/data/lvt_colors_complete.json')
base_images_path = Path('public/images/products/lvt/colors/creation-40-clic')

# Load JSON
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print("🔍 Skeniram Gerflor sajt za Creation 40 Clic proizvode...\n")

# Find Unknown products in creation-40-clic
unknown_colors = [c for c in data['colors'] if c['collection'] == 'creation-40-clic' and c.get('code') == 'Unknown']
print(f"Pronađeno {len(unknown_colors)} Unknown proizvoda u creation-40-clic\n")

# Get Unknown folder names
unknown_folders = []
if base_images_path.exists():
    for folder in base_images_path.iterdir():
        if folder.is_dir() and folder.name.startswith('Unknown-'):
            color_name = folder.name.replace('Unknown-', '').replace('-', ' ').upper()
            unknown_folders.append({
                'folder': folder.name,
                'name': color_name
            })

print(f"Pronađeno {len(unknown_folders)} Unknown foldera:\n")
for uf in unknown_folders:
    print(f"  - {uf['folder']} -> {uf['name']}")

# Try to scrape Gerflor site
try:
    print(f"\n🌐 Pristupam {GERFLOR_PRODUCTS}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    response = requests.get(GERFLOR_PRODUCTS, headers=headers, timeout=10)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Try to find product listings
    # Look for product cards, links, or any elements containing color names and codes
    products = []
    
    # Method 1: Look for product links or cards
    product_links = soup.find_all('a', href=re.compile(r'creation-40-clic', re.I))
    for link in product_links:
        text = link.get_text(strip=True)
        # Try to extract code and name
        match = re.search(r'(\d{4})\s+([A-Z\s]+)', text)
        if match:
            code = match.group(1)
            name = match.group(2).strip()
            products.append({'code': code, 'name': name.upper()})
    
    # Method 2: Look for any text patterns with 4-digit codes
    text_content = soup.get_text()
    code_pattern = re.compile(r'(\d{4})\s+([A-Z][A-Z\s]{3,})')
    matches = code_pattern.findall(text_content)
    for code, name in matches:
        name_clean = name.strip().upper()
        if len(name_clean) > 3:  # Filter out short matches
            products.append({'code': code, 'name': name_clean})
    
    print(f"\n✅ Pronađeno {len(products)} proizvoda na sajtu")
    
    # Match Unknown folders with found products
    matches = []
    for uf in unknown_folders:
        folder_name = uf['name']
        # Try to find matching product
        for product in products:
            # Check if product name matches folder name (fuzzy match)
            if folder_name in product['name'] or product['name'] in folder_name:
                matches.append({
                    'folder': uf['folder'],
                    'old_name': folder_name,
                    'code': product['code'],
                    'name': product['name']
                })
                print(f"✅ Match: {uf['folder']} -> {product['code']} {product['name']}")
                break
    
    if matches:
        print(f"\n📝 Ažuriranje JSON-a sa {len(matches)} pronađenim šiframa...")
        
        # Update JSON
        for match in matches:
            folder_name = match['folder']
            new_code = match['code']
            new_name = match['name']
            
            # Find and update color in JSON
            for color in data['colors']:
                if (color['collection'] == 'creation-40-clic' and 
                    color.get('code') == 'Unknown' and
                    folder_name.replace('Unknown-', '').replace('-', ' ').upper() in color.get('name', '').upper()):
                    color['code'] = new_code
                    color['name'] = new_name
                    color['full_name'] = f"{new_code} {new_name}"
                    print(f"  ✅ Ažuriran: {color.get('name')} -> {new_code} {new_name}")
                    break
        
        # Save updated JSON
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\n✅ JSON ažuriran sa {len(matches)} šiframa")
    else:
        print("\n⚠️  Nisu pronađeni match-evi. Možda treba ručno proveriti.")
        
        # Print found products for manual matching
        print("\nPronađeni proizvodi na Gerflor sajtu:")
        for p in products[:20]:  # Show first 20
            print(f"  {p['code']} {p['name']}")
    
except requests.RequestException as e:
    print(f"\n❌ Greška pri pristupanju Gerflor sajtu: {e}")
    print("\n💡 Predlog: Ručno proveri Gerflor sajt i ažuriraj šifre u JSON-u")
except Exception as e:
    print(f"\n❌ Greška: {e}")
    import traceback
    traceback.print_exc()
