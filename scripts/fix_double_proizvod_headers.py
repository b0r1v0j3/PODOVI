#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fiksira duplirane "Proizvod:" heаdere u opisima
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

def fix_double_headers(desc):
    """Fix double section headers"""
    if not desc:
        return desc
    
    result = desc
    
    # Fix double "Proizvod:"
    result = re.sub(r'Proizvod:\s*\n\s*Proizvod:', 'Proizvod:', result)
    result = re.sub(r'Ugradnja:\s*\n\s*Ugradnja:', 'Ugradnja:', result)
    result = re.sub(r'Primena:\s*\n\s*Primena:', 'Primena:', result)
    result = re.sub(r'Okruženje:\s*\n\s*Okruženje:', 'Okruženje:', result)
    
    # Fix "Proizvod:\n\nProizvod:"
    result = re.sub(r'Proizvod:\s*\n\s*\n\s*Proizvod:', 'Proizvod:', result)
    
    # Clean up multiple newlines
    result = re.sub(r'\n{3,}', '\n\n', result)
    
    return result.strip()

updated = 0
for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    fixed = fix_double_headers(desc)
    if fixed != desc:
        color['description'] = fixed
        updated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Popravljeno: {updated} opisa sa dupliranim hederima')
