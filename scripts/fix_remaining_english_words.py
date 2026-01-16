#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prevođenje preostalih engleskih reči u opisima
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Extended translation dictionary for remaining words
translations = {
    # Technical terms that should stay but need context
    r'\bstandard\b': 'standard',
    r'\bStandard\b': 'Standard',
    
    # Words that need translation
    r'\bDesign\b': 'Dizajn',
    r'\bdesign\b': 'dizajn',
    r'\bPVC\b': 'PVC',  # Keep as is
    r'\bEN ISO\b': 'EN ISO',  # Keep as is
    r'\bEN 13501\b': 'EN 13501',  # Keep as is
    
    # Common phrases
    r'\bSmart Design\b': 'Smart Dizajn',
    r'\bSmart Komfor\b': 'Smart Komfor',
    r'\binnovation\b': 'inovacija',
    r'\bInnovation\b': 'Inovacija',
    
    # Fix section headers
    r'^Proizvod:\s*Dizajn i proizvod': 'Proizvod:',
    r'^Proizvod:\s*Proizvod:': 'Proizvod:',
    
    # Clean up double headers
    r'Proizvod:\s*\n\s*Proizvod:': 'Proizvod:',
    r'Ugradnja:\s*\n\s*Ugradnja:': 'Ugradnja:',
    r'Primena:\s*\n\s*Primena:': 'Primena:',
    r'Okruženje:\s*\n\s*Okruženje:': 'Okruženje:',
}

def clean_description(desc):
    """Clean and translate description"""
    if not desc:
        return desc
    
    result = desc
    
    # Apply translations
    for pattern, replacement in translations.items():
        result = re.sub(pattern, replacement, result, flags=re.MULTILINE | re.IGNORECASE)
    
    # Remove duplicate "Dizajn i proizvod" after "Proizvod:"
    result = re.sub(r'Proizvod:\s*\n\s*Dizajn i proizvod\s*\n', 'Proizvod:\n', result)
    
    # Clean up multiple newlines
    result = re.sub(r'\n{3,}', '\n\n', result)
    
    # Trim
    result = result.strip()
    
    return result

updated = 0
for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    cleaned = clean_description(desc)
    if cleaned != desc:
        color['description'] = cleaned
        updated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Očišćeno: {updated} opisa')
