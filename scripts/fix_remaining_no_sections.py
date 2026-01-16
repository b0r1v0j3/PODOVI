#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Strukturiše preostalih 33 opisa bez sekcija
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

def has_sections(desc):
    """Check if description has sections"""
    if not desc:
        return False
    return 'Proizvod:' in desc or 'Product:' in desc or 'Ugradnja:' in desc

def structure_description(desc, collection_name):
    """Structure description"""
    if not desc:
        return None
    
    lines = [line.strip() for line in desc.split('\n') if line.strip()]
    if not lines:
        return None
    
    sections = {
        'Proizvod:': [],
        'Ugradnja:': [],
        'Primena:': [],
        'Okruženje:': []
    }
    
    current_section = 'Proizvod:'
    
    # Keywords
    keywords = {
        'Proizvod:': ['dizajn', 'format', 'ivice', 'sloj', 'debljina', 'protecshield', 'akustični', 'smart', 'komfor', 'wear', 'thickness', 'core', 'construction'],
        'Ugradnja:': ['ugradnja', 'dry back', 'glue', 'looselay', 'lepak', 'instalacija', 'sečenje', 'installation', 'tackifier'],
        'Primena:': ['klasa', 'upotrebe', 'evropska', 'kancelarije', 'hoteli', 'prodavnice', 'traffic', 'promet', 'application', 'class', 'zone'],
        'Okruženje:': ['reciklabilno', 'recikliran', 'tvoc', 'ftalata', 'reach', 'emisije', 'certifikovano', 'floorscore', 'environment', 'recyclable', 'co2', 'sertifikat']
    }
    
    for line in lines:
        line_lower = line.lower()
        
        # Section headers
        if 'Proizvod' in line or 'Product' in line:
            current_section = 'Proizvod:'
            continue
        elif 'Ugradnja' in line or 'Installation' in line:
            current_section = 'Ugradnja:'
            continue
        elif 'Primena' in line or 'Application' in line:
            current_section = 'Primena:'
            continue
        elif 'Okruženje' in line or 'Environment' in line:
            current_section = 'Okruženje:'
            continue
        
        # Auto-categorize
        section_order = ['Proizvod:', 'Ugradnja:', 'Primena:', 'Okruženje:']
        for section, kw_list in keywords.items():
            if any(kw in line_lower for kw in kw_list):
                if section_order.index(section) >= section_order.index(current_section):
                    current_section = section
                    break
        
        sections[current_section].append(line)
    
    # Build result
    result_lines = []
    for section_title in ['Proizvod:', 'Ugradnja:', 'Primena:', 'Okruženje:']:
        if sections[section_title]:
            result_lines.append(section_title)
            for item in sections[section_title]:
                result_lines.append(item)
            result_lines.append('')
    
    result = '\n'.join(result_lines).strip()
    
    if result and 'Proizvod:' not in result:
        result = 'Proizvod:\n' + result
    
    return result if result else desc

updated = 0
for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    if not has_sections(desc):
        structured = structure_description(desc, color.get('collection', ''))
        if structured and structured != desc:
            color['description'] = structured
            updated += 1
            print(f'✅ {color.get("collection", "")} {color.get("code", "")} {color.get("name", "")}')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Strukturisano: {updated} opisa')
