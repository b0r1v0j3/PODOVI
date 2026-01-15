#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skripta za ažuriranje lvt_colors_complete.json sa dimenzijama iz extract_collection_descriptions.py output-a
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json
import os
from pathlib import Path
import re

def normalize_slug(slug):
    """Normalize slug to match format in lvt_colors_complete.json"""
    # Remove collection prefix if present
    slug = slug.replace('creation-30-new-collection-', '')
    # Extract color code and name
    match = re.search(r'(\d{4})-(.+?)(?:-\d+)?$', slug)
    if match:
        code = match.group(1)
        name = match.group(2).replace('-', '-').lower()
        return f"{name}-{code}"
    return slug

def find_color_by_code_and_name(colors, code, name_hint):
    """Find color by code and name hint"""
    for color in colors:
        if color.get('code') == code:
            # Check if name matches
            color_name = color.get('name', '').upper().replace('-', ' ').replace('_', ' ')
            name_upper = name_hint.upper().replace('-', ' ').replace('_', ' ')
            if name_upper in color_name or color_name in name_upper:
                return color
    return None

def find_color_by_slug(colors, target_slug):
    """Find color in colors array by matching slug"""
    # Try exact match first
    for color in colors:
        if color.get('slug') == target_slug:
            return color
    
    # Try normalized match
    normalized_target = normalize_slug(target_slug)
    for color in colors:
        normalized_color = normalize_slug(color.get('slug', ''))
        if normalized_color == normalized_target:
            return color
    
    # Try matching by code and name
    match = re.search(r'(\d{4})-(.+?)(?:-\d+)?$', target_slug)
    if match:
        code = match.group(1)
        name = match.group(2).replace('-', ' ').upper()
        for color in colors:
            if color.get('code') == code:
                # Check if name matches
                color_name = color.get('name', '').upper().replace('-', ' ').replace('_', ' ')
                if name in color_name or color_name in name:
                    return color
    
    return None

def update_lvt_colors_with_dimensions():
    """Update lvt_colors_complete.json with dimensions from extract_collection_descriptions.py output"""
    
    # Load current lvt_colors_complete.json
    lvt_json_path = Path('public/data/lvt_colors_complete.json')
    if not lvt_json_path.exists():
        print(f"❌ {lvt_json_path} ne postoji!")
        return
    
    with open(lvt_json_path, 'r', encoding='utf-8') as f:
        lvt_data = json.load(f)
    
    colors = lvt_data.get('colors', [])
    print(f"📊 Učitano {len(colors)} boja iz lvt_colors_complete.json")
    
    # Also check for creation_30_dimensions.json
    creation_30_dimensions_path = Path('downloads/creation_30_dimensions.json')
    if creation_30_dimensions_path.exists():
        print(f"\n📄 Obrađujem: creation_30_dimensions.json")
        with open(creation_30_dimensions_path, 'r', encoding='utf-8') as f:
            creation_30_data = json.load(f)
        
        for color_slug, specs in creation_30_data.items():
            if not specs:
                continue
            
            # Try to find color by matching slug patterns
            # color_slug format: "creation-30-new-collection-0347-ballerina-41870347"
            # We need to find color with slug: "ballerina-41870347"
            
            # Extract the color slug part (after collection prefix)
            color_slug_match = re.search(r'creation-30-new-collection-(\d{4})-(.+?)(?:-\d+)?$', color_slug)
            if color_slug_match:
                code = color_slug_match.group(1)
                name_part = color_slug_match.group(2)
                # Try to construct the expected slug format
                expected_slug = f"{name_part}-{code}"
                # Also try with full number suffix
                full_slug_match = re.search(r'creation-30-new-collection-(.+?)(-\d+)?$', color_slug)
                if full_slug_match:
                    expected_slug_full = full_slug_match.group(1)
            else:
                # Fallback: try to extract from end of slug
                parts = color_slug.split('-')
                if len(parts) >= 2:
                    expected_slug = '-'.join(parts[-2:])  # Last two parts
                else:
                    expected_slug = color_slug
            
            # Try to find color by slug
            color = find_color_by_slug(colors, expected_slug)
            
            if not color:
                # Try to find by code
                code_match = re.search(r'(\d{4})', color_slug)
                if code_match:
                    code = code_match.group(1)
                    # Extract name from slug
                    name_match = re.search(r'-\d{4}-(.+?)(?:-\d+)?$', color_slug)
                    name_hint = name_match.group(1) if name_match else ''
                    color = find_color_by_code_and_name(colors, code, name_hint)
            
            if color:
                if 'dimension' not in color or not color.get('dimension'):
                    if 'DIMENSION' in specs:
                        color['dimension'] = specs['DIMENSION']
                        print(f"  ✓ Dodata dimenzija za {color.get('full_name', color_slug)}: {specs['DIMENSION']}")
                        updated_count += 1
                
                if 'format' not in color or not color.get('format'):
                    if 'FORMAT' in specs:
                        color['format'] = specs['FORMAT']
                
                if 'overall_thickness' not in color or not color.get('overall_thickness'):
                    if 'OVERALL THICKNESS' in specs:
                        color['overall_thickness'] = specs['OVERALL THICKNESS']
    
    # Find all description JSON files
    descriptions_dir = Path('downloads/product_descriptions/lvt')
    if not descriptions_dir.exists():
        print(f"⚠️  {descriptions_dir} ne postoji, preskačem...")
    else:
    
    updated_count = 0
    total_specs_found = 0
    
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
            
            # Find matching color in lvt_colors_complete.json
            color = find_color_by_slug(colors, desc_slug)
            
            if not color:
                # Try alternative matching
                # Extract code from slug
                code_match = re.search(r'(\d{4})', desc_slug)
                if code_match:
                    code = code_match.group(1)
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
    print(f"\n💾 Čuvam ažurirani JSON...")
    with open(lvt_json_path, 'w', encoding='utf-8') as f:
        json.dump(lvt_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Gotovo!")
    print(f"  📊 Ukupno specs pronađeno: {total_specs_found}")
    print(f"  ✓ Ažurirano boja: {updated_count}")
    print(f"  📄 Sačuvano u: {lvt_json_path}")

if __name__ == '__main__':
    update_lvt_colors_with_dimensions()
