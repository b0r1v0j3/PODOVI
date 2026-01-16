#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kompletna integracija svih podataka - agresivnija strategija pronalaženja boja
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def extract_code_from_slug(slug):
    """Extract 4-digit code from slug"""
    match = re.search(r'(\d{4})', slug)
    return match.group(1) if match else None

def find_color_aggressive(colors, extracted_color, collection_slug_from_file):
    """Agresivna strategija pronalaženja boja - pokušava sve moguće načine"""
    target_slug = extracted_color.get('slug', '').lower()
    target_url = extracted_color.get('url', '')
    
    # Strategy 1: Exact slug match
    for color in colors:
        if color.get('slug', '').lower() == target_slug:
            return color
    
    # Strategy 2: By code (najpouzdaniji)
    target_code = extract_code_from_slug(target_slug)
    if target_code:
        candidates = [c for c in colors if c.get('code') == target_code]
        
        if len(candidates) == 1:
            return candidates[0]
        elif len(candidates) > 1:
            # Filter by collection
            for c in candidates:
                c_collection = c.get('collection', '')
                if c_collection == collection_slug_from_file:
                    return c
            # Return first candidate
            return candidates[0]
    
    # Strategy 3: By name similarity
    # Extract name from slug (part after code)
    if target_code and target_code in target_slug:
        target_name_part = target_slug.split(target_code)[-1]
        target_name_part = re.sub(r'-\d+$', '', target_name_part)  # Remove trailing numbers
        target_name_words = [w for w in target_name_part.split('-') if len(w) > 3]
        
        for color in colors:
            color_name = color.get('name', '').lower()
            color_slug = color.get('slug', '').lower()
            # Check if any significant word from target matches
            if any(word in color_name or word in color_slug for word in target_name_words):
                color_code = color.get('code')
                # Also check code similarity (first 3 digits)
                if target_code and color_code and target_code[:3] == color_code[:3]:
                    return color
    
    return None

def update_color_aggressive(color, extracted_data):
    """Ažurira boju sa ekstraktovanim podacima - uvek ažurira"""
    updated = False
    
    # Update description
    description = extracted_data.get('description', {})
    if description:
        full_text = description.get('full_text')
        intro_text = description.get('intro_text')
        
        if full_text and isinstance(full_text, str):
            full_text = full_text.strip()
            if full_text and len(full_text) > 20:
                color['description'] = full_text
                updated = True
        elif intro_text and isinstance(intro_text, str):
            intro_text = intro_text.strip()
            if intro_text and len(intro_text) > 20:
                color['description'] = intro_text
                updated = True
    
    # Update specs (ako postoje)
    specs = extracted_data.get('specs', {})
    if specs and len(specs) > 0:
        # Map specs to color fields
        # Handle DIMENSION (can be direct or combined from WIDTH/LENGTH)
        if 'DIMENSION' in specs:
            dimension = specs['DIMENSION'].strip()
            if dimension:
                color['dimension'] = dimension
                updated = True
        elif 'WIDTH' in specs and 'LENGTH' in specs:
            # Combine WIDTH and LENGTH
            width = specs['WIDTH'].strip()
            length = specs['LENGTH'].strip()
            if width and length:
                color['dimension'] = f"{width} X {length}"
                updated = True
        elif 'WIDTH OF SHEET' in specs and 'LENGTH OF SHEET' in specs:
            width = specs['WIDTH OF SHEET'].strip()
            length = specs['LENGTH OF SHEET'].strip()
            if width and length:
                color['dimension'] = f"{width} X {length}"
                updated = True
        
        # Handle FORMAT (can be "FORMAT" or "FORMATS")
        if 'FORMAT' in specs:
            format_val = specs['FORMAT'].strip()
            if format_val:
                color['format'] = format_val
                updated = True
        elif 'FORMATS' in specs:
            format_val = specs['FORMATS'].strip()
            if format_val:
                color['format'] = format_val
                updated = True
        
        # Handle OVERALL THICKNESS
        if 'OVERALL THICKNESS' in specs:
            thickness = specs['OVERALL THICKNESS'].strip()
            if thickness:
                color['overall_thickness'] = thickness
                updated = True
        
        # Handle WELDING ROD
        if 'WELDING ROD' in specs or 'WELDING ROD REF.' in specs:
            welding_rod = specs.get('WELDING ROD') or specs.get('WELDING ROD REF.', '')
            if welding_rod:
                welding_rod = welding_rod.strip()
                if welding_rod:
                    color['welding_rod'] = welding_rod
                    updated = True
    
    return updated

def process_file(colors_file_path, colors_complete_path):
    """Process one collection file"""
    collection_slug_from_file = colors_file_path.stem.replace('_colors', '')
    
    print(f"\n📦 {colors_file_path.name}")
    
    # Load files
    with open(colors_file_path, 'r', encoding='utf-8') as f:
        extracted_data = json.load(f)
    
    with open(colors_complete_path, 'r', encoding='utf-8') as f:
        colors_data = json.load(f)
    
    colors = colors_data.get('colors', [])
    extracted_colors = extracted_data.get('colors', [])
    
    updated_count = 0
    not_found_count = 0
    
    # Build code index
    colors_by_code = {}
    for color in colors:
        code = color.get('code')
        if code:
            if code not in colors_by_code:
                colors_by_code[code] = []
            colors_by_code[code].append(color)
    
    for extracted_color in extracted_colors:
        color = find_color_aggressive(colors, extracted_color, collection_slug_from_file)
        
        if color:
            if update_color_aggressive(color, extracted_color):
                updated_count += 1
        else:
            not_found_count += 1
    
    # Save
    if updated_count > 0:
        with open(colors_complete_path, 'w', encoding='utf-8') as f:
            json.dump(colors_data, f, indent=2, ensure_ascii=False)
        print(f"  ✅ Ažurirano: {updated_count}/{len(extracted_colors)}")
    
    if not_found_count > 0:
        print(f"  ⚠️  Nije pronađeno: {not_found_count}")
    
    return updated_count, not_found_count

def main():
    print("="*80)
    print("KOMPLETNA AGRESIVNA INTEGRACIJA")
    print("="*80)
    
    lvt_dir = Path('downloads/product_descriptions/lvt')
    linoleum_dir = Path('downloads/product_descriptions/linoleum')
    lvt_complete = Path('public/data/lvt_colors_complete.json')
    linoleum_complete = Path('public/data/linoleum_colors_complete.json')
    
    total_updated = 0
    total_not_found = 0
    
    # Process LVT
    print(f"\n🎨 LVT KOLEKCIJE")
    print("-"*80)
    for file in sorted(lvt_dir.glob('*_colors.json')):
        updated, not_found = process_file(file, lvt_complete)
        total_updated += updated
        total_not_found += not_found
    
    # Process Linoleum
    print(f"\n🌿 LINOLEUM KOLEKCIJE")
    print("-"*80)
    for file in sorted(linoleum_dir.glob('*_colors.json')):
        updated, not_found = process_file(file, linoleum_complete)
        total_updated += updated
        total_not_found += not_found
    
    print("\n" + "="*80)
    print("✅ ZAVRŠENO!")
    print("="*80)
    print(f"   ✓ Ažurirano: {total_updated}")
    print(f"   ⚠️  Nije pronađeno: {total_not_found}")

if __name__ == '__main__':
    main()
