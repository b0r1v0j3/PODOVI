# -*- coding: utf-8 -*-
"""
Update gerflor-products-generated.ts to use correct codes instead of Unknown for creation-40-clic
"""
import re
import sys
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ts_file = Path('lib/data/gerflor-products-generated.ts')

# Mapping of Unknown names to codes
code_mapping = {
    'BALLERINA': '0347',
    'CEDAR BROWN': '0850',
    'CEDAR NATURAL': '1607',
    'HONEY OAK': '0441',
    'LONGBOARD': '0455',
    'QUARTET': '0503',
    'QUARTET HONEY': '0870',
    'RANCH': '0456',
    'TWIST': '0504',
    'WHITE LIME': '0584',
}

print("📝 Ažuriranje gerflor-products-generated.ts sa pravim šiframa...\n")

# Read file
with open(ts_file, 'r', encoding='utf-8') as f:
    content = f.read()

updated_count = 0

# Find and update products with Unknown codes in creation-40-clic
# Pattern: name: 'Unknown BALLERINA' or name: 'Unknown QUARTET', etc.
for name, code in code_mapping.items():
    # Pattern 1: name: 'Unknown BALLERINA'
    pattern1 = rf"name:\s*['\"]Unknown\s+{re.escape(name)}['\"]"
    replacement1 = f"name: '{code} {name}'"
    
    if re.search(pattern1, content):
        content = re.sub(pattern1, replacement1, content)
        updated_count += 1
        print(f"✅ Ažuriran: Unknown {name} -> {code} {name}")
    
    # Pattern 2: sku: 'Unknown' with name containing the color
    # Find products with sku: 'Unknown' and update based on name
    pattern2 = rf"sku:\s*['\"]Unknown['\"].*?name:\s*['\"](?:Unknown\s+)?{re.escape(name)}['\"]"
    # This is more complex, we'll handle it differently
    
    # Pattern 3: Update slug to use code
    pattern3 = rf"slug:\s*['\"]([^'\"]*creation-40-clic[^'\"]*Unknown[^'\"]*{re.escape(name.lower().replace(' ', '-'))}[^'\"]*)['\"]"
    def replace_slug(match):
        old_slug = match.group(1)
        new_slug = old_slug.replace('unknown-', f'{code}-').replace('Unknown-', f'{code}-')
        return f"slug: '{new_slug}'"
    
    if re.search(pattern3, content):
        content = re.sub(pattern3, replace_slug, content)
        updated_count += 1
        print(f"✅ Ažuriran slug za: {name}")

# Also update image URLs to use code instead of Unknown
for name, code in code_mapping.items():
    folder_name = name.lower().replace(' ', '-')
    # Pattern: /creation-40-clic/Unknown-ballerina/ -> /creation-40-clic/0347-ballerina/
    pattern = rf"/creation-40-clic/Unknown-{re.escape(folder_name)}/"
    replacement = f"/creation-40-clic/{code}-{folder_name}/"
    
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        updated_count += 1
        print(f"✅ Ažuriran image URL za: {name}")

# Update sku fields
for name, code in code_mapping.items():
    # Find products with name containing the color and sku: 'Unknown'
    # This requires more context, so we'll use a simpler approach
    pattern = rf"(sku:\s*['\"]Unknown['\"].*?name:\s*['\"](?:Unknown\s+)?{re.escape(name)}['\"])"
    def replace_sku(match):
        return match.group(1).replace("sku: 'Unknown'", f"sku: '{code}'")
    
    if re.search(pattern, content):
        content = re.sub(pattern, replace_sku, content)
        updated_count += 1
        print(f"✅ Ažuriran sku za: {name}")

if updated_count > 0:
    # Save updated file
    with open(ts_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\n✅ Ažurirano {updated_count} unosa u gerflor-products-generated.ts")
else:
    print("\n⚠️  Nisu pronađeni unosi za ažuriranje")
