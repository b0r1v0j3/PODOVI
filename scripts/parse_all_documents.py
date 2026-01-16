#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parsira SVE dokumente i izvlači podatke za SVE proizvode
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Try to import PDF libraries
try:
    import PyPDF2
    has_pypdf2 = True
except ImportError:
    has_pypdf2 = False

try:
    import pdfplumber
    has_pdfplumber = True
except ImportError:
    has_pdfplumber = False

try:
    from docx import Document
    has_docx = True
except ImportError:
    has_docx = False

try:
    import docx2txt
    has_docx2txt = True
except ImportError:
    has_docx2txt = False

documents_dir = Path('downloads/gerflor_documents')

print('🔍 PREGLED DOKUMENATA\n')
print('=' * 80)

all_extracted = {}

# Process each collection folder
for collection_dir in sorted(documents_dir.iterdir()):
    if not collection_dir.is_dir():
        continue
    
    collection_name = collection_dir.name
    print(f'\n📦 {collection_name.upper()}')
    print('-' * 80)
    
    collection_data = {
        'descriptions': [],
        'specs': [],
        'other': []
    }
    
    # Process all files in collection directory
    for file_path in sorted(collection_dir.iterdir()):
        if not file_path.is_file():
            continue
        
        file_name = file_path.name.lower()
        print(f'\n  📄 {file_path.name}')
        
        try:
            content = None
            
            # Parse PDF
            if file_path.suffix.lower() == '.pdf':
                if has_pdfplumber:
                    with pdfplumber.open(file_path) as pdf:
                        pages_text = []
                        for page in pdf.pages[:5]:  # First 5 pages
                            text = page.extract_text()
                            if text:
                                pages_text.append(text)
                        content = '\n'.join(pages_text)
                elif has_pypdf2:
                    with open(file_path, 'rb') as f:
                        pdf_reader = PyPDF2.PdfReader(f)
                        pages_text = []
                        for page_num in range(min(5, len(pdf_reader.pages))):
                            page = pdf_reader.pages[page_num]
                            text = page.extract_text()
                            if text:
                                pages_text.append(text)
                        content = '\n'.join(pages_text)
            
            # Parse DOCX
            elif file_path.suffix.lower() == '.docx':
                if has_docx:
                    doc = Document(file_path)
                    content = '\n'.join([para.text for para in doc.paragraphs])
                elif has_docx2txt:
                    content = docx2txt.process(str(file_path))
            
            # Parse DOC
            elif file_path.suffix.lower() == '.doc':
                if has_docx2txt:
                    content = docx2txt.process(str(file_path))
            
            if content:
                content = content.strip()
                print(f'    ✅ {len(content)} karaktera')
                
                # Categorize by file name
                if 'product description' in file_name or 'description' in file_name:
                    collection_data['descriptions'].append({
                        'file': file_path.name,
                        'content': content[:2000]  # First 2000 chars
                    })
                elif 'technical' in file_name or 'datasheet' in file_name or 'data sheet' in file_name:
                    collection_data['specs'].append({
                        'file': file_path.name,
                        'content': content[:2000]
                    })
                else:
                    collection_data['other'].append({
                        'file': file_path.name,
                        'content': content[:500]  # First 500 chars
                    })
            else:
                print(f'    ⚠️  Nije moguće parsirati')
                
        except Exception as e:
            print(f'    ❌ Greška: {str(e)[:100]}')
    
    if collection_data['descriptions'] or collection_data['specs']:
        all_extracted[collection_name] = collection_data

# Save all extracted data
output_file = documents_dir.parent / 'all_documents_parsed.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_extracted, f, indent=2, ensure_ascii=False)

print(f'\n✅ ZAVRŠENO!')
print(f'📁 Sačuvano u: {output_file}')
print(f'📊 Ekstraktovano iz {len(all_extracted)} kolekcija')
