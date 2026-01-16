#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Strukturiše sve opise u sekcije (Proizvod/Ugradnja/Primena/Okruženje)
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

def structure_description(desc, collection_name):
    """Structure description into sections"""
    if not desc:
        return None
    
    # If already has sections, return as is
    if 'Proizvod:' in desc or 'Product:' in desc or 'Ugradnja:' in desc:
        # Just ensure Serbian headers
        desc = desc.replace('Product:', 'Proizvod:')
        desc = desc.replace('Installation:', 'Ugradnja:')
        desc = desc.replace('Application:', 'Primena:')
        desc = desc.replace('Environment:', 'Okruženje:')
        return desc
    
    # Try to structure unstructured text
    lines = [line.strip() for line in desc.split('\n') if line.strip()]
    
    # Build sections
    sections = []
    current_section = None
    current_items = []
    
    for line in lines:
        # Check if line is a section header
        if any(header in line for header in ['Proizvod', 'Ugradnja', 'Primena', 'Okruženje', 
                                             'Product', 'Installation', 'Application', 'Environment']):
            # Save previous section
            if current_section:
                sections.append((current_section, current_items))
            # Start new section
            current_section = line.replace('Product', 'Proizvod').replace('Installation', 'Ugradnja').replace('Application', 'Primena').replace('Environment', 'Okruženje')
            current_items = []
        else:
            if current_section:
                current_items.append(line)
            else:
                # If no section yet, add to "Proizvod" section
                if not current_section:
                    current_section = 'Proizvod:'
                current_items.append(line)
    
    # Add last section
    if current_section:
        sections.append((current_section, current_items))
    
    # If we have sections, format them
    if sections:
        result_lines = []
        for section_title, items in sections:
            result_lines.append(section_title)
            for item in items:
                # Remove bullet if present
                item = re.sub(r'^[•\-\*]\s*', '', item)
                result_lines.append(item)
            result_lines.append('')
        return '\n'.join(result_lines).strip()
    
    # If no sections found, create basic structure
    return f'Proizvod:\n{desc}'

updated = 0
for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    structured = structure_description(desc, color.get('collection', ''))
    if structured and structured != desc:
        color['description'] = structured
        updated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Strukturisano: {updated} opisa')
