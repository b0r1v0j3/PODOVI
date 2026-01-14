# -*- coding: utf-8 -*-
"""
Remove or fix products with Unknown codes that don't have valid images
"""
import json
import sys
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

json_path = Path('public/data/lvt_colors_complete.json')
base_images_path = Path('public/images/products/lvt/colors')

# Load JSON
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total colors: {len(data['colors'])}\n")

# Find Unknown codes
unknown_colors = [c for c in data['colors'] if c.get('code') == 'Unknown']
print(f"Unknown code products: {len(unknown_colors)}\n")

# Check which ones have valid images
valid_unknown = []
invalid_unknown = []

for color in unknown_colors:
    texture_url = color.get('texture_url') or color.get('image_url')
    if texture_url:
        # Remove query string and decode
        clean_url = texture_url.split('?')[0]
        try:
            from urllib.parse import unquote
            clean_url = unquote(clean_url)
        except:
            pass
        
        # Check if file exists
        if clean_url.startswith('/images/products/lvt/colors/'):
            rel_path = clean_url[len('/images/products/lvt/colors/'):]
            file_path = base_images_path / rel_path
            
            if file_path.exists():
                valid_unknown.append(color)
            else:
                invalid_unknown.append(color)
        else:
            invalid_unknown.append(color)
    else:
        invalid_unknown.append(color)

print(f"Unknown with valid images: {len(valid_unknown)}")
print(f"Unknown without valid images: {len(invalid_unknown)}\n")

# Option 1: Remove invalid Unknown codes
if invalid_unknown:
    print("Removing invalid Unknown code products...")
    data['colors'] = [c for c in data['colors'] if c not in invalid_unknown]
    print(f"Removed {len(invalid_unknown)} invalid Unknown products")
    
    # Save
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Updated JSON - removed {len(invalid_unknown)} Unknown products")
else:
    print("✅ All Unknown products have valid images")
