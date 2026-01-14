#!/usr/bin/env python3
"""
Complete fix for all creation-55-clic products with Unknown codes and wrong paths
"""

import re
from pathlib import Path

ts_file = Path('lib/data/gerflor-products-generated.ts')
base_path = Path('public/images/products/lvt/colors/creation-55-clic')

# Mapping: color name -> code
fixes_map = {
    'LOUNGE OAK BEIGE': ('1272', 'Unknown-lounge-oak-beige'),
    'CEDAR BROWN': ('0850', 'Unknown-cedar-brown'),
    'CEDAR GOLDEN': ('1606', 'Unknown-cedar-golden'),
    'LOUNGE OAK CHESTNUT': ('1274', 'Unknown-lounge-oak-chestnut'),
    'BALLERINA': ('0347', 'Unknown-ballerina'),
    'QUARTET': ('0503', 'Unknown-quartet'),
    'RANCH': ('0456', 'Unknown-ranch'),
    'TWIST': ('0504', 'Unknown-twist'),
    'CEDAR DARK BROWN': ('1605', 'Unknown-cedar-dark-brown'),
    'LOUNGE OAK GOLDEN': ('1271', 'Unknown-lounge-oak-golden'),
    'HONEY OAK': ('0441', 'Unknown-honey-oak'),
    'LONGBOARD': ('0455', 'Unknown-longboard'),
    'LOUNGE OAK NATURAL EIR': ('1273', 'Unknown-lounge-oak-natural-eir'),
    'QUARTET HONEY': ('0870', 'Unknown-quartet-honey'),
    'WHITE LIME': ('0584', 'Unknown-white-lime'),
}

print("Reading gerflor-products-generated.ts...")
ts_content = ts_file.read_text(encoding='utf-8')

fixes = []

# Fix each product
for color_name, (code, folder_name) in fixes_map.items():
    # Find products with this color
    pattern = rf"(id: 'creation-55-clic-[^']+',\s+name: '[^']*{re.escape(color_name)}[^']*',\s+slug: '[^']+',\s+sku: 'Unknown',[^}}]+?url: '([^']+)',[^}}]+?alt: '{re.escape(color_name)}',[^}}]+?specs: \[([^\]]+)\])"
    matches = list(re.finditer(pattern, ts_content, re.DOTALL))
    
    for match in matches:
        product_block = match.group(0)
        old_url = match.group(1)
        
        # Check if Unknown- folder exists
        unknown_folder = base_path / folder_name / 'pod'
        if unknown_folder.exists():
            pod_files = list(unknown_folder.glob('*.jpg'))
            if pod_files:
                actual_file = pod_files[0].name
                new_url = f"/images/products/lvt/colors/creation-55-clic/{folder_name}/pod/{actual_file}?v=9"
                
                # Update product
                new_block = product_block.replace(f"sku: 'Unknown'", f"sku: '{code}'")
                new_block = new_block.replace(old_url, new_url)
                
                # Update name if it starts with Unknown
                new_block = re.sub(r"name: 'Unknown ([^']+)'", rf"name: '{code} \1'", new_block)
                
                # Update description
                new_block = new_block.replace(f"(Šifra: Unknown)", f"(Šifra: {code})")
                
                # Update specs
                new_block = new_block.replace("'Unknown'", f"'{code}'")
                
                fixes.append((product_block, new_block, f"{color_name}: Unknown -> {code}"))

# Apply fixes
if fixes:
    print(f"\nApplying {len(fixes)} fixes...")
    for old, new, desc in fixes:
        print(f"  {desc}")
        ts_content = ts_content.replace(old, new)
    
    ts_file.write_text(ts_content, encoding='utf-8')
    print(f"\n[OK] Fixed {len(fixes)} products")
else:
    print("\nNo fixes to apply")

print("\nDone!")
