#!/usr/bin/env python3
"""
Fix all creation-55-clic products with Unknown codes and wrong paths
"""

import re
from pathlib import Path

ts_file = Path('lib/data/gerflor-products-generated.ts')
base_path = Path('public/images/products/lvt/colors/creation-55-clic')

# Mapping: (code, folder_name, color_name)
fixes_data = [
    ('1606', 'Unknown-cedar-golden', 'CEDAR GOLDEN'),
    ('1274', 'Unknown-lounge-oak-chestnut', 'LOUNGE OAK CHESTNUT'),
    ('0347', 'Unknown-ballerina', 'BALLERINA'),
    ('0503', 'Unknown-quartet', 'QUARTET'),
    ('0456', 'Unknown-ranch', 'RANCH'),
    ('0504', 'Unknown-twist', 'TWIST'),
    ('1605', 'Unknown-cedar-dark-brown', 'CEDAR DARK BROWN'),
    ('1271', 'Unknown-lounge-oak-golden', 'LOUNGE OAK GOLDEN'),
    ('0441', 'Unknown-honey-oak', 'HONEY OAK'),
    ('0455', 'Unknown-longboard', 'LONGBOARD'),
    ('1273', 'Unknown-lounge-oak-natural-eir', 'LOUNGE OAK NATURAL EIR'),
    ('0870', 'Unknown-quartet-honey', 'QUARTET HONEY'),
    ('0584', 'Unknown-white-lime', 'WHITE LIME'),
]

print("Reading gerflor-products-generated.ts...")
ts_content = ts_file.read_text(encoding='utf-8')

fixes = []

for code, folder_name, color_name in fixes_data:
    # Check if folder exists
    folder_path = base_path / folder_name / 'pod'
    if not folder_path.exists():
        print(f"  WARNING: {folder_name} does not exist")
        continue
    
    pod_files = list(folder_path.glob('*.jpg'))
    if not pod_files:
        print(f"  WARNING: No JPG files in {folder_name}/pod")
        continue
    
    actual_file = pod_files[0].name
    new_url = f"/images/products/lvt/colors/creation-55-clic/{folder_name}/pod/{actual_file}?v=9"
    
    # Find and fix products
    # Pattern to match product with this color
    patterns = [
        # Pattern 1: Direct color name match
        rf"(id: 'creation-55-clic-[^']+',\s+name: '[^']*{re.escape(color_name)}[^']*',\s+slug: '[^']+',\s+sku: 'Unknown',[^}}]+?url: '([^']+)',[^}}]+?alt: '{re.escape(color_name)}',[^}}]+?specs: \[([^\]]+)\])",
        # Pattern 2: Collection- prefix
        rf"(id: 'creation-55-clic-collection-[^']+',\s+name: '{code} {re.escape(color_name)}',\s+slug: '[^']+',\s+sku: 'Unknown',[^}}]+?url: '([^']+)',[^}}]+?alt: '{re.escape(color_name)}',[^}}]+?specs: \[([^\]]+)\])",
    ]
    
    for pattern in patterns:
        matches = list(re.finditer(pattern, ts_content, re.DOTALL))
        for match in matches:
            product_block = match.group(0)
            old_url = match.group(1) if len(match.groups()) > 0 else ''
            specs = match.group(2) if len(match.groups()) > 1 else ''
            
            # Update product
            new_block = product_block.replace(f"sku: 'Unknown'", f"sku: '{code}'")
            if old_url:
                new_block = new_block.replace(old_url, new_url)
            
            # Update name if it starts with Unknown
            new_block = re.sub(rf"name: 'Unknown {re.escape(color_name)}'", rf"name: '{code} {color_name}'", new_block)
            
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
