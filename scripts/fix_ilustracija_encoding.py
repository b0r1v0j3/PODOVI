# -*- coding: utf-8 -*-
"""
Fix ilustracija images with special characters in filenames
Many ilustracija URLs have %26 for & which needs to be decoded
"""
import json
import sys
from pathlib import Path
from urllib.parse import unquote, quote

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

json_path = Path('public/data/lvt_colors_complete.json')
base_images_path = Path('public/images/products/lvt/colors')

# Load JSON
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total colors: {len(data['colors'])}\n")

fixed_count = 0

for color in data['colors']:
    lifestyle_url = color.get('lifestyle_url')
    
    if lifestyle_url:
        # Decode URL to check actual file
        decoded_url = unquote(lifestyle_url.split('?')[0])
        
        # Check if decoded file exists
        if decoded_url.startswith('/images/products/lvt/colors/'):
            rel_path = decoded_url[len('/images/products/lvt/colors/'):]
            file_path = base_images_path / rel_path
            
            # If decoded file exists but URL is encoded, update it
            if file_path.exists() and '%' in lifestyle_url:
                # Use decoded URL
                new_url = decoded_url + ('?v=9' if '?v=' in lifestyle_url else '?v=9')
                if lifestyle_url != new_url:
                    color['lifestyle_url'] = new_url
                    fixed_count += 1
                    print(f"✅ Fixed: {color['collection']} / {color['code']} {color['name']}")
                    print(f"   {lifestyle_url[:80]}...")
                    print(f"   → {new_url[:80]}...")

print(f"\nFixed: {fixed_count} ilustracija URLs")

# Save updated JSON
if fixed_count > 0:
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Updated JSON saved")
else:
    print("\n⚠️  No fixes applied")
