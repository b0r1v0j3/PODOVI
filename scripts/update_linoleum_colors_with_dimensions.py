#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ažurira linoleum_colors_complete.json sa dimenzijama iz ekstraktovanih opisa
"""

import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def find_color_by_slug(colors, slug):
    """Find color by slug"""
    for c in colors:
        if c.get('slug') == slug:
            return c
    return None

def find_color_by_code(colors, code, collection=None):
    """Find color by code and optionally collection"""
    for c in colors:
        if c.get('code') == code:
            if collection is None or c.get('collection') == collection:
                return c
    return None

def main():
    # Load Linoleum colors
    linoleum_json_path = Path('public/data/linoleum_colors_complete.json')
    if not linoleum_json_path.exists():
        print(f"❌ {linoleum_json_path} ne postoji!")
        return
    
    with open(linoleum_json_path, 'r', encoding='utf-8') as f:
        linoleum_data = json.load(f)
    
    colors = linoleum_data.get('colors', [])
    print(f"📊 Učitano {len(colors)} boja iz linoleum_colors_complete.json\n")
    
    updated_count = 0
    total_specs_found = 0
    
    # Find all description JSON files (Linoleum)
    descriptions_dir = Path('downloads/product_descriptions/linoleum')
    if descriptions_dir.exists():
        # Process each collection description file
        for desc_file in descriptions_dir.glob('*_descriptions.json'):
            print(f"\n📄 Obrađujem: {desc_file.name}")
            
            with open(desc_file, 'r', encoding='utf-8') as f:
                desc_data = json.load(f)
            
            collection_colors = desc_data.get('colors', [])
            print(f"  📊 Pronađeno {len(collection_colors)} boja u opisu")
            
            for desc_color in collection_colors:
                desc_slug = desc_color.get('slug', '')
                specs = desc_color.get('specs', {})
                
                if not specs:
                    continue
                
                total_specs_found += 1
                
                # Find matching color in linoleum_colors_complete.json
                color = find_color_by_slug(colors, desc_slug)
                
                if not color:
                    # Try alternative matching - extract code from slug
                    code_match = re.search(r'(\d{4})', desc_slug)
                    if code_match:
                        code = code_match.group(1)
                        # Try to find by code
                        for c in colors:
                            if c.get('code') == code:
                                color = c
                                break
                
                if color:
                    # Update color with specs
                    if 'dimension' not in color or not color.get('dimension'):
                        if 'DIMENSION' in specs:
                            color['dimension'] = specs['DIMENSION']
                            print(f"  ✓ Dodata dimenzija za {color.get('full_name', desc_slug)}: {specs['DIMENSION']}")
                            updated_count += 1
                    
                    if 'format' not in color or not color.get('format'):
                        if 'FORMAT' in specs:
                            color['format'] = specs['FORMAT']
                    
                    if 'overall_thickness' not in color or not color.get('overall_thickness'):
                        if 'OVERALL THICKNESS' in specs:
                            color['overall_thickness'] = specs['OVERALL THICKNESS']
                    
                    if 'welding_rod' not in color or not color.get('welding_rod'):
                        if 'WELDING ROD' in specs:
                            color['welding_rod'] = specs['WELDING ROD']
                        elif 'WELDING ROD REF.' in specs:
                            color['welding_rod'] = specs['WELDING ROD REF.']
                else:
                    print(f"  ⚠️  Nije pronađena boja za slug: {desc_slug}")
    
    # Save updated JSON
    if updated_count > 0:
        print(f"\n💾 Čuvam ažurirani JSON...")
        with open(linoleum_json_path, 'w', encoding='utf-8') as f:
            json.dump(linoleum_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Gotovo!")
    print(f"  📊 Ukupno specs pronađeno: {total_specs_found}")
    print(f"  ✓ Ažurirano boja: {updated_count}")
    print(f"  📄 Sačuvano u: {linoleum_json_path}")

if __name__ == '__main__':
    main()
