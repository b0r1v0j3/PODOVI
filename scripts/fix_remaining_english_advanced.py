#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Napredni prevod preostalih engleskih termina
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

# Prošireni rečnik
translations = {
    # Phrases
    r'\b(?:the|a|an)\s+': '',  # Remove articles
    r'\bfor\b': 'za',
    r'\bwith\b': 'sa',
    r'\bfrom\b': 'od',
    r'\band\b': 'i',
    r'\bor\b': 'ili',
    
    # Technical
    r'\bclass\b': 'klasa',
    r'\bClass\b': 'Klasa',
    r'\bclassification\b': 'klasifikacija',
    r'\bclassified\b': 'klasifikovano',
    r'\baccording\s+to\b': 'prema',
    r'\bstandard\b': 'standard',
    r'\bStandard\b': 'Standard',
    r'\bEN\s+ISO\b': 'EN ISO',
    r'\bEN\s+ISO\s+(\d+)': r'EN ISO \1',
    
    # Measurements
    r'\bmm\b': 'mm',
    r'\bcm\b': 'cm',
    r'\bm\b': 'm',
    r'\bmm²\b': 'mm²',
    r'\bm²\b': 'm²',
    r'\bX\b': 'X',
    
    # Features
    r'\bfeatures?\b': 'karakteristike',
    r'\bFeatures?\b': 'Karakteristike',
    r'\bfeature\b': 'karakteristika',
    
    # Quality
    r'\bquality\b': 'kvalitet',
    r'\bQuality\b': 'Kvalitet',
    r'\bhigh\s+quality\b': 'visok kvalitet',
    
    # Material
    r'\bmaterial\b': 'materijal',
    r'\bMaterial\b': 'Materijal',
    r'\bmaterials\b': 'materijali',
    
    # Performance
    r'\bperformance\b': 'performanse',
    r'\bPerformance\b': 'Performanse',
    r'\bperformances\b': 'performanse',
    
    # Resistance
    r'\bresistance\b': 'otpornost',
    r'\bResistance\b': 'Otpornost',
    r'\bwear\s+resistance\b': 'otpornost na habanje',
    r'\bimpact\s+resistance\b': 'otpornost na udarce',
    
    # Flooring
    r'\bflooring\b': 'podna obloga',
    r'\bFlooring\b': 'Podna obloga',
    r'\bfloor\s+covering\b': 'podna obloga',
    
    # Installation
    r'\binstallation\s+system\b': 'sistem ugradnje',
    r'\binstallation\s+method\b': 'način ugradnje',
    r'\binstalled\b': 'ugrađen',
    r'\binstalling\b': 'ugradnja',
    
    # Surface
    r'\bsurface\s+finish\b': 'površinski završetak',
    r'\bsurface\s+treatment\b': 'površinska obrada',
    r'\bSurface\s+finish\b': 'Površinski završetak',
    
    # Acoustic
    r'\bacoustic\s+insulation\b': 'akustična izolacija',
    r'\bacoustic\s+performance\b': 'akustične performanse',
    r'\bsound\s+reduction\b': 'smanjenje buke',
    r'\bnoise\s+reduction\b': 'smanjenje buke',
    r'\bimpact\s+sound\b': 'zvučna izolacija',
    
    # Fire
    r'\bfire\s+rating\b': 'protivpožarna klasifikacija',
    r'\bfire\s+class\b': 'protivpožarna klasa',
    r'\bfire\s+resistance\b': 'protivpožarna otpornost',
    
    # Environmental
    r'\benvironmental\s+impact\b': 'ekološki uticaj',
    r'\brecyclable\b': 'reciklabilno',
    r'\bRecyclable\b': 'Reciklabilno',
    r'\brecycled\s+content\b': 'recikliranog sadržaja',
    r'\bVOC\b': 'VOC',
    r'\bTVOC\b': 'TVOC',
    r'\bCO2\b': 'CO2',
    
    # Dimensions
    r'\bthickness\b': 'debljina',
    r'\bThickness\b': 'Debljina',
    r'\bwidth\b': 'širina',
    r'\bWidth\b': 'Širina',
    r'\blength\b': 'dužina',
    r'\bLength\b': 'Dužina',
    r'\bdimension\b': 'dimenzije',
    r'\bDimension\b': 'Dimenzije',
    r'\bdimensions\b': 'dimenzije',
    
    # Format
    r'\bformat\b': 'format',
    r'\bFormat\b': 'Format',
    r'\bformats\b': 'formati',
    r'\bplank\b': 'ploča',
    r'\bPlank\b': 'Ploča',
    r'\bplanks\b': 'ploče',
    r'\btile\b': 'pločica',
    r'\bTile\b': 'Pločica',
    r'\btiles\b': 'pločice',
    
    # Common words in context
    r'\bsuitable\b': 'pogodan',
    r'\bSuitable\b': 'Pogodan',
    r'\bideal\b': 'idealno',
    r'\bIdeal\b': 'Idealno',
    r'\bperfect\b': 'savršeno',
    r'\bPerfect\b': 'Savršeno',
    r'\bdesigned\b': 'dizajnirano',
    r'\bDesigned\b': 'Dizajnirano',
    r'\bdesigned\s+for\b': 'dizajnirano za',
    
    # Certifications
    r'\bcertified\b': 'certifikovano',
    r'\bCertified\b': 'Certifikovano',
    r'\bcertification\b': 'certifikacija',
    r'\bCE\s+marking\b': 'CE označavanje',
    r'\bCE\s+mark\b': 'CE oznaka',
}

def translate_text(text):
    """Advanced translation"""
    if not text or not isinstance(text, str):
        return text
    
    result = text
    
    # Apply translations
    for pattern, replacement in translations.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    
    return result

print('=' * 100)
print('NAPREDNI PREVOD ENGLESKIH TERMINA')
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
    
    desc = color.get('description', '')
    if desc:
        new_desc = translate_text(desc)
        if new_desc != desc:
            color['description'] = new_desc
            updated = True
    
    if updated:
        fixed_count += 1
        if fixed_count <= 10:
            print(f'✅ {color.get("collection", "")} {color.get("code", "")}')

if fixed_count > 0:
    json.dump(lvt_data, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    json.dump(linoleum_data, open('public/data/linoleum_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print(f'\n✅ Prevedeno: {fixed_count} proizvoda')
else:
    print('\n⚠️  Nema termina za prevod')
