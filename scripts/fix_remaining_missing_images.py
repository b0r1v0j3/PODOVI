# -*- coding: utf-8 -*-
"""
Fix remaining missing images by checking actual file structure
"""
import json
import sys
from pathlib import Path
from urllib.parse import unquote, quote

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

json_path = Path('public/data/lvt_colors_complete.json')
missing_path = Path('tmp/missing-images.json')
base_images_path = Path('public/images/products/lvt/colors')

# Load JSON
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Load missing images
with open(missing_path, 'r', encoding='utf-8') as f:
    missing_data = json.load(f)

print(f"Total missing: {len(missing_data['missing'])}\n")

fixed_count = 0
processed = set()

for missing in missing_data['missing']:
    collection = missing['collection']
    code = missing['code']
    name = missing['name']
    checked_path = Path(missing['checkedPath'])
    
    key = (collection, code, name)
    if key in processed:
        continue
    processed.add(key)
    
    # Decode the path to check actual files
    actual_path = checked_path
    if not actual_path.exists():
        # Try to find similar files in parent folder
        parent = actual_path.parent
        if parent.exists():
            # Look for any JPG files
            jpg_files = list(parent.glob('*.jpg')) + list(parent.glob('*.JPG'))
            if jpg_files:
                # Use first found file
                actual_file = jpg_files[0]
                # Reconstruct URL
                rel_path = actual_file.relative_to(Path('public'))
                new_url = f"/{rel_path.as_posix()}?v=9"
                
                # Update JSON
                for color in data['colors']:
                    if (color['collection'] == collection and 
                        color['code'] == code and 
                        color['name'] == name):
                        if color.get('texture_url') != new_url:
                            color['texture_url'] = new_url
                            color['image_url'] = new_url
                            fixed_count += 1
                            print(f"✅ Fixed: {collection} / {code} {name}")
                            print(f"   Found: {actual_file.name}")
                            break
                continue
    
    # Check if file exists with different encoding
    decoded_path = unquote(str(checked_path))
    if Path(decoded_path).exists() and decoded_path != str(checked_path):
        # File exists but with different encoding
        rel_path = Path(decoded_path).relative_to(Path('public'))
        new_url = f"/{rel_path.as_posix()}?v=9"
        
        # Update JSON
        for color in data['colors']:
            if (color['collection'] == collection and 
                color['code'] == code and 
                color['name'] == name):
                if color.get('texture_url') != new_url:
                    color['texture_url'] = new_url
                    color['image_url'] = new_url
                    fixed_count += 1
                    print(f"✅ Fixed encoding: {collection} / {code} {name}")
                    break

print(f"\nFixed: {fixed_count}")

# Save updated JSON
if fixed_count > 0:
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Updated JSON saved")
else:
    print("\n⚠️  No fixes applied")
