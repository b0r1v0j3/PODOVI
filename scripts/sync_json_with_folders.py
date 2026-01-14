# -*- coding: utf-8 -*-
"""
Sync JSON with actual folder structure - update image URLs based on what's actually in folders
"""
import json
import sys
from pathlib import Path
from urllib.parse import quote

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

json_path = Path('public/data/lvt_colors_complete.json')
base_images_path = Path('public/images/products/lvt/colors')

# Load JSON
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total colors: {len(data['colors'])}\n")

updated_count = 0

for color in data['colors']:
    collection = color['collection']
    code = color['code']
    name = color['name']
    
    # Build expected folder path
    name_slug = name.lower().replace(' ', '-').replace('/', '-')
    folder_name = f"{code}-{name_slug}" if code and code != 'Unknown' else name_slug
    
    collection_path = base_images_path / collection / folder_name
    
    if not collection_path.exists():
        # Try alternative folder names
        alternatives = [
            f"{code}-{name.lower().replace(' ', '-')}",
            name.lower().replace(' ', '-'),
            code if code and code != 'Unknown' else None
        ]
        for alt in alternatives:
            if alt:
                alt_path = base_images_path / collection / alt
                if alt_path.exists():
                    collection_path = alt_path
                    folder_name = alt
                    break
    
    if collection_path.exists():
        # Check for pod image
        pod_folder = collection_path / 'pod'
        if pod_folder.exists():
            pod_images = list(pod_folder.glob('*.jpg')) + list(pod_folder.glob('*.JPG'))
            if pod_images:
                pod_image = pod_images[0]
                pod_url = f"/images/products/lvt/colors/{collection}/{folder_name}/pod/{quote(pod_image.name)}?v=9"
                
                # Update if different
                if color.get('texture_url') != pod_url:
                    color['texture_url'] = pod_url
                    color['image_url'] = pod_url
                    updated_count += 1
                    print(f"✅ Updated pod: {collection} / {code} {name}")
        
        # Check for ilustracija image
        ilustracija_folder = collection_path / 'ilustracija'
        if ilustracija_folder.exists():
            ilustracija_images = list(ilustracija_folder.glob('*.jpg')) + list(ilustracija_folder.glob('*.JPG'))
            if ilustracija_images:
                ilustracija_image = ilustracija_images[0]
                ilustracija_url = f"/images/products/lvt/colors/{collection}/{folder_name}/ilustracija/{quote(ilustracija_image.name)}?v=9"
                
                # Update if different
                if color.get('lifestyle_url') != ilustracija_url:
                    color['lifestyle_url'] = ilustracija_url
                    updated_count += 1
                    print(f"✅ Updated ilustracija: {collection} / {code} {name}")

print(f"\nUpdated: {updated_count} entries")

# Save updated JSON
if updated_count > 0:
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Updated JSON saved")
else:
    print("\n⚠️  No updates needed")
