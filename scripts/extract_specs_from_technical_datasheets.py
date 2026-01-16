#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ekstraktuje specifične podatke (dimension, format, thickness) iz technical datasheet PDF-ova
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

try:
    import pdfplumber
except ImportError:
    print('❌ pdfplumber nije instaliran')
    sys.exit(1)

documents_dir = Path('downloads/gerflor_documents')
complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Build index by code -> collection -> color
by_code_collection = {}
for c in colors:
    code = c.get('code', '').strip()
    collection = c.get('collection', '').strip()
    if code and collection:
        key = f"{code}|{collection}"
        by_code_collection[key] = c

print(f'Index: {len(by_code_collection)} boja\n')

total_updated = 0

# Find all technical datasheet PDFs
for collection_dir in sorted(documents_dir.iterdir()):
    if not collection_dir.is_dir():
        continue
    
    collection_name = collection_dir.name
    collection_name = collection_name.replace('creation-', 'creation-').lower()
    
    # Find technical datasheet
    technical_files = list(collection_dir.glob('*technical*'))
    technical_files.extend(collection_dir.glob('*datasheet*'))
    technical_files.extend(collection_dir.glob('*data sheet*'))
    
    if not technical_files:
        continue
    
    print(f'📄 {collection_name}: {technical_files[0].name}')
    
    try:
        with pdfplumber.open(technical_files[0]) as pdf:
            # Extract text from all pages
            full_text = ''
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + '\n'
            
            # Look for tables with specs
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table:
                        continue
                    
                    # Look for rows with dimension, format, thickness
                    for row in table:
                        if not row or len(row) < 2:
                            continue
                        
                        row_text = ' '.join([str(cell) if cell else '' for cell in row]).lower()
                        
                        # Try to extract code
                        code_match = re.search(r'\b(\d{4})\b', row_text)
                        if not code_match:
                            continue
                        
                        code = code_match.group(1)
                        key = f"{code}|{collection_name}"
                        color = by_code_collection.get(key)
                        
                        if not color:
                            continue
                        
                        # Extract dimension
                        dim_match = re.search(r'(\d+[,.]?\d*)\s*[xX×]\s*(\d+[,.]?\d*)\s*cm', row_text)
                        if dim_match and not color.get('dimension'):
                            dim = f"{dim_match.group(1).replace(',', '.')} cm X {dim_match.group(2).replace(',', '.')} cm"
                            color['dimension'] = dim
                            total_updated += 1
                        
                        # Extract format
                        if 'plank' in row_text and not color.get('format'):
                            if 'xl' in row_text:
                                color['format'] = 'XL Plank'
                            else:
                                color['format'] = 'Plank'
                            total_updated += 1
                        elif 'tile' in row_text and not color.get('format'):
                            if 'square' in row_text or 'xl square' in row_text:
                                color['format'] = 'XL Square tile'
                            elif 'rectangular' in row_text:
                                color['format'] = 'Rectangular tile'
                            else:
                                color['format'] = 'Tile'
                            total_updated += 1
                        
                        # Extract thickness
                        thick_match = re.search(r'(\d+[,.]?\d*)\s*mm', row_text)
                        if thick_match and 'thickness' in row_text and not color.get('overall_thickness'):
                            color['overall_thickness'] = f"{thick_match.group(1).replace(',', '.')} mm"
                            total_updated += 1
            
            # Also parse full text for specs
            # Look for patterns like "Code 0347: 18.4 cm X 121.9 cm, XL Plank, 2.00 mm"
            specs_patterns = re.finditer(r'(\d{4})[:\s]+([^,\n]+)', full_text)
            for match in specs_patterns:
                code = match.group(1)
                specs_text = match.group(2)
                
                key = f"{code}|{collection_name}"
                color = by_code_collection.get(key)
                
                if not color:
                    continue
                
                # Extract dimension
                dim_match = re.search(r'(\d+[,.]?\d*)\s*[xX×]\s*(\d+[,.]?\d*)\s*cm', specs_text)
                if dim_match and not color.get('dimension'):
                    dim = f"{dim_match.group(1).replace(',', '.')} cm X {dim_match.group(2).replace(',', '.')} cm"
                    color['dimension'] = dim
                    total_updated += 1
                
                # Extract format
                if 'plank' in specs_text.lower() and not color.get('format'):
                    if 'xl' in specs_text.lower():
                        color['format'] = 'XL Plank'
                    else:
                        color['format'] = 'Plank'
                    total_updated += 1
                elif 'tile' in specs_text.lower() and not color.get('format'):
                    if 'square' in specs_text.lower():
                        color['format'] = 'XL Square tile'
                    elif 'rectangular' in specs_text.lower():
                        color['format'] = 'Rectangular tile'
                    else:
                        color['format'] = 'Tile'
                    total_updated += 1
                
                # Extract thickness
                thick_match = re.search(r'(\d+[,.]?\d*)\s*mm', specs_text)
                if thick_match and not color.get('overall_thickness'):
                    color['overall_thickness'] = f"{thick_match.group(1).replace(',', '.')} mm"
                    total_updated += 1
                    
    except Exception as e:
        print(f'  ❌ Greška: {e}')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ ZAVRŠENO!')
print(f'📊 Ažurirano: {total_updated} podataka')
