#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pronalazi i strukturiše opise koji još uvek nemaju sekcije
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

def has_proper_sections(desc):
    """Check if description has proper section headers"""
    if not desc:
        return False
    
    # Check for section headers
    section_headers = ['Proizvod:', 'Ugradnja:', 'Primena:', 'Okruženje:']
    found_headers = [h for h in section_headers if h in desc]
    
    # Must have at least "Proizvod:" section
    return 'Proizvod:' in desc and len(found_headers) >= 1

def structure_description(desc, collection_name):
    """Structure description that doesn't have proper sections"""
    if not desc:
        return None
    
    lines = [line.strip() for line in desc.split('\n') if line.strip()]
    
    if not lines:
        return None
    
    # Build sections
    sections = {
        'Proizvod:': [],
        'Ugradnja:': [],
        'Primena:': [],
        'Okruženje:': []
    }
    
    current_section = 'Proizvod:'
    
    # Keywords for each section
    keywords = {
        'Proizvod:': ['dizajn', 'format', 'ivice', 'sloj habanja', 'debljina', 'protecshield', 'akustični', 'smart', 'komfor', 'wear layer', 'thickness'],
        'Ugradnja:': ['ugradnja', 'dry back', 'glue-down', 'looselay', 'lepak', 'instalacija', 'sečenje', 'installation'],
        'Primena:': ['klasa', 'upotrebe', 'evropska', 'kancelarije', 'hoteli', 'prodavnice', 'traffic', 'promet', 'application', 'class'],
        'Okruženje:': ['reciklabilno', 'recikliran', 'tvoc', 'ftalata', 'reach', 'emisije', 'certifikovano', 'floorscore', 'environment', 'recyclable']
    }
    
    for line in lines:
        line_lower = line.lower()
        
        # Check if line is a section header
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
        
        # Auto-categorize by keywords
        matched = False
        for section, kw_list in keywords.items():
            if any(kw in line_lower for kw in kw_list):
                # Don't move backwards
                section_order = ['Proizvod:', 'Ugradnja:', 'Primena:', 'Okruženje:']
                if section_order.index(section) >= section_order.index(current_section):
                    current_section = section
                    matched = True
                    break
        
        sections[current_section].append(line)
    
    # Build structured description
    result_lines = []
    for section_title in ['Proizvod:', 'Ugradnja:', 'Primena:', 'Okruženje:']:
        if sections[section_title]:
            result_lines.append(section_title)
            for item in sections[section_title]:
                result_lines.append(item)
            result_lines.append('')
    
    result = '\n'.join(result_lines).strip()
    
    # Ensure we have at least Proizvod section
    if result and 'Proizvod:' not in result:
        result = 'Proizvod:\n' + result
    
    return result

updated = 0
unstructured = []

for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    if not has_proper_sections(desc):
        unstructured.append({
            'slug': color.get('slug', ''),
            'collection': color.get('collection', ''),
            'code': color.get('code', ''),
            'desc_preview': desc[:100]
        })
        
        structured = structure_description(desc, color.get('collection', ''))
        if structured and structured != desc:
            color['description'] = structured
            updated += 1

print(f'✅ Strukturisano: {updated} opisa')
print(f'\n⚠️  Preostalo nestrukturisanih: {len(unstructured) - updated}')

if len(unstructured) - updated > 0 and len(unstructured) - updated <= 10:
    print('\nPrimeri:')
    for item in list(unstructured)[:5]:
        print(f"  - {item['collection']} {item['code']}: {item['desc_preview']}...")

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
