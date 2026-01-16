#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ekstraktuje strukturirane opise iz "product description" dokumenata
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Try to import libraries for parsing docx/doc files
try:
    from docx import Document
    has_docx = True
except ImportError:
    print('⚠️  python-docx nije instaliran. Instaliraj: pip install python-docx')
    has_docx = False

try:
    import docx2txt
    has_docx2txt = True
except ImportError:
    has_docx2txt = False

documents_dir = Path('downloads/gerflor_documents')

# Find all product description files
product_desc_files = list(documents_dir.glob('**/*product description*'))
product_desc_files.extend(documents_dir.glob('**/*Product Description*'))
product_desc_files.extend(documents_dir.glob('**/*PRODUCT DESCRIPTION*'))

print(f'Pronađeno {len(product_desc_files)} "product description" fajlova\n')

extracted_descriptions = {}

for file_path in product_desc_files:
    collection_dir = file_path.parent.name
    print(f'📄 {collection_dir} / {file_path.name}')
    
    try:
        if file_path.suffix.lower() == '.docx':
            if has_docx:
                doc = Document(file_path)
                text_content = []
                for para in doc.paragraphs:
                    text_content.append(para.text)
                content = '\n'.join(text_content)
            elif has_docx2txt:
                content = docx2txt.process(str(file_path))
            else:
                print(f'  ⚠️  Nema biblioteka za parsiranje DOCX')
                continue
        elif file_path.suffix.lower() == '.doc':
            # For .doc files, try docx2txt or fallback
            if has_docx2txt:
                content = docx2txt.process(str(file_path))
            else:
                print(f'  ⚠️  Nema biblioteka za parsiranje DOC')
                continue
        else:
            print(f'  ⚠️  Nepoznat tip fajla: {file_path.suffix}')
            continue
        
        # Clean up content
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        content = '\n'.join(lines)
        
        if content:
            extracted_descriptions[collection_dir] = content
            print(f'  ✅ Ekstraktovano {len(content)} karaktera')
        else:
            print(f'  ⚠️  Prazan sadržaj')
            
    except Exception as e:
        print(f'  ❌ Greška: {e}')

# Save extracted descriptions
output_file = documents_dir.parent / 'extracted_product_descriptions.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(extracted_descriptions, f, indent=2, ensure_ascii=False)

print(f'\n✅ Ekstraktovano {len(extracted_descriptions)} opisa')
print(f'📁 Sačuvano u: {output_file}')
