#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Finalna integracija - pronalazi boje po CODE i COLLECTION
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def normalize_collection_name(name):
    """Normalize collection name for comparison"""
    # Remove suffixes
    return name.replace('-new-collection', '').replace('-clic', '').replace('-looselay', '').replace('-zen', '').replace('-acoustic', '').replace('-megaclic', '').replace('-connect', '')

def main():
    print("="*80)
    print("FINALNA INTEGRACIJA PO CODE I COLLECTION")
    print("="*80)
    
    lvt_complete_path = Path('public/data/lvt_colors_complete.json')
    
    # Load complete JSON
    with open(lvt_complete_path, 'r', encoding='utf-8') as f:
        complete_data = json.load(f)
    
    colors = complete_data.get('colors', [])
    
    # Build index by code AND collection
    colors_index = {}
    for color in colors:
        code = color.get('code')
        collection = color.get('collection', '')
        if code and collection:
            key = f"{code}-{collection}"
            colors_index[key] = color
    
    print(f"Ukupno boja: {len(colors)}")
    print(f"Boja u indexu: {len(colors_index)}\n")
    
    total_updated = 0
    
    # Process all extracted files
    lvt_dir = Path('downloads/product_descriptions/lvt')
    for file in sorted(lvt_dir.glob('*_colors.json')):
        collection_slug_from_file = file.stem.replace('_colors', '')
        
        with open(file, 'r', encoding='utf-8') as f:
            extracted_data = json.load(f)
        
        extracted_colors = extracted_data.get('colors', [])
        updated = 0
        
        for ec in extracted_colors:
            specs = ec.get('specs', {})
            if not specs or len(specs) == 0:
                continue
            
            # Extract code from slug
            full_slug = ec.get('slug', '')
            code_match = re.search(r'(\d{4})', full_slug)
            if not code_match:
                continue
            
            code = code_match.group(1)
            
            # Try to find by code and collection
            # First try exact collection match
            key = f"{code}-{collection_slug_from_file}"
            color = colors_index.get(key)
            
            # If not found, try normalized collection
            if not color:
                normalized = normalize_collection_name(collection_slug_from_file)
                key = f"{code}-{normalized}"
                color = colors_index.get(key)
            
            # If still not found, try all collections with this code
            if not color:
                for key, c in colors_index.items():
                    if key.startswith(f"{code}-"):
                        # Check if collection names are similar
                        c_collection = c.get('collection', '')
                        if collection_slug_from_file in c_collection or c_collection in collection_slug_from_file:
                            color = c
                            break
            
            if color:
                # Update dimension from specs
                if 'DIMENSION' in specs:
                    dimension = specs['DIMENSION'].strip()
                    if dimension:
                        old_dim = color.get('dimension')
                        if old_dim != dimension:
                            color['dimension'] = dimension
                            color['format'] = specs.get('FORMAT') or specs.get('FORMATS', color.get('format', ''))
                            color['overall_thickness'] = specs.get('OVERALL THICKNESS', color.get('overall_thickness', ''))
                            updated += 1
                elif 'WIDTH' in specs and 'LENGTH' in specs:
                    width = specs['WIDTH'].strip()
                    length = specs['LENGTH'].strip()
                    if width and length:
                        new_dimension = f"{width} X {length}"
                        old_dim = color.get('dimension')
                        if old_dim != new_dimension:
                            color['dimension'] = new_dimension
                            color['format'] = specs.get('FORMAT') or specs.get('FORMATS', color.get('format', ''))
                            color['overall_thickness'] = specs.get('OVERALL THICKNESS', color.get('overall_thickness', ''))
                            updated += 1
        
        if updated > 0:
            print(f"  {file.name}: +{updated}")
            total_updated += updated
    
    # Save
    if total_updated > 0:
        with open(lvt_complete_path, 'w', encoding='utf-8') as f:
            json.dump(complete_data, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Ažurirano: {total_updated} boja")
    else:
        print(f"\nℹ️  Nema novih ažuriranja")

if __name__ == '__main__':
    main()
