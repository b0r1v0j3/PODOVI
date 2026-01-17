#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ciljano preuzimanje slika i dokumenata za Armonia proizvode
"""

import os
import sys
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import urljoin

sys.stdout.reconfigure(encoding='utf-8')

products = [
    {
        'name': 'Armonia 400',
        'url': 'https://www.gerflor-cee.com/products/armonia-400',
        'slug': 'gerflor-armonia-400',
        'folder': 'armonia-400'
    },
    {
        'name': 'Armonia 540',
        'url': 'https://www.gerflor-cee.com/products/armonia-540',
        'slug': 'gerflor-armonia-540',
        'folder': 'armonia-540'
    },
    {
        'name': 'Armonia 620',
        'url': 'https://www.gerflor-cee.com/products/armonia-620',
        'slug': 'gerflor-armonia-620',
        'folder': 'armonia-620'
    }
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,sr;q=0.8',
}

# Base directories
images_base = Path('public/images/products/carpet')
docs_base = Path('public/documents/carpet')

images_base.mkdir(parents=True, exist_ok=True)
docs_base.mkdir(parents=True, exist_ok=True)

print('=' * 80)
print('PREUZIMANJE ARMONIA RESURSA')
print('=' * 80)

for product in products:
    print(f'\n📦 {product["name"]}...')
    print(f'   URL: {product["url"]}')
    
    try:
        response = requests.get(product['url'], headers=headers, timeout=30)
        
        if response.status_code != 200:
            print(f'   ❌ Greška: HTTP {response.status_code}')
            # Try alternative URL pattern if needed (sometimes collections are under different path)
            continue
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 1. FIND MAIN IMAGE
        # Look for og:image or main product image
        img_url = None
        og_image = soup.find('meta', property='og:image')
        if og_image:
            img_url = og_image.get('content')
        
        if not img_url:
            # Try finding main slider image
            slider_img = soup.find('img', {'class': re.compile(r'main|product|slider', re.I)})
            if slider_img:
                img_url = slider_img.get('src')
                if img_url and not img_url.startswith('http'):
                    img_url = urljoin(product['url'], img_url)
        
        if img_url:
            print(f'   🖼️  Slika pronađena: {img_url}')
            
            # Download image
            try:
                img_response = requests.get(img_url, headers=headers, timeout=30)
                if img_response.status_code == 200:
                    ext = img_url.split('.')[-1].split('?')[0]
                    if ext.lower() not in ['jpg', 'jpeg', 'png', 'webp']:
                        ext = 'jpg'
                    
                    filename = f"{product['slug']}.{ext}"
                    save_path = images_base / filename
                    
                    with open(save_path, 'wb') as f:
                        f.write(img_response.content)
                    print(f'   ✅ Sačuvana slika: {save_path}')
                else:
                    print(f'   ❌ Neuspešno preuzimanje slike')
            except Exception as e:
                print(f'   ❌ Greška pri preuzimanju slike: {e}')
        else:
            print('   ⚠️  Slika nije pronađena')

        # 2. FIND DOCUMENTS (Technical datasheet)
        # Look for links containing "technical" or "datasheet" or "fiche"
        doc_links = soup.find_all('a', href=True)
        tech_doc_url = None
        
        for link in doc_links:
            href = link.get('href', '')
            text = link.get_text(strip=True).lower()
            
            if ('.pdf' in href) and ('technical' in text or 'datasheet' in text or 'technique' in text or 'data sheet' in text):
                tech_doc_url = href
                if not tech_doc_url.startswith('http'):
                    tech_doc_url = urljoin(product['url'], tech_doc_url)
                break
        
        if tech_doc_url:
            print(f'   📄 Dokument pronađen: {tech_doc_url}')
            
            # Download document
            try:
                doc_response = requests.get(tech_doc_url, headers=headers, timeout=30)
                if doc_response.status_code == 200:
                    filename = f"{product['slug']}-technical-datasheet.pdf"
                    save_path = docs_base / filename
                    
                    with open(save_path, 'wb') as f:
                        f.write(doc_response.content)
                    print(f'   ✅ Sačuvan dokument: {save_path}')
                else:
                    print(f'   ❌ Neuspešno preuzimanje dokumenta')
            except Exception as e:
                print(f'   ❌ Greška pri preuzimanju dokumenta: {e}')
        else:
            print('   ⚠️  Dokument nije pronađen')
            
    except Exception as e:
        print(f'   ❌ Greška pri pristupu stranici: {e}')

print('\n✅ ZAVRŠENO')
