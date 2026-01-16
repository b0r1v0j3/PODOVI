#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ekstraktuje podatke o proizvodima iz sample card PDF-ova
Sample cards obično imaju listu svih boja sa kodovima, dimenzijama, formatima
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

# Find all sample card PDFs
for collection_dir in sorted(documents_dir.iterdir()):
    if not collection_dir.is_dir():
        continue
    
    collection_name = collection_dir.name
    collection_name = collection_name.replace('creation-', 'creation-').lower()
    
    # Find sample card
    sample_files = list(collection_dir.glob('*sample*'))
    sample_files.extend(collection_dir.glob('*card*'))
    sample_files.extend(collection_dir.glob('*carte*'))
    
    if not sample_files:
        continue
    
    print(f'📄 {collection_name}: {sample_files[0].name}')
    
    try:
        with pdfplumber.open(sample_files[0]) as pdf:
            updated_this_file = 0
            
            # Extract text from all pages
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue
                
                # Look for tables
                tables = page.extract_tables()
                for table in tables:
                    if not table:
                        continue
                    
                    # Process each row
                    for row_idx, row in enumerate(table):
                        if not row or len(row) < 2:
                            continue
                        
                        # Combine all cells in row
                        row_text = ' '.join([str(cell).strip() if cell else '' for cell in row])
                        
                        # Skip empty rows
                        if len(row_text.strip()) < 5:
                            continue
                        
                        # Extract 4-digit code
                        code_matches = list(re.finditer(r'\b(\d{4})\b', row_text))
                        if not code_matches:
                            continue
                        
                        # Try each code found
                        for code_match in code_matches:
                            code = code_match.group(1)
                            key = f"{code}|{collection_name}"
                            color = by_code_collection.get(key)
                            
                            if not color:
                                continue
                            
                            # Extract dimension (various formats)
                            # Format: "18.4 cm X 121.9 cm" or "18.4x121.9" or "18,4 x 121,9"
                            dim_patterns = [
                                r'(\d+[,.]?\d*)\s*[xX×]\s*(\d+[,.]?\d*)\s*cm',
                                r'(\d+[,.]?\d*)\s*[xX×]\s*(\d+[,.]?\d*)',
                                r'(\d+[,.]?\d*)\s*/\s*(\d+[,.]?\d*)\s*cm',
                            ]
                            
                            for pattern in dim_patterns:
                                dim_match = re.search(pattern, row_text)
                                if dim_match and not color.get('dimension'):
                                    w = dim_match.group(1).replace(',', '.')
                                    l = dim_match.group(2).replace(',', '.')
                                    color['dimension'] = f"{w} cm X {l} cm"
                                    updated_this_file += 1
                                    break
                            
                            # Extract format
                            if not color.get('format'):
                                row_lower = row_text.lower()
                                if 'xl' in row_lower and 'plank' in row_lower:
                                    color['format'] = 'XL Plank'
                                    updated_this_file += 1
                                elif 'plank' in row_lower:
                                    color['format'] = 'Plank'
                                    updated_this_file += 1
                                elif 'xl' in row_lower and ('square' in row_lower or 'tile' in row_lower):
                                    color['format'] = 'XL Square tile'
                                    updated_this_file += 1
                                elif 'rectangular' in row_lower or 'rect' in row_lower:
                                    color['format'] = 'Rectangular tile'
                                    updated_this_file += 1
                                elif 'tile' in row_lower:
                                    color['format'] = 'Tile'
                                    updated_this_file += 1
                            
                            # Extract thickness
                            if not color.get('overall_thickness'):
                                # Look for thickness patterns
                                thick_patterns = [
                                    r'(\d+[,.]?\d*)\s*mm',
                                    r'thickness[:\s]+(\d+[,.]?\d*)\s*mm',
                                    r'(\d+[,.]?\d*)\s*mm.*thick',
                                ]
                                
                                for pattern in thick_patterns:
                                    thick_match = re.search(pattern, row_text, re.IGNORECASE)
                                    if thick_match:
                                        # Check if it's a reasonable thickness (1-10mm)
                                        thickness_val = float(thick_match.group(1).replace(',', '.'))
                                        if 1.0 <= thickness_val <= 10.0:
                                            color['overall_thickness'] = f"{thick_match.group(1).replace(',', '.')} mm"
                                            updated_this_file += 1
                                            break
                            
                            # If we found this color, move to next row
                            break
                
                # Also parse plain text for code patterns
                # Pattern: "Code 0347" or "0347 BALLERINA" or similar
                code_pattern = r'\b(\d{4})\b[:\s]+([A-Z][A-Z\s]+?)(?:\n|$)'
                for match in re.finditer(code_pattern, text, re.MULTILINE):
                    code = match.group(1)
                    name_part = match.group(2).strip()[:50]
                    
                    key = f"{code}|{collection_name}"
                    color = by_code_collection.get(key)
                    
                    if not color:
                        continue
                    
                    # Look for specs near this code
                    context_start = max(0, match.start() - 200)
                    context_end = min(len(text), match.end() + 200)
                    context = text[context_start:context_end]
                    
                    # Extract dimension from context
                    if not color.get('dimension'):
                        dim_match = re.search(r'(\d+[,.]?\d*)\s*[xX×]\s*(\d+[,.]?\d*)\s*cm', context)
                        if dim_match:
                            w = dim_match.group(1).replace(',', '.')
                            l = dim_match.group(2).replace(',', '.')
                            color['dimension'] = f"{w} cm X {l} cm"
                            updated_this_file += 1
                    
                    # Extract format from context
                    if not color.get('format'):
                        context_lower = context.lower()
                        if 'xl' in context_lower and 'plank' in context_lower:
                            color['format'] = 'XL Plank'
                            updated_this_file += 1
                        elif 'plank' in context_lower:
                            color['format'] = 'Plank'
                            updated_this_file += 1
                    
                    # Extract thickness from context
                    if not color.get('overall_thickness'):
                        thick_match = re.search(r'(\d+[,.]?\d*)\s*mm', context)
                        if thick_match:
                            thickness_val = float(thick_match.group(1).replace(',', '.'))
                            if 1.0 <= thickness_val <= 10.0:
                                color['overall_thickness'] = f"{thick_match.group(1).replace(',', '.')} mm"
                                updated_this_file += 1
            
            if updated_this_file > 0:
                print(f'  ✅ +{updated_this_file} podataka')
                total_updated += updated_this_file
            else:
                print(f'  ⚠️  Nema podataka')
                    
    except Exception as e:
        print(f'  ❌ Greška: {e}')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ ZAVRŠENO!')
print(f'📊 Ukupno ažurirano: {total_updated} podataka')
