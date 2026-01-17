#!/usr/bin/env python3
"""
Script to ensure "Dimenzije" is the first key in characteristics for all carpet colors.
"""

import json
import sys
from pathlib import Path

def fix_dimensions_first(json_file_path: str):
    """Add 'Dimenzije' as first key in characteristics for all carpet colors."""
    
    file_path = Path(json_file_path)
    if not file_path.exists():
        print(f"[ERROR] File not found: {json_file_path}")
        sys.exit(1)
    
    # Load JSON
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    colors = data.get('colors', [])
    if not colors:
        print("[ERROR] No colors found in JSON file")
        sys.exit(1)
    
    fixed_count = 0
    
    for color in colors:
        if 'characteristics' not in color or not isinstance(color['characteristics'], dict):
            continue
        
        # Get dimension value from color.dimension or from characteristics
        dimension_value = color.get('dimension') or color['characteristics'].get('Dimenzije')
        
        if not dimension_value:
            print(f"[WARNING] No dimension found for color {color.get('slug', 'unknown')}")
            continue
        
        # Create new characteristics dict with "Dimenzije" first
        new_characteristics = {}
        
        # Add "Dimenzije" first
        new_characteristics['Dimenzije'] = dimension_value
        
        # Copy all existing characteristics except "Dimenzije" (if it exists)
        for key, value in color['characteristics'].items():
            if key != 'Dimenzije':  # Skip if already exists
                new_characteristics[key] = value
        
        # Update the color's characteristics
        color['characteristics'] = new_characteristics
        fixed_count += 1
        
        print(f"[OK] Fixed: {color.get('slug', 'unknown')} - Dimenzije first")
    
    # Save updated JSON
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n[SUCCESS] Fixed {fixed_count} colors")
    print(f"[SUCCESS] Updated file: {json_file_path}")

if __name__ == '__main__':
    json_file = 'public/data/carpet_tiles_complete.json'
    fix_dimensions_first(json_file)
