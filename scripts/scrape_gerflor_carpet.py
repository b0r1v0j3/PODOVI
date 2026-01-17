#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Scrape-uje sve tekstilne ploče (carpet) sa Gerflor sajta
"""

import sys
import json
import requests
from bs4 import BeautifulSoup
import time
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

print('=' * 100)
print('SCRAPING GERFLOR CARPET (TEKSTILNE PLOČE)')
print('=' * 100)

base_url = 'https://www.gerflor-cee.com'
category_url = f'{base_url}/category/carpet'

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

# Get category page
print(f'\n📥 Preuzimam: {category_url}')
response = requests.get(category_url, headers=headers, timeout=30)
response.raise_for_status()

soup = BeautifulSoup(response.content, 'html.parser')

# Find all product/collection links
collections = []
product_links = soup.find_all('a', href=True)

for link in product_links:
    href = link.get('href', '')
    if '/products/' in href and 'carpet' in href.lower():
        full_url = href if href.startswith('http') else base_url + href
        
        # Extract name
        name = link.get_text(strip=True)
        
        if name and full_url not in [c['url'] for c in collections]:
            collections.append({
                'url': full_url,
                'name': name,
                'slug': href.split('/')[-1] if '/' in href else href
            })

print(f'\n✅ Pronađeno {len(collections)} kolekcija/proizvoda')

# Extract each collection
all_carpet_data = {
    'total_collections': len(collections),
    'collections': []
}

for idx, coll in enumerate(collections[:10], 1):  # First 10 for testing
    print(f'\n[{idx}/{len(collections)}] 📦 {coll["name"]}')
    print(f'   URL: {coll["url"]}')
    
    try:
        time.sleep(1)  # Be nice
        response = requests.get(coll['url'], headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract description
        description = ''
        desc_div = soup.find('div', {'class': re.compile(r'description|product-description', re.I)})
        if desc_div:
            description = desc_div.get_text(strip=True)
        
        # Extract specs
        specs = {}
        spec_tables = soup.find_all('table')
        for table in spec_tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    key = cells[0].get_text(strip=True)
                    value = cells[1].get_text(strip=True)
                    if key and value:
                        specs[key] = value
        
        # Extract colors
        colors = []
        color_divs = soup.find_all(['div', 'a'], {'class': re.compile(r'color|swatch', re.I)})
        for color_div in color_divs:
            color_name = color_div.get('title') or color_div.get('alt') or color_div.get_text(strip=True)
            color_img = color_div.find('img')
            color_img_url = color_img.get('src') if color_img else None
            
            if color_name:
                colors.append({
                    'name': color_name,
                    'image_url': color_img_url
                })
        
        all_carpet_data['collections'].append({
            'name': coll['name'],
            'slug': coll['slug'],
            'url': coll['url'],
            'description': description[:500],
            'specs': specs,
            'colors_count': len(colors),
            'colors': colors[:50]  # First 50 colors
        })
        
        print(f'   ✅ Ekstraktovano: {len(colors)} boja, {len(specs)} specs')
        
    except Exception as e:
        print(f'   ❌ Greška: {e}')

# Save
output_file = Path('downloads/carpet_data.json')
output_file.parent.mkdir(exist_ok=True)

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_carpet_data, f, indent=2, ensure_ascii=False)

print(f'\n✅ ZAVRŠENO!')
print(f'📁 Sačuvano u: {output_file}')
print(f'📊 Ekstraktovano {len(all_carpet_data["collections"])} kolekcija')
