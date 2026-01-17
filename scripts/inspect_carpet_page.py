#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Inspektuje HTML carpet stranice da vidim strukturu
"""

import sys
import requests
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://www.gerflor-cee.com/category/carpet'

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

print(f'Preuzimam: {url}\n')
response = requests.get(url, headers=headers, timeout=30)
response.raise_for_status()

soup = BeautifulSoup(response.content, 'html.parser')

# Save HTML
with open('downloads/carpet_page.html', 'w', encoding='utf-8') as f:
    f.write(soup.prettify())

print('✅ HTML sačuvan u downloads/carpet_page.html')

# Find all links
print('\nSvi linkovi:')
links = soup.find_all('a', href=True)
carpet_links = [l for l in links if 'armonia' in l.get('href', '').lower() or 'carpet' in l.get_text(strip=True).lower()]

print(f'Pronađeno {len(carpet_links)} linkova sa "armonia" ili "carpet"\n')

for link in carpet_links[:20]:
    href = link.get('href', '')
    text = link.get_text(strip=True)
    print(f'  - {text[:50]}: {href[:80]}')

# Find product cards/tiles
print('\n\nTražim product cards...')
product_divs = soup.find_all(['div', 'article'], {'class': re.compile(r'product|card|tile|collection', re.I)})
print(f'Pronađeno {len(product_divs)} product divs')

# Find any images
print('\n\nSlike:')
images = soup.find_all('img')
carpet_images = [img for img in images if 'armonia' in img.get('src', '').lower()]
print(f'Pronađeno {len(carpet_images)} slika sa "armonia"')

for img in carpet_images[:10]:
    src = img.get('src', '')
    alt = img.get('alt', '')
    print(f'  - {alt[:50]}: {src[:80]}')
