#!/usr/bin/env python3
"""
Reload all image paths from actual files in pod folders.
This script will:
1. Scan all pod folders for actual JPG files
2. Update TS file to use correct filenames
3. Skip ilustracija folders (only use pod)
"""

import re
from pathlib import Path

base_path = Path('public/images/products/lvt/colors')
ts_file = Path('lib/data/gerflor-products-generated.ts')

print("Reading gerflor-products-generated.ts...")
ts_content = ts_file.read_text(encoding='utf-8')

# Find all image URLs
pattern = r"(url: '/images/products/lvt/colors/([^/]+)/([^/]+)/pod/)([^']+\.jpg)"
matches = list(re.finditer(pattern, ts_content))

print(f"Found {len(matches)} image URLs\n")

fixes = []
errors = []
skipped = []

for match in matches:
    full_match = match.group(0)
    base_url = match.group(1)
    collection = match.group(2)
    color_folder = match.group(3)
    old_filename = match.group(4)
    
    pod_path = base_path / collection / color_folder / 'pod'
    
    if not pod_path.exists():
        errors.append(f"{collection}/{color_folder}: pod folder does not exist")
        continue
    
    # Get actual JPG files from pod folder
    pod_files = list(pod_path.glob('*.jpg'))
    
    if not pod_files:
        errors.append(f"{collection}/{color_folder}/pod: No JPG files found")
        continue
    
    # Use first JPG file found
    actual_file = pod_files[0].name
    
    # Skip if filename contains "ilustracija" - this is wrong
    if 'ilustracija' in actual_file.lower():
        skipped.append(f"{collection}/{color_folder}: File in pod folder has 'ilustracija' in name: {actual_file}")
        continue
    
    # Update if different
    if actual_file != old_filename:
        new_url = f"{base_url}{actual_file}"
        fixes.append((full_match, new_url, f"{collection}/{color_folder}: {old_filename} -> {actual_file}"))

# Report
print("=" * 70)
print("ANALYSIS RESULTS")
print("=" * 70)

if skipped:
    print(f"\nSkipped (ilustracija in pod folder): {len(skipped)}")
    for item in skipped[:5]:
        print(f"  {item}")
    if len(skipped) > 5:
        print(f"  ... and {len(skipped) - 5} more")

if errors:
    print(f"\nErrors: {len(errors)}")
    for error in errors[:10]:
        print(f"  {error}")
    if len(errors) > 10:
        print(f"  ... and {len(errors) - 10} more")

if fixes:
    print(f"\nFixes to apply: {len(fixes)}")
    for old, new, desc in fixes[:10]:
        print(f"  {desc}")
    if len(fixes) > 10:
        print(f"  ... and {len(fixes) - 10} more")
    
    # Apply fixes
    print(f"\nApplying {len(fixes)} fixes...")
    for old_url, new_url, desc in fixes:
        ts_content = ts_content.replace(old_url, new_url)
    
    ts_file.write_text(ts_content, encoding='utf-8')
    print(f"[OK] Fixed {len(fixes)} image paths")
else:
    print("\nNo fixes needed - all paths are correct!")

print("\nDone!")
