#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Strukturiše preostale nestrukturisane opise
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

def has_sections(desc):
    """Check if description has proper sections"""
    if not desc:
        return False
    
    section_headers = ['Proizvod:', 'Ugradnja:', 'Primena:', 'Okruženje:']
    return any(header in desc for header in section_headers)

def structure_unstructured_description(desc, collection_name):
    """Structure description that doesn't have sections"""
    if not desc:
        return None
    
    lines = [line.strip() for line in desc.split('\n') if line.strip()]
    
    # Try to identify sections by keywords
    sections = {
        'Proizvod:': [],
        'Ugradnja:': [],
        'Primena:': [],
        'Okruženje:': []
    }
    
    current_section = 'Proizvod:'
    
    # Keywords for each section
    product_keywords = ['dizajn', 'format', 'ivice', 'sloj habanja', 'debljina', 'protecshield', 'akustični', 'smart', 'komfor']
    installation_keywords = ['ugradnja', 'dry back', 'glue-down', 'looselay', 'lepak', 'lepkom', 'instalacija', 'sečenje']
    application_keywords = ['klasa', 'upotrebe', 'evropska', 'kancelarije', 'hoteli', 'prodavnice', 'traffic', 'promet']
    environment_keywords = ['reciklabilno', 'recikliran', 'tvoc', 'ftalata', 'reach', 'emisije', 'certifikovano', 'floorscore']
    
    for line in lines:
        line_lower = line.lower()
        
        # Check which section this line belongs to
        if any(kw in line_lower for kw in environment_keywords):
            if current_section != 'Okruženje:':
                current_section = 'Okruženje:'
        elif any(kw in line_lower for kw in application_keywords):
            if current_section != 'Primena:':
                current_section = 'Primena:'
        elif any(kw in line_lower for kw in installation_keywords):
            if current_section not in ['Ugradnja:', 'Okruženje:', 'Primena:']:
                current_section = 'Ugradnja:'
        elif any(kw in line_lower for kw in product_keywords):
            if current_section in ['Ugradnja:', 'Primena:', 'Okruženje:']:
                # Already moved past product section, keep in current
                pass
            else:
                current_section = 'Proizvod:'
        
        sections[current_section].append(line)
    
    # Build structured description
    result_lines = []
    for section_title in ['Proizvod:', 'Ugradnja:', 'Primena:', 'Okruženje:']:
        if sections[section_title]:
            result_lines.append(section_title)
            for item in sections[section_title]:
                result_lines.append(item)
            result_lines.append('')
    
    return '\n'.join(result_lines).strip()

updated = 0
for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    # Skip if already has sections
    if has_sections(desc):
        continue
    
    structured = structure_unstructured_description(desc, color.get('collection', ''))
    if structured and structured != desc:
        color['description'] = structured
        updated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Strukturisano: {updated} preostalih opisa')
