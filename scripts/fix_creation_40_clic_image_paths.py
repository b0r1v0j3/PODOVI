#!/usr/bin/env python3
"""
Fix image paths in gerflor-products-generated.ts for creation-40-clic collection
by matching actual file names in the filesystem.
"""

import os
import re
from pathlib import Path

# Base path for images
base_path = Path('public/images/products/lvt/colors/creation-40-clic')

# Read the TypeScript file
ts_file = Path('lib/data/gerflor-products-generated.ts')
content = ts_file.read_text(encoding='utf-8')

# Find all creation-40-clic image URLs
pattern = r"(url: '/images/products/lvt/colors/creation-40-clic/([^/]+)/pod/)([^']+\.jpg)"
matches = list(re.finditer(pattern, content))

print(f"Found {len(matches)} image URLs for creation-40-clic")

replacements = []

for match in matches:
    folder_name = match.group(2)
    old_filename = match.group(3)
    full_path = base_path / folder_name / 'pod'
    
    if full_path.exists():
        # Get actual file name
        files = list(full_path.glob('*.jpg'))
        if files:
            actual_filename = files[0].name
            if actual_filename != old_filename:
                old_url = match.group(0)
                new_url = f"{match.group(1)}{actual_filename}"
                replacements.append((old_url, new_url))
                print(f"  {folder_name}: {old_filename} -> {actual_filename}")

# Apply replacements
if replacements:
    for old_url, new_url in replacements:
        content = content.replace(old_url, new_url)
    
    ts_file.write_text(content, encoding='utf-8')
    print(f"\nFixed {len(replacements)} image paths")
else:
    print("\nNo paths need fixing")
