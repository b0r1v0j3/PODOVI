#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Forsira dodavanje format i thickness iz ekstraktovanih specs
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def main():
    lvt_complete_path = Path('public/data/lvt_colors_complete.json')
    
    with open(lvt_complete_path, 'r', encoding='utf-8') as f:
        complete_data = json.load(f)
    
    colors = complete_data.get('colors', [])
    colors_by_slug = {c.get('slug'): c for c in colors if c.get('slug')}
    
    total_updated = 0
    
    lvt_dir = Path('downloads/product_descriptions/lvt')
    for file in sorted(lvt_dir.glob('*_colors.json')):
        with open(file, 'r', encoding='utf-8') as f:
            extracted_data = json.load(f)
        
        extracted_colors = extracted_data.get('colors', [])
        updated = 0
        
        for ec in extracted_colors:
            specs = ec.get('specs', {})
            if not specs:
                continue
            
            full_slug = ec.get('slug', '')
            # Extract color slug: "creation-X-Y-0347-ballerina-41870347" -> "ballerina-41870347"
            slug_match = re.search(r'-(\d{4})-([\w-]+-\d+)$', full_slug)
            if not slug_match:
                continue
            
            color_slug = slug_match.group(2)
            color = colors_by_slug.get(color_slug)
            
            if not color:
                continue
            
            changed = False
            
            # Add format if missing or empty
            if specs.get('FORMAT') or specs.get('FORMATS'):
                format_val = (specs.get('FORMAT') or specs.get('FORMATS', '')).strip()
                if format_val:
                    color['format'] = format_val
                    changed = True
            
            # Add thickness if missing or empty
            if specs.get('OVERALL THICKNESS'):
                thickness = specs['OVERALL THICKNESS'].strip()
                if thickness:
                    color['overall_thickness'] = thickness
                    changed = True
            
            # Add dimension if missing
            if specs.get('DIMENSION'):
                dimension = specs['DIMENSION'].strip()
                if dimension and not color.get('dimension'):
                    color['dimension'] = dimension
                    changed = True
            elif specs.get('WIDTH') and specs.get('LENGTH'):
                width = specs['WIDTH'].strip()
                length = specs['LENGTH'].strip()
                if width and length and not color.get('dimension'):
                    color['dimension'] = f"{width} X {length}"
                    changed = True
            
            if changed:
                updated += 1
        
        if updated > 0:
            print(f"  {file.name}: +{updated}")
            total_updated += updated
    
    if total_updated > 0:
        with open(lvt_complete_path, 'w', encoding='utf-8') as f:
            json.dump(complete_data, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Ažurirano: {total_updated} boja")
    else:
        print("\nℹ️  Nema novih ažuriranja")

if __name__ == '__main__':
    main()
