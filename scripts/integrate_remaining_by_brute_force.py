#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Brute force integracija - pokušava SVE načine pronalaženja
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
    
    # Build multiple indexes
    by_code_collection = {}  # code-collection -> color
    by_code_only = {}  # code -> list of colors
    
    for color in colors:
        code = color.get('code')
        collection = color.get('collection', '')
        
        if code and collection:
            key = f"{code}-{collection}"
            by_code_collection[key] = color
        
        if code:
            if code not in by_code_only:
                by_code_only[code] = []
            by_code_only[code].append(color)
    
    print(f"Ukupno boja: {len(colors)}")
    print(f"Index po code-collection: {len(by_code_collection)}\n")
    
    total_updated = 0
    
    # Process all extracted files
    lvt_dir = Path('downloads/product_descriptions/lvt')
    for file in sorted(lvt_dir.glob('*_colors.json')):
        collection_from_file = file.stem.replace('_colors', '')
        
        with open(file, 'r', encoding='utf-8') as f:
            extracted_data = json.load(f)
        
        extracted_colors = extracted_data.get('colors', [])
        updated = 0
        
        for ec in extracted_colors:
            specs = ec.get('specs', {})
            if not specs or not specs.get('DIMENSION'):
                continue
            
            full_slug = ec.get('slug', '')
            code_match = re.search(r'(\d{4})', full_slug)
            if not code_match:
                continue
            
            code = code_match.group(1)
            
            # Try all possible collections for this code
            candidates = by_code_only.get(code, [])
            
            for candidate in candidates:
                c_collection = candidate.get('collection', '')
                
                # Check if collections are related
                # E.g., "creation-55-clic-acoustic" matches "creation-55-clic-acoustic-new-collection"
                if collection_from_file in c_collection or c_collection in collection_from_file:
                    # This is likely the right color - UPDATE ALL SPECS
                    changed = False
                    
                    # Dimension
                    dimension = specs.get('DIMENSION', '').strip()
                    if dimension and candidate.get('dimension') != dimension:
                        candidate['dimension'] = dimension
                        changed = True
                    
                    # Format
                    format_val = (specs.get('FORMAT') or specs.get('FORMATS') or '').strip()
                    if format_val and candidate.get('format') != format_val:
                        candidate['format'] = format_val
                        changed = True
                    
                    # Overall thickness
                    thickness = specs.get('OVERALL THICKNESS', '').strip()
                    if thickness and candidate.get('overall_thickness') != thickness:
                        candidate['overall_thickness'] = thickness
                        changed = True
                    
                    if changed:
                        updated += 1
                    break
        
        if updated > 0:
            print(f"  {file.name}: +{updated}")
            total_updated += updated
    
    if total_updated > 0:
        with open(lvt_complete_path, 'w', encoding='utf-8') as f:
            json.dump(complete_data, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Ažurirano: {total_updated} boja")
    else:
        print(f"\nℹ️  Nema novih ažuriranja")

if __name__ == '__main__':
    main()
