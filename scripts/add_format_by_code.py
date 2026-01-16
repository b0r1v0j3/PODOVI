#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dodaje format i thickness po CODE - ignorise slug razlike
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
    
    # Build index by code AND collection
    colors_index = {}
    for color in colors:
        code = color.get('code')
        collection = color.get('collection', '')
        if code and collection:
            # Try multiple keys to handle collection name variations
            keys = [
                f"{code}-{collection}",
                f"{code}-{collection.replace('-new-collection', '')}",
                f"{code}-{collection}-new-collection",
            ]
            for key in keys:
                colors_index[key] = color
    
    print(f"Index: {len(colors_index)} keys\n")
    
    total_updated = 0
    
    lvt_dir = Path('downloads/product_descriptions/lvt')
    for file in sorted(lvt_dir.glob('*_colors.json')):
        collection_from_file = file.stem.replace('_colors', '')
        
        with open(file, 'r', encoding='utf-8') as f:
            extracted_data = json.load(f)
        
        extracted_colors = extracted_data.get('colors', [])
        updated = 0
        
        for ec in extracted_colors:
            specs = ec.get('specs', {})
            if not specs:
                continue
            
            full_slug = ec.get('slug', '')
            code_match = re.search(r'(\d{4})', full_slug)
            if not code_match:
                continue
            
            code = code_match.group(1)
            
            # Try to find by code and collection (with variations)
            color = None
            search_keys = [
                f"{code}-{collection_from_file}",
                f"{code}-{collection_from_file.replace('-new-collection', '')}",
                f"{code}-{collection_from_file}-new-collection",
            ]
            
            for key in search_keys:
                if key in colors_index:
                    color = colors_index[key]
                    break
            
            if color:
                changed = False
                
                # Add format
                format_val = (specs.get('FORMAT') or specs.get('FORMATS') or '').strip()
                if format_val:
                    color['format'] = format_val
                    changed = True
                
                # Add thickness
                thickness = specs.get('OVERALL THICKNESS', '').strip()
                if thickness:
                    color['overall_thickness'] = thickness
                    changed = True
                
                # Add dimension if missing
                if not color.get('dimension'):
                    dimension = specs.get('DIMENSION', '').strip()
                    if dimension:
                        color['dimension'] = dimension
                        changed = True
                    elif specs.get('WIDTH') and specs.get('LENGTH'):
                        width = specs['WIDTH'].strip()
                        length = specs['LENGTH'].strip()
                        if width and length:
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
