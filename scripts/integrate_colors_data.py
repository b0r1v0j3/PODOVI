#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Integriše podatke iz *_colors.json fajlova u lvt_colors_complete.json i linoleum_colors_complete.json
Ažurira description i specs za svaku boju
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def normalize_color_slug(slug):
    """Normalize color slug to match format in colors_complete.json"""
    # Remove collection prefix
    slug = slug.lower()
    
    # Extract color code and name
    # Format: creation-30-new-collection-0347-ballerina-41870347
    # or: dlw-marmorette-2-mm-0347-ballerina-41870347
    # or: creation-70-zen-0953-ranch-anthracite-39220953
    match = re.search(r'(\d{4})-(.+?)(?:-\d+)?$', slug)
    if match:
        code = match.group(1)
        name = match.group(2).replace('-', ' ').strip()
        # Remove any trailing numbers (like -39220953)
        name = re.sub(r'\s+\d+$', '', name)
        return f"{name}-{code}".lower()
    
    return slug

def find_color_in_colors(colors, target_slug, target_url):
    """Find color in colors array by matching slug or URL"""
    target_slug_lower = target_slug.lower()
    
    # Try exact slug match first
    for color in colors:
        if color.get('slug', '').lower() == target_slug_lower:
            return color
    
    # Try to extract code from target_slug and match by code (most reliable)
    # Format: creation-70-zen-0953-ranch-anthracite-39220953 -> code: 0953
    code_match = re.search(r'(\d{4})', target_slug)
    if code_match:
        target_code = code_match.group(1)
        
        # Find all colors with matching code
        candidates = [c for c in colors if c.get('code') == target_code]
        
        if len(candidates) == 1:
            # Only one match - return it
            return candidates[0]
        elif len(candidates) > 1:
            # Multiple matches - try to find best match by name
            # Extract name parts from target_slug (after code)
            target_after_code = target_slug_lower.split(target_code)[-1] if target_code in target_slug_lower else ''
            target_name_parts = [p for p in re.findall(r'[a-z]+', target_after_code) if len(p) > 3]
            
            for candidate in candidates:
                color_name = candidate.get('name', '').lower()
                # Check if any name part matches
                if any(part in color_name for part in target_name_parts):
                    return candidate
                # Check if slug ends match
                color_slug = candidate.get('slug', '').lower()
                if target_after_code and any(part in color_slug for part in target_name_parts):
                    return candidate
            
            # If no name match, return first candidate (better than nothing)
            return candidates[0]
    
    # Try normalized slug match
    normalized_target = normalize_color_slug(target_slug)
    for color in colors:
        normalized_color = normalize_color_slug(color.get('slug', ''))
        if normalized_color == normalized_target:
            return color
    
    # Try URL match
    if target_url:
        for color in colors:
            if color.get('url') == target_url:
                return color
    
    return None

def update_color_data(color, extracted_data):
    """Update color with extracted description and specs"""
    updated = False
    
    # Update description
    description = extracted_data.get('description', {})
    if description:
        # Use full_text if available, otherwise intro_text
        full_text = description.get('full_text')
        intro_text = description.get('intro_text')
        
        if full_text and isinstance(full_text, str):
            full_text = full_text.strip()
            if full_text:
                if not color.get('description') or color.get('description') != full_text:
                    color['description'] = full_text
                    updated = True
        elif intro_text and isinstance(intro_text, str):
            intro_text = intro_text.strip()
            if intro_text:
                if not color.get('description') or color.get('description') != intro_text:
                    color['description'] = intro_text
                    updated = True
    
    # Update specs
    specs = extracted_data.get('specs', {})
    if specs:
        # Map specs to color fields
        if 'DIMENSION' in specs:
            dimension = specs['DIMENSION'].strip()
            if not color.get('dimension') or color.get('dimension') != dimension:
                color['dimension'] = dimension
                updated = True
        
        if 'FORMAT' in specs:
            format_val = specs['FORMAT'].strip()
            if not color.get('format') or color.get('format') != format_val:
                color['format'] = format_val
                updated = True
        
        if 'OVERALL THICKNESS' in specs:
            thickness = specs['OVERALL THICKNESS'].strip()
            if not color.get('overall_thickness') or color.get('overall_thickness') != thickness:
                color['overall_thickness'] = thickness
                updated = True
        
        if 'WELDING ROD' in specs or 'WELDING ROD REF.' in specs:
            welding_rod = specs.get('WELDING ROD') or specs.get('WELDING ROD REF.', '')
            if welding_rod:
                welding_rod = welding_rod.strip()
                if not color.get('welding_rod') or color.get('welding_rod') != welding_rod:
                    color['welding_rod'] = welding_rod
                    updated = True
    
    return updated

