#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import requests
from bs4 import BeautifulSoup
import re

sys.stdout.reconfigure(encoding='utf-8')

def extract_specs_from_html(url):
    """Ekstraktuje specs direktno iz HTML-a"""
    print(f"Fetching {url}...")
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        specs = {}
        
        # Desired fields
        desired_fields = ['NCS', 'LRV', 'UNIT/BOX', 'WEIGHT', 'TOTAL WEIGHT', 'PACKAGING']
        
        # Re-scan elements for these specific fields if not already found
        spec_elements = soup.find_all(['div', 'span', 'p', 'li', 'td'])
        for elem in spec_elements:
            text = elem.get_text(strip=True)
            if ':' in text:
                parts = text.split(':', 1)
                key = parts[0].strip().upper()
                value = parts[1].strip()
                
                if any(field in key for field in desired_fields):
                    # Clean up keys
                    if 'UNIT/BOX' in key:
                        specs['PACKAGING'] = f"{value} kom/kutija"
                    elif 'WEIGHT' in key:
                        specs['WEIGHT'] = value
                    else:
                        specs[key] = value

        print(f"Specs found: {specs}")
        return specs
        
    except Exception as e:
        print(f"Error: {e}")
        return {}

# Test on 0347 BALLERINA
url = "https://www.gerflor-cee.com/products/creation-30-new-collection-0347-ballerina-41870347"
extract_specs_from_html(url)
