# -*- coding: utf-8 -*-
"""
Find product codes for Unknown products by matching names with other collections
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

print("🔍 Tražim šifre za Unknown proizvode na osnovu drugih kolekcija...\n")

# Get Unknown folders
unknown_folders = []
if base_images_path.exists():
    for folder in base_images_path.iterdir():
        if folder.is_dir() and folder.name.startswith('Unknown-'):
            color_name = folder.name.replace('Unknown-', '').replace('-', ' ').upper()
            unknown_folders.append({
                'folder': folder.name,
                'name': color_name
            })

print(f"Pronađeno {len(unknown_folders)} Unknown foldera:\n")
for uf in unknown_folders:
    print(f"  - {uf['folder']} -> {uf['name']}")

# Build a map of name -> code from all other collections
name_to_code = {}
for color in data['colors']:
    if color.get('code') and color.get('code') != 'Unknown':
        name_upper = color.get('name', '').upper()
        if name_upper:
            # Store code for this name (may have multiple, but we'll use the most common)
            if name_upper not in name_to_code:
                name_to_code[name_upper] = []
            name_to_code[name_upper].append(color.get('code'))

# Also try partial matches (e.g., "QUARTET" matches "QUARTET DARK BROWN")
name_variants = {}
for color in data['colors']:
    if color.get('code') and color.get('code') != 'Unknown':
        name_upper = color.get('name', '').upper()
        if name_upper:
            # Extract first word or key words
            words = name_upper.split()
            for word in words:
                if len(word) > 3:  # Skip short words
                    if word not in name_variants:
                        name_variants[word] = []
                    if color.get('code') not in name_variants[word]:
                        name_variants[word].append(color.get('code'))

print(f"\n📊 Pronađeno {len(name_to_code)} jedinstvenih imena sa šiframa")
print(f"📊 Pronađeno {len(name_variants)} varijanti imena\n")

# Match Unknown folders with found codes
matches = []
for uf in unknown_folders:
    folder_name = uf['name']
    
    # Try exact match first
    if folder_name in name_to_code:
        codes = name_to_code[folder_name]
        if codes:
            code = codes[0]  # Use first found code
            matches.append({
                'folder': uf['folder'],
                'name': folder_name,
                'code': code,
                'match_type': 'exact'
            })
            print(f"✅ Exact match: {uf['folder']} -> {code} {folder_name}")
            continue
    
    # Try partial match
    words = folder_name.split()
    for word in words:
        if word in name_variants and len(word) > 3:
            codes = name_variants[word]
            if codes:
                code = codes[0]
                matches.append({
                    'folder': uf['folder'],
                    'name': folder_name,
                    'code': code,
                    'match_type': f'partial ({word})'
                })
                print(f"✅ Partial match: {uf['folder']} -> {code} {folder_name} (matched on '{word}')")
                break

if matches:
    print(f"\n📝 Ažuriranje JSON-a sa {len(matches)} pronađenim šiframa...")
    
    # Update JSON - add entries for these products
    updated_count = 0
    for match in matches:
        folder_name = match['folder']
        new_code = match['code']
        color_name = match['name']
        
        # Check if entry already exists
        exists = False
        for color in data['colors']:
            if (color['collection'] == 'creation-40-clic' and 
                color.get('code') == new_code and
                color.get('name', '').upper() == color_name):
                exists = True
                break
        
        if not exists:
            # Create new entry
            new_color = {
                "collection": "creation-40-clic",
                "collection_name": "Creation 40 Clic",
                "code": new_code,
                "name": color_name,
                "full_name": f"{new_code} {color_name}",
                "slug": f"{color_name.lower().replace(' ', '-')}-{new_code}",
                "image_url": f"/images/products/lvt/colors/creation-40-clic/{folder_name}/pod/{folder_name}-pod.jpg?v=9",
                "texture_url": f"/images/products/lvt/colors/creation-40-clic/{folder_name}/pod/{folder_name}-pod.jpg?v=9",
                "image_count": 1,
                "lifestyle_url": f"/images/products/lvt/colors/creation-40-clic/{folder_name}/ilustracija/{folder_name}-ilustracija.jpg?v=9"
            }
            
            # Check if images actually exist
            pod_path = base_images_path / folder_name / 'pod'
            ilustracija_path = base_images_path / folder_name / 'ilustracija'
            
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
            updated_count += 1
            print(f"  ✅ Dodato: {new_code} {color_name}")
    
    if updated_count > 0:
        # Save updated JSON
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\n✅ JSON ažuriran sa {updated_count} novim proizvodima")
    else:
        print("\n⚠️  Nisu dodati novi proizvodi (već postoje ili nema slika)")
else:
    print("\n⚠️  Nisu pronađeni match-evi. Možda treba ručno proveriti.")
