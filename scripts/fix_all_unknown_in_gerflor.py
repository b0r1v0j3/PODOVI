# -*- coding: utf-8 -*-
"""
Fix all Unknown codes in gerflor-products-generated.ts for creation-40-clic
"""
import re
import sys
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ts_file = Path('lib/data/gerflor-products-generated.ts')

# Mapping
mappings = [
    {'name': '0347 BALLERINA', 'code': '0347', 'folder': '0347-ballerina', 'old_folder': 'collection-ballerina'},
    {'name': '0503 QUARTET', 'code': '0503', 'folder': '0503-quartet', 'old_folder': 'collection-quartet'},
    {'name': '0456 RANCH', 'code': '0456', 'folder': '0456-ranch', 'old_folder': 'collection-ranch'},
    {'name': '0504 TWIST', 'code': '0504', 'folder': '0504-twist', 'old_folder': 'collection-twist'},
    {'name': '0850 CEDAR BROWN', 'code': '0850', 'folder': '0850-cedar-brown', 'old_folder': 'cedar-brown'},
    {'name': '1607 CEDAR NATURAL', 'code': '1607', 'folder': '1607-cedar-natural', 'old_folder': 'cedar-natural'},
    {'name': '0441 HONEY OAK', 'code': '0441', 'folder': '0441-honey-oak', 'old_folder': 'honey-oak'},
    {'name': '0455 LONGBOARD', 'code': '0455', 'folder': '0455-long-board', 'old_folder': 'longboard'},
    {'name': '0870 QUARTET HONEY', 'code': '0870', 'folder': '0870-quartet-honey', 'old_folder': 'quartet-honey'},
    {'name': '0584 WHITE LIME', 'code': '0584', 'folder': '0584-white-lime', 'old_folder': 'white-lime'},
]

print("📝 Ažuriranje svih Unknown proizvoda u gerflor-products-generated.ts...\n")

# Read file
with open(ts_file, 'r', encoding='utf-8') as f:
    content = f.read()

updated_count = 0

for mapping in mappings:
    name = mapping['name']
    code = mapping['code']
    folder = mapping['folder']
    old_folder = mapping['old_folder']
    
    # Fix sku
    pattern_sku = rf"(sku:\s*['\"])Unknown(['\"].*?name:\s*['\"]{re.escape(name)}['\"])"
    if re.search(pattern_sku, content):
        content = re.sub(pattern_sku, rf"\1{code}\2", content)
        updated_count += 1
        print(f"✅ sku: {name}")
    
    # Fix description
    pattern_desc = rf"(description:\s*['\"][^'\"]*\(Šifra:\s*)Unknown([^'\"]*['\"].*?name:\s*['\"]{re.escape(name)}['\"])"
    if re.search(pattern_desc, content):
        content = re.sub(pattern_desc, rf"\1{code}\2", content)
        updated_count += 1
        print(f"✅ description: {name}")
    
    # Fix specs code
    pattern_specs = rf"(specs:.*?code['\"],\s*value:\s*['\"])Unknown(['\"].*?name:\s*['\"]{re.escape(name)}['\"])"
    if re.search(pattern_specs, content, re.DOTALL):
        content = re.sub(pattern_specs, rf"\1{code}\2", content, flags=re.DOTALL)
        updated_count += 1
        print(f"✅ specs: {name}")
    
    # Fix image URL - try multiple old folder patterns
    old_patterns = [
        f"/creation-40-clic/{old_folder}.jpg",
        f"/creation-40-clic/{old_folder}/",
        f"/creation-40-clic/Unknown-{old_folder}/",
        f"/creation-40-clic/collection-{old_folder}/",
    ]
    
    for old_pattern in old_patterns:
        pattern_url = rf"(url:\s*['\"])([^'\"]*{re.escape(old_pattern)}[^'\"]*)(['\"].*?name:\s*['\"]{re.escape(name)}['\"])"
        if re.search(pattern_url, content):
            new_url = f"/images/products/lvt/colors/creation-40-clic/{folder}/pod/{folder}-pod.jpg?v=9"
            content = re.sub(pattern_url, rf"\1{new_url}\3", content)
            updated_count += 1
            print(f"✅ image URL: {name}")
            break

if updated_count > 0:
    # Save updated file
    with open(ts_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\n✅ Ažurirano {updated_count} unosa")
else:
    print("\n⚠️  Nisu pronađeni unosi za ažuriranje")
