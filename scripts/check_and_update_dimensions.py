#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proverava i ažurira dimenzije za Creation 30 i sve ostale kolekcije
"""

import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def find_color_by_code(colors, code, collection=None):
    """Find color by code and optionally collection"""
    for c in colors:
        if c.get('code') == code:
            if collection is None or c.get('collection') == collection:
                return c
    return None

def main():
    # Load LVT colors
    lvt_json_path = Path('public/data/lvt_colors_complete.json')
    with open(lvt_json_path, 'r', encoding='utf-8') as f:
        lvt_data = json.load(f)
    
    colors = lvt_data.get('colors', [])
    print(f"📊 Učitano {len(colors)} boja iz lvt_colors_complete.json\n")
    
    # Check Creation 30
    creation30 = [c for c in colors if c.get('collection') == 'creation-30']
    with_dim = [c for c in creation30 if c.get('dimension')]
    without_dim = [c for c in creation30 if not c.get('dimension')]
    
    print(f"Creation 30: {len(creation30)} boja")
    print(f"  ✓ Sa dimenzijama: {len(with_dim)}")
    print(f"  ✗ Bez dimenzija: {len(without_dim)}")
    
    if without_dim:
        print(f"\n  Boje bez dimenzija:")
        for c in without_dim[:10]:
            print(f"    - {c.get('code')} {c.get('name')} (slug: {c.get('slug')})")
        if len(without_dim) > 10:
            print(f"    ... i još {len(without_dim) - 10} boja")
    
    # Load creation_30_dimensions.json
    creation_30_dimensions_path = Path('downloads/creation_30_dimensions.json')
    if creation_30_dimensions_path.exists():
        print(f"\n📄 Učitavam dimenzije iz {creation_30_dimensions_path.name}...")
        with open(creation_30_dimensions_path, 'r', encoding='utf-8') as f:
            creation_30_data = json.load(f)
        
        print(f"  📊 Pronađeno {len(creation_30_data)} boja sa specs\n")
        
        updated_count = 0
        not_found_count = 0
        
        for color_slug, specs in creation_30_data.items():
            if not specs or 'DIMENSION' not in specs:
                continue
            
            # Extract code from slug: "creation-30-new-collection-0347-ballerina-41870347"
            code_match = re.search(r'creation-30-new-collection-(\d{4})', color_slug)
            if not code_match:
                continue
            
            code = code_match.group(1)
            color = find_color_by_code(colors, code, 'creation-30')
            
            if color:
                # Update dimension if missing or different
                if not color.get('dimension') or color.get('dimension') != specs['DIMENSION']:
                    color['dimension'] = specs['DIMENSION']
                    if 'FORMAT' in specs:
                        color['format'] = specs['FORMAT']
                    if 'OVERALL THICKNESS' in specs:
                        color['overall_thickness'] = specs['OVERALL THICKNESS']
                    print(f"  ✓ Ažurirana {color.get('code')} {color.get('name')}: {specs['DIMENSION']}")
                    updated_count += 1
            else:
                print(f"  ⚠️  Nije pronađena boja za kod: {code} (slug: {color_slug})")
                not_found_count += 1
        
        # Save updated JSON
        if updated_count > 0:
            print(f"\n💾 Čuvam ažurirani JSON...")
            with open(lvt_json_path, 'w', encoding='utf-8') as f:
                json.dump(lvt_data, f, indent=2, ensure_ascii=False)
            
            print(f"\n✅ Gotovo!")
            print(f"  ✓ Ažurirano boja: {updated_count}")
            if not_found_count > 0:
                print(f"  ⚠️  Nije pronađeno: {not_found_count}")
        else:
            print(f"\nℹ️  Nema novih ažuriranja")
    else:
        print(f"\n⚠️  {creation_30_dimensions_path} ne postoji!")

if __name__ == '__main__':
    main()
