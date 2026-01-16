#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Strukturiše linoleum opise u sekcije
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

linoleum_complete = json.load(open('public/data/linoleum_colors_complete.json', 'r', encoding='utf-8'))
linoleum_colors = linoleum_complete.get('colors', [])

def structure_linoleum_description(desc):
    """Structure linoleum description"""
    if not desc:
        return None
    
    # Check if already has sections
    if 'Proizvod:' in desc or 'Ugradnja:' in desc:
        return desc
    
    lines = [line.strip() for line in desc.split('\n') if line.strip()]
    
    sections = {
        'Proizvod:': [],
        'Ugradnja:': [],
        'Primena:': [],
        'Okruženje:': []
    }
    
    current_section = 'Proizvod:'
    
    # Keywords
    keywords = {
        'Proizvod:': ['dizajn', 'proizvod', 'sastojci', 'boje', 'neocare', 'surface treatment', 'prirodni', 'natural'],
        'Ugradnja:': ['ugradnja', 'održavanje', 'maintenance', 'sečenje', 'fleksibilan', 'surface treatment'],
        'Primena:': ['primena', 'application', 'traffic', 'education', 'healthcare', 'promet', 'otpornost', 'resistance'],
        'Okruženje:': ['održivost', 'natural', 'reciklabilno', 'recikliran', 'tvoc', 'co2', 'sertifikat', 'certifikat']
    }
    
    for line in lines:
        line_lower = line.lower()
        
        # Check for section headers
        if 'Dizajn i proizvod' in line or 'Proizvod' in line:
            current_section = 'Proizvod:'
            continue
        elif 'Ugradnja i održavanje' in line or 'Ugradnja' in line or 'održavanje' in line:
            if current_section == 'Proizvod:':
                current_section = 'Ugradnja:'
            continue
        elif 'Primena' in line or 'Application' in line:
            current_section = 'Primena:'
            continue
        elif 'Održivost' in line or 'Environment' in line or 'Okruženje' in line:
            current_section = 'Okruženje:'
            continue
        
        # Auto-categorize
        matched = False
        section_order = ['Proizvod:', 'Ugradnja:', 'Primena:', 'Okruženje:']
        for section, kw_list in keywords.items():
            if any(kw in line_lower for kw in kw_list):
                if section_order.index(section) >= section_order.index(current_section):
                    current_section = section
                    matched = True
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
for color in linoleum_colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    structured = structure_linoleum_description(desc)
    if structured and structured != desc:
        color['description'] = structured
        updated += 1

json.dump(linoleum_complete, open('public/data/linoleum_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Strukturisano: {updated} linoleum opisa')