def process_collection_file(colors_file_path, colors_complete_path, collection_type):
    """Process one collection file and update colors_complete.json"""
    print(f"\n📦 Obrađujem: {colors_file_path.name}")
    
    # Extract collection slug from filename (e.g., "creation-70-megaclic_colors.json" -> "creation-70-megaclic")
    collection_slug_from_file = colors_file_path.stem.replace('_colors', '')
    
    # Load extracted colors data
    with open(colors_file_path, 'r', encoding='utf-8') as f:
        extracted_data = json.load(f)
    
    # Load colors_complete.json
    with open(colors_complete_path, 'r', encoding='utf-8') as f:
        colors_data = json.load(f)
    
    colors = colors_data.get('colors', [])
    if not colors:
        print(f"  ⚠️  Nema boja u {colors_complete_path.name}")
        return 0, 0
    
    updated_count = 0
    not_found_count = 0
    
    extracted_colors = extracted_data.get('colors', [])
    print(f"  📊 Ekstraktovano boja: {len(extracted_colors)}")
    
    # Build index by code for faster lookup
    colors_by_code = {}
    for color in colors:
        code = color.get('code')
        if code:
            if code not in colors_by_code:
                colors_by_code[code] = []
            colors_by_code[code].append(color)
    
    for extracted_color in extracted_colors:
        color_slug = extracted_color.get('slug', '')
        color_url = extracted_color.get('url', '')
        
        # First try to find by code (most reliable)
        color = None
        code_match = re.search(r'(\d{4})', color_slug)
        if code_match:
            target_code = code_match.group(1)
            candidates = colors_by_code.get(target_code, [])
            
            if len(candidates) == 1:
                color = candidates[0]
            elif len(candidates) > 1:
                # Multiple matches - try to find by collection
                # First try exact collection match
                for candidate in candidates:
                    candidate_collection = candidate.get('collection', '')
                    if candidate_collection == collection_slug_from_file:
                        color = candidate
                        break
                
                # If no exact match, try normalized match
                if not color:
                    normalized_collection = collection_slug_from_file.replace('-megaclic', '').replace('-clic', '').replace('-looselay', '').replace('-zen', '').replace('-new-collection', '').replace('-acoustic', '')
                    for candidate in candidates:
                        candidate_collection = candidate.get('collection', '')
                        normalized_candidate = candidate_collection.replace('-megaclic', '').replace('-clic', '').replace('-looselay', '').replace('-zen', '').replace('-new-collection', '').replace('-acoustic', '')
                        if normalized_candidate == normalized_collection:
                            color = candidate
                            break
                
                # If still no match, try partial match
                if not color:
                    for candidate in candidates:
                        candidate_collection = candidate.get('collection', '')
                        if collection_slug_from_file in candidate_collection or candidate_collection in collection_slug_from_file:
                            color = candidate
                            break
                
                # If still no match, use first candidate (better than nothing)
                if not color:
                    color = candidates[0]
        
        # If not found by code, try other methods
        if not color:
            color = find_color_in_colors(colors, color_slug, color_url)
        
        if color:
            if update_color_data(color, extracted_color):
                updated_count += 1
        else:
            not_found_count += 1
            print(f"    ⚠️  Nije pronađena boja: {color_slug}")
    
    # Save updated colors_complete.json
    if updated_count > 0:
        with open(colors_complete_path, 'w', encoding='utf-8') as f:
            json.dump(colors_data, f, indent=2, ensure_ascii=False)
        print(f"  ✅ Ažurirano: {updated_count} boja")
    
    if not_found_count > 0:
        print(f"  ⚠️  Nije pronađeno: {not_found_count} boja")
    
    return updated_count, not_found_count

def main():
    """Main function"""
    print("="*80)
    print("INTEGRACIJA PODATAKA IZ EKSTRAKCIJE")
    print("="*80)
    
    lvt_dir = Path('downloads/product_descriptions/lvt')
    linoleum_dir = Path('downloads/product_descriptions/linoleum')
    
    lvt_colors_complete = Path('public/data/lvt_colors_complete.json')
    linoleum_colors_complete = Path('public/data/linoleum_colors_complete.json')
    
    total_updated = 0
    total_not_found = 0
    
    # Process LVT collections
    if lvt_dir.exists() and lvt_colors_complete.exists():
        print(f"\n🎨 OBRADA LVT KOLEKCIJA")
        print("-"*80)
        
        lvt_files = list(lvt_dir.glob('*_colors.json'))
        for colors_file in lvt_files:
            updated, not_found = process_collection_file(
                colors_file, 
                lvt_colors_complete, 
                'lvt'
            )
            total_updated += updated
            total_not_found += not_found
    
    # Process Linoleum collections
    if linoleum_dir.exists() and linoleum_colors_complete.exists():
        print(f"\n🌿 OBRADA LINOLEUM KOLEKCIJA")
        print("-"*80)
        
        linoleum_files = list(linoleum_dir.glob('*_colors.json'))
        for colors_file in linoleum_files:
            updated, not_found = process_collection_file(
                colors_file, 
                linoleum_colors_complete, 
                'linoleum'
            )
            total_updated += updated
            total_not_found += not_found
    
    print("\n" + "="*80)
    print("✅ INTEGRACIJA ZAVRŠENA!")
    print("="*80)
    print(f"\n📊 Rezime:")
    print(f"   ✓ Ažurirano: {total_updated} boja")
    print(f"   ⚠️  Nije pronađeno: {total_not_found} boja")

if __name__ == '__main__':
    main()
