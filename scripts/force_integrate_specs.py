#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Forsira integraciju specs - pronalazi boje po slug-u direktno
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def extract_color_slug_from_full_slug(full_slug):
    """
    Izvlači color slug iz punog slug-a
    E.g., "creation-40-clic-acoustic-new-collection-0347-ballerina-61300347" -> "ballerina-61300347"
    """
    # Pattern: ...code-name-finalnumber
    # E.g., creation-40-clic-acoustic-new-collection-0347-ballerina-61300347
    #       -> ballerina-61300347
    
    # Find the 4-digit code, then extract everything after it
    code_match = re.search(r'-(\d{4})-([\w-]+?-\d+)$', full_slug)
    if code_match:
        # Everything after the code
        after_code = code_match.group(2)
        # This should be "ballerina-61300347" format
        return after_code
    
    return None

def main():
    print("="*80)
    print("FORSIRANA INTEGRACIJA SPECS PO SLUG-U")
    print("="*80)
    
    lvt_dir = Path('downloads/product_descriptions/lvt')
    lvt_complete_path = Path('public/data/lvt_colors_complete.json')
    
    # Load complete JSON
    with open(lvt_complete_path, 'r', encoding='utf-8') as f:
        complete_data = json.load(f)
    
    colors = complete_data.get('colors', [])
    
    # Build slug index
    colors_by_slug = {c.get('slug'): c for c in colors if c.get('slug')}
    
    print(f"\nUkupno boja u complete JSON: {len(colors)}")
    print(f"Boja sa slug-ovima: {len(colors_by_slug)}")
    
    total_updated = 0
    
    # Process all extracted files
    for file in sorted(lvt_dir.glob('*_colors.json')):
        with open(file, 'r', encoding='utf-8') as f:
            extracted_data = json.load(f)
        
        extracted_colors = extracted_data.get('colors', [])
        updated = 0
        
        for ec in extracted_colors:
            full_slug = ec.get('slug', '')
            specs = ec.get('specs', {})
            
            if not specs or len(specs) == 0:
                continue
            
            # Extract color slug
            color_slug = extract_color_slug_from_full_slug(full_slug)
            if not color_slug:
                continue
            
            # Find in complete JSON
            color = colors_by_slug.get(color_slug)
            if not color:
                continue
            
            # Update dimension if available in specs (UVEK ažurira)
            if 'DIMENSION' in specs:
                dimension = specs['DIMENSION'].strip()
                if dimension:
                    old_dim = color.get('dimension')
                    if old_dim != dimension:
                        color['dimension'] = dimension
                        updated += 1
            elif 'WIDTH' in specs and 'LENGTH' in specs:
                width = specs['WIDTH'].strip()
                length = specs['LENGTH'].strip()
                if width and length:
                    new_dimension = f"{width} X {length}"
                    old_dim = color.get('dimension')
                    if old_dim != new_dimension:
                        color['dimension'] = new_dimension
                        updated += 1
            
            # Update format (UVEK ažurira)
            if 'FORMAT' in specs or 'FORMATS' in specs:
                format_val = specs.get('FORMAT') or specs.get('FORMATS', '')
                if format_val:
                    format_val = format_val.strip()
                    old_format = color.get('format')
                    if old_format != format_val:
                        color['format'] = format_val
                        updated += 1
            
            # Update thickness (UVEK ažurira)
            if 'OVERALL THICKNESS' in specs:
                thickness = specs['OVERALL THICKNESS'].strip()
                if thickness:
                    old_thickness = color.get('overall_thickness')
                    if old_thickness != thickness:
                        color['overall_thickness'] = thickness
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
        print(f"\nℹ️  Nema šta za ažurirati")

if __name__ == '__main__':
    main()
