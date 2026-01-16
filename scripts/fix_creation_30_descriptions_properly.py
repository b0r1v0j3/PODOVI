#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Strukturira Creation 30 opise pravilno - oni imaju "Dizajn i proizvod" umesto "Proizvod:"
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

def restructure_creation_30_description(desc):
    """Restructure Creation 30 descriptions"""
    if not desc:
        return None
    
    # Check if it's the old format
    if 'Dizajn i proizvod' in desc and 'Ugradnja i održavanje' in desc:
        lines = desc.split('\n')
        
        sections = []
        current_section = None
        current_items = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Section headers
            if 'Dizajn i proizvod' in line or 'Proizvod' in line:
                if current_section:
                    sections.append((current_section, current_items))
                current_section = 'Proizvod:'
                current_items = []
            elif 'Ugradnja i održavanje' in line or 'Ugradnja' in line:
                if current_section:
                    sections.append((current_section, current_items))
                current_section = 'Ugradnja:'
                current_items = []
            elif 'Održivost' in line or 'Okruženje' in line:
                if current_section:
                    sections.append((current_section, current_items))
                current_section = 'Okruženje:'
                current_items = []
            else:
                if current_section:
                    current_items.append(line)
                else:
                    # Default to Proizvod section
                    if not current_section:
                        current_section = 'Proizvod:'
                    current_items.append(line)
        
        # Add last section
        if current_section:
            sections.append((current_section, current_items))
        
        # Build new description
        result_lines = []
        for section_title, items in sections:
            result_lines.append(section_title)
            for item in items:
                # Clean up items
                item = re.sub(r'^[•\-\*]\s*', '', item)
                result_lines.append(item)
            result_lines.append('')
        
        return '\n'.join(result_lines).strip()
    
    return desc

updated = 0
for color in colors:
    if color.get('collection') == 'creation-30':
        desc = color.get('description', '')
        if not desc:
            continue
        
        restructured = restructure_creation_30_description(desc)
        if restructured and restructured != desc:
            color['description'] = restructured
            updated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Restrukturisano: {updated} Creation 30 opisa')
