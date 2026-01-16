#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prevod engleskih termina u srpski
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

# Rečnik prevoda
translations = {
    # Installation types
    r'\bGlue down\b': 'Lepljenje',
    r'\bglue-down\b': 'lepljenje',
    r'\bLoose lay\b': 'Looselay',
    r'\bloose lay\b': 'looselay',
    r'\bClick sistem\b': 'Click sistem',  # Keep as is
    r'\bclick sistem\b': 'click sistem',
    
    # Technical terms
    r'\bwear-layer\b': 'sloj habanja',
    r'\bwear layer\b': 'sloj habanja',
    r'\bWear layer\b': 'Sloj habanja',
    r'\bwear-layer\b': 'sloj-habanja',
    r'\bthickness\b': 'debljina',
    r'\bThickness\b': 'Debljina',
    r'\boverall thickness\b': 'ukupna debljina',
    r'\bOverall thickness\b': 'Ukupna debljina',
    
    # Acoustic
    r'\bacoustic\b': 'akustični',
    r'\bAcoustic\b': 'Akustični',
    r'\bacoustical\b': 'akustični',
    r'\bacoustics\b': 'akustika',
    
    # Surface treatment
    r'\bcrosslinked\b': 'umreženi',
    r'\bcrosslinked polyurethane\b': 'umreženi poliuretan',
    r'\bpolyurethane\b': 'poliuretan',
    r'\bsurface treatment\b': 'površinska obrada',
    r'\bSurface treatment\b': 'Površinska obrada',
    
    # Installation
    r'\binstallation\b': 'ugradnja',
    r'\bInstallation\b': 'Ugradnja',
    r'\binstalled\b': 'ugrađen',
    
    # Application
    r'\bapplication\b': 'primena',
    r'\bApplication\b': 'Primena',
    
    # Environment
    r'\benvironment\b': 'okruženje',
    r'\bEnvironment\b': 'Okruženje',
    r'\benvironmental\b': 'ekološki',
    r'\bEnvironmental\b': 'Ekološki',
    
    # Product
    r'\bProduct\b': 'Proizvod',
    r'\bproduct\b': 'proizvod',
    r'\bproducts\b': 'proizvodi',
    
    # Design
    r'\bdesign\b': 'dizajn',
    r'\bDesign\b': 'Dizajn',
    
    # Other
    r'\bclassified\b': 'klasifikovano',
    r'\baccording\b': 'prema',
    r'\bstandard\b': 'standard',
    r'\bStandard\b': 'Standard',
    r'\bfeatures\b': 'karakteristike',
    r'\bFeatures\b': 'Karakteristike',
    r'\bavailable\b': 'dostupno',
    r'\bAvailable\b': 'Dostupno',
    r'\bPVC flooring\b': 'PVC podna obloga',
}

def translate_text(text):
    """Translate English terms to Serbian"""
    if not text or not isinstance(text, str):
        return text
    
    result = text
    for pattern, replacement in translations.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    
    return result

print('=' * 100)
print('PREVOD ENGLESKIH TERMINA')
print('=' * 100)

# Load data
lvt_data = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
lvt_colors = lvt_data.get('colors', [])

linoleum_data = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))
linoleum_colors = linoleum_data.get('colors', [])

all_colors = lvt_colors + linoleum_colors

fixed_count = 0

for color in all_colors:
    updated = False
    
    # Fix description
    desc = color.get('description', '')
    if desc:
        new_desc = translate_text(desc)
        if new_desc != desc:
            color['description'] = new_desc
            updated = True
    
    # Fix format
    format_val = color.get('format', '')
    if format_val:
        new_format = translate_text(format_val)
        if new_format != format_val:
            color['format'] = new_format
            updated = True
    
    # Fix characteristics
    if color.get('characteristics'):
        for key, value in color['characteristics'].items():
            if value and isinstance(value, str):
                new_value = translate_text(value)
                if new_value != value:
                    color['characteristics'][key] = new_value
                    updated = True
    
    if updated:
        fixed_count += 1
        if fixed_count <= 10:
            print(f'✅ {color.get("collection", "")} {color.get("code", "")} {color.get("name", "")}')

if fixed_count > 0:
    json.dump(lvt_data, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    json.dump(linoleum_data, open('public/data/linoleum_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print(f'\n✅ Prevedeno: {fixed_count} proizvoda')
else:
    print('\n⚠️  Nema termina za prevod')
