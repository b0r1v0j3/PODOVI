# -*- coding: utf-8 -*-
"""
Complete fix for gerflor-products-generated.ts - update sku, description, specs, and image URLs
"""
import re
import sys
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ts_file = Path('lib/data/gerflor-products-generated.ts')

# Mapping of names to codes
code_mapping = {
    '0347 BALLERINA': '0347',
    '0850 CEDAR BROWN': '0850',
    '1607 CEDAR NATURAL': '1607',
    '0441 HONEY OAK': '0441',
    '0455 LONGBOARD': '0455',
    '0503 QUARTET': '0503',
    '0870 QUARTET HONEY': '0870',
    '0456 RANCH': '0456',
    '0504 TWIST': '0504',
    '0584 WHITE LIME': '0584',
}

# Folder mapping (old folder names to new)
folder_mapping = {
    'BALLERINA': '0347-ballerina',
    'CEDAR BROWN': '0850-cedar-brown',
    'CEDAR NATURAL': '1607-cedar-natural',
    'HONEY OAK': '0441-honey-oak',
    'LONGBOARD': '0455-long-board',
    'QUARTET': '0503-quartet',
    'QUARTET HONEY': '0870-quartet-honey',
    'RANCH': '0456-ranch',
    'TWIST': '0504-twist',
    'WHITE LIME': '0584-white-lime',
}

print("📝 Kompletno ažuriranje gerflor-products-generated.ts...\n")

# Read file
with open(ts_file, 'r', encoding='utf-8') as f:
    content = f.read()

updated_count = 0

# Fix each product
for name, code in code_mapping.items():
    color_name = name.split(' ', 1)[1] if ' ' in name else name
    folder_name = folder_mapping.get(color_name, f"{code}-{color_name.lower().replace(' ', '-')}")
    
    # Pattern to find the product block
    # Look for products with creation-40-clic and the color name
    pattern = rf"(id:\s*['\"]creation-40-clic[^'\"]*{color_name.lower().replace(' ', '-')}[^'\"]*['\"].*?sku:\s*['\"])Unknown(['\"].*?description:\s*['\"][^'\"]*\(Šifra:\s*)Unknown([^'\"]*['\"].*?url:\s*['\"])([^'\"]*)(['\"].*?specs:.*?code['\"],\s*value:\s*['\"])Unknown(['\"])"
    
    def replace_product(match):
        nonlocal updated_count
        updated_count += 1
        
        sku_part = match.group(1)
        desc_part1 = match.group(2)
        desc_part2 = match.group(3)
        url_part1 = match.group(4)
        old_url = match.group(5)
        url_part2 = match.group(6)
        specs_part1 = match.group(7)
        specs_part2 = match.group(8)
        
        # Update URL - check if it's the old format
        new_url = old_url
        if 'collection-' in old_url or 'Unknown-' in old_url:
            # Update to new folder structure
            new_url = f"/images/products/lvt/colors/creation-40-clic/{folder_name}/pod/{folder_name}-pod.jpg?v=9"
        
        return (f"{sku_part}{code}{desc_part1}{desc_part2}{code}{desc_part2}{url_part1}{new_url}{url_part2}{specs_part1}{code}{specs_part2}")
    
    # Try the complex pattern first
    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, replace_product, content, flags=re.DOTALL)
        print(f"✅ Ažuriran kompletan proizvod: {name}")
    else:
        # Try simpler patterns
        # Fix sku
        pattern_sku = rf"(sku:\s*['\"])Unknown(['\"].*?name:\s*['\"]{re.escape(name)}['\"])"
        if re.search(pattern_sku, content):
            content = re.sub(pattern_sku, rf"\1{code}\2", content)
            updated_count += 1
            print(f"✅ Ažuriran sku: {name}")
        
        # Fix description
        pattern_desc = rf"(description:\s*['\"][^'\"]*\(Šifra:\s*)Unknown([^'\"]*['\"].*?name:\s*['\"]{re.escape(name)}['\"])"
        if re.search(pattern_desc, content):
            content = re.sub(pattern_desc, rf"\1{code}\2", content)
            updated_count += 1
            print(f"✅ Ažuriran description: {name}")
        
        # Fix specs code
        pattern_specs = rf"(specs:.*?code['\"],\s*value:\s*['\"])Unknown(['\"].*?name:\s*['\"]{re.escape(name)}['\"])"
        if re.search(pattern_specs, content, re.DOTALL):
            content = re.sub(pattern_specs, rf"\1{code}\2", content, flags=re.DOTALL)
            updated_count += 1
            print(f"✅ Ažuriran specs: {name}")
        
        # Fix image URL
        pattern_url = rf"(url:\s*['\"])([^'\"]*creation-40-clic[^'\"]*(?:collection-|Unknown-){color_name.lower().replace(' ', '-')}[^'\"]*)(['\"].*?name:\s*['\"]{re.escape(name)}['\"])"
        if re.search(pattern_url, content):
            new_url = f"/images/products/lvt/colors/creation-40-clic/{folder_name}/pod/{folder_name}-pod.jpg?v=9"
            content = re.sub(pattern_url, rf"\1{new_url}\3", content)
            updated_count += 1
            print(f"✅ Ažuriran image URL: {name}")

if updated_count > 0:
    # Save updated file
    with open(ts_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\n✅ Ažurirano {updated_count} unosa u gerflor-products-generated.ts")
else:
    print("\n⚠️  Nisu pronađeni unosi za ažuriranje")
