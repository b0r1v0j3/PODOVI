# -*- coding: utf-8 -*-
"""
Add LONGBOARD code (0455) for creation-40-clic
"""
import json
import sys
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

json_path = Path('public/data/lvt_colors_complete.json')
base_images_path = Path('public/images/products/lvt/colors/creation-40-clic')

# Load JSON
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print("📝 Dodajem LONGBOARD (0455) za creation-40-clic...\n")

folder_name = "Unknown-longboard"
color_name = "LONGBOARD"
code = "0455"

# Check if entry already exists
exists = False
for color in data['colors']:
    if (color['collection'] == 'creation-40-clic' and 
        color.get('code') == code and
        color.get('name', '').upper() == color_name):
        exists = True
        print(f"⚠️  Proizvod već postoji: {code} {color_name}")
        break

if not exists:
    # Create new entry
    new_folder_name = f"{code}-long-board"  # Standard format
    
    new_color = {
        "collection": "creation-40-clic",
        "collection_name": "Creation 40 Clic",
        "code": code,
        "name": color_name,
        "full_name": f"{code} {color_name}",
        "slug": f"longboard-{code}",
        "image_url": "",
        "texture_url": "",
        "image_count": 1,
        "lifestyle_url": ""
    }
    
    # Check if images exist in Unknown-longboard folder
    old_folder_path = base_images_path / folder_name
    new_folder_path = base_images_path / new_folder_name
    
    if old_folder_path.exists():
        pod_path = old_folder_path / 'pod'
        ilustracija_path = old_folder_path / 'ilustracija'
        
        if pod_path.exists():
            pod_images = list(pod_path.glob('*.jpg'))
            if pod_images:
                new_color['texture_url'] = f"/images/products/lvt/colors/creation-40-clic/{folder_name}/pod/{pod_images[0].name}?v=9"
                new_color['image_url'] = new_color['texture_url']
        
        if ilustracija_path.exists():
            ilustracija_images = list(ilustracija_path.glob('*.jpg'))
            if ilustracija_images:
                new_color['lifestyle_url'] = f"/images/products/lvt/colors/creation-40-clic/{folder_name}/ilustracija/{ilustracija_images[0].name}?v=9"
    
    data['colors'].append(new_color)
    
    # Save updated JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Dodato: {code} {color_name}")
    print(f"   Folder: {folder_name}")
    print(f"   Image URL: {new_color.get('texture_url', 'N/A')}")
else:
    print("ℹ️  Nije potrebno dodavanje")
