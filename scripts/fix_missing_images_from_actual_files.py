# -*- coding: utf-8 -*-
"""
Fix missing images by finding actual files in folders and updating JSON
"""
import json
import sys
from pathlib import Path
from urllib.parse import quote

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

json_path = Path('public/data/lvt_colors_complete.json')
missing_path = Path('tmp/missing-images.json')
base_images_path = Path('public/images/products/lvt/colors')

# Load JSON
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Load missing images report
with open(missing_path, 'r', encoding='utf-8') as f:
    missing_data = json.load(f)

print(f"Total missing images: {len(missing_data['missing'])}\n")

fixed_count = 0
still_missing = []

# Group by collection and code to avoid duplicates
processed = set()

for missing in missing_data['missing']:
    collection = missing['collection']
    code = missing['code']
    name = missing['name']
    checked_path = Path(missing['checkedPath'])
    
    # Skip if already processed
    key = (collection, code, name)
    if key in processed:
        continue
    processed.add(key)
    
    # Check if parent folder exists
    parent_folder = checked_path.parent
    
    if not parent_folder.exists():
        # Try to find the actual folder
        collection_path = base_images_path / collection
        if collection_path.exists():
            # Look for folders that might match
            possible_folders = []
            
            if code and code != 'Unknown':
                name_slug = name.lower().replace(' ', '-')
                possible_folders.append(f"{code}-{name_slug}")
                possible_folders.append(code)
            
            name_slug = name.lower().replace(' ', '-')
            possible_folders.append(name_slug)
            
            # Try to find matching folder
            actual_folder = None
            for folder_name in possible_folders:
                folder_path = collection_path / folder_name
                if folder_path.exists():
                    actual_folder = folder_name
                    break
            
            if actual_folder:
                # Find image in that folder
                pod_folder = collection_path / actual_folder / 'pod'
                if pod_folder.exists():
                    images = list(pod_folder.glob('*.jpg'))
                    if images:
                        # Update JSON
                        image_name = images[0].name
                        new_url = f"/images/products/lvt/colors/{collection}/{actual_folder}/pod/{quote(image_name)}?v=9"
                        
                        # Find and update in JSON
                        for color in data['colors']:
                            if (color['collection'] == collection and 
                                color['code'] == code and 
                                color['name'] == name):
                                color['texture_url'] = new_url
                                color['image_url'] = new_url
                                fixed_count += 1
                                print(f"✅ Fixed: {collection} / {code} {name}")
                                print(f"   New URL: {new_url}")
                                break
                        continue
            
            still_missing.append(missing)
            continue
    
    # Parent folder exists, check for images
    if parent_folder.exists():
        images = list(parent_folder.glob('*.jpg'))
        if images:
            # Use first image found
            image_name = images[0].name
            # Reconstruct URL
            rel_path = parent_folder.relative_to(base_images_path.parent.parent.parent)
            new_url = f"/{rel_path.as_posix()}/{quote(image_name)}?v=9"
            
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
                        break
        else:
            still_missing.append(missing)
    else:
        still_missing.append(missing)

print(f"\nFixed: {fixed_count}")
print(f"Still missing: {len(still_missing)}")

# Save updated JSON
if fixed_count > 0:
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Updated JSON saved")
else:
    print("\n⚠️  No fixes applied")
