#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Preuzima dokumente sa Gerflor sajta za svaku kolekciju
"""

import sys
import json
import requests
from pathlib import Path
from urllib.parse import urljoin, urlparse
import time

sys.stdout.reconfigure(encoding='utf-8')

# Create directories
downloads_dir = Path('downloads/gerflor_documents')
downloads_dir.mkdir(parents=True, exist_ok=True)

# Collection URLs (base URLs for collections)
collections = [
    'creation-30',
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

base_url = 'https://www.gerflor-cee.com/products/'

def download_document(collection_slug, doc_url, doc_type='pdf'):
    """Download a document for a collection"""
    try:
        collection_dir = downloads_dir / collection_slug
        collection_dir.mkdir(exist_ok=True)
        
        # Get filename from URL
        filename = urlparse(doc_url).path.split('/')[-1]
        if not filename or '.' not in filename:
            filename = f'{collection_slug}_document.{doc_type}'
        
        file_path = collection_dir / filename
        
        # Skip if already exists
        if file_path.exists():
            print(f'  ⏭️  {filename} već postoji, preskačem')
            return file_path
        
        print(f'  ⬇️  Preuzimam {filename}...')
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(doc_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        with open(file_path, 'wb') as f:
            f.write(response.content)
        
        print(f'  ✅ {filename} preuzet ({len(response.content)} bytes)')
        return file_path
        
    except Exception as e:
        print(f'  ❌ Greška pri preuzimanju {doc_url}: {e}')
        return None

def find_download_links(collection_slug):
    """Find download links on collection page"""
    url = urljoin(base_url, collection_slug)
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        print(f'\n🔍 Pretražujem {collection_slug}...')
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all download links
        download_links = []
        
        # Look for buttons/links with "download" or "Download"
        for link in soup.find_all(['a', 'button']):
            text = link.get_text(strip=True).lower()
            href = link.get('href', '')
            
            if 'download' in text or 'preuzmi' in text or 'dokument' in text:
                if href:
                    full_url = urljoin(url, href)
                    download_links.append(full_url)
                    print(f'    📄 Pronađen: {link.get_text(strip=True)[:50]}')
        
        # Also look for direct PDF links
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            if '.pdf' in href.lower() or 'document' in href.lower():
                full_url = urljoin(url, href)
                if full_url not in download_links:
                    download_links.append(full_url)
        
        return download_links
        
    except Exception as e:
        print(f'  ❌ Greška pri pretrazi {url}: {e}')
        return []

print('🚀 POČETAK PREUZIMANJA DOKUMENATA\n')
print('=' * 80)

total_downloaded = 0

for collection in collections:
    print(f'\n📦 {collection.upper()}')
    print('-' * 80)
    
    links = find_download_links(collection)
    
    if not links:
        print(f'  ⚠️  Nema pronađenih download linkova')
        continue
    
    for link in links:
        downloaded = download_document(collection, link)
        if downloaded:
            total_downloaded += 1
        time.sleep(1)  # Be nice to the server

print(f'\n✅ ZAVRŠENO!')
print(f'📥 Preuzeto: {total_downloaded} dokumenata')
print(f'📁 Lokacija: {downloads_dir}')
