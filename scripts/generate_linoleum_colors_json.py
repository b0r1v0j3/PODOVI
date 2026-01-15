#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generiši linoleum_colors_complete.json iz scraped podataka
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json
from pathlib import Path
import re

CHARACTERISTICS_LABELS = {
    "Surface treatment": "Površinska obrada",
    "Overall thickness": "Ukupna debljina",
    "Thickness of the wearlayer": "Debljina habajućeg sloja",
    "Installation system covering": "Tip instalacije",
    "Format details": "Format",
    "Width of sheet": "Širina rolne",
    "Length of sheet": "Dužina rolne",
    "NCS": "NCS",
    "LRV": "LRV",
    "Slip Resistance": "Otpornost na klizanje",
    "Fire rating": "Otpornost na požar",
}

def parse_dimension_parts(value: str):
    if not value:
        return None, None
    # Examples: "2 m X 31.0 m", "2m x 31m"
    match = re.search(r'(\d+(?:[.,]\d+)?)\s*m\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*m', value)
    if not match:
        return None, None
    width = match.group(1).replace(',', '.')
    length = match.group(2).replace(',', '.')
    return f"{width} m", f"{length} m"

print("="*80)
print("GENERISANJE linoleum_colors_complete.json")
print("="*80)

# Load scraped data
with open('scripts/gerflor_linoleum_clean.json', encoding='utf-8') as f:
    data = json.load(f)

colors = data['colors']
collections = data['collections']

# Output folder
images_folder = Path("public/images/products/linoleum")

# Build colors array
linoleum_colors = []

for color in colors:
    if not color.get('code'):
        continue
    
    # Find collection
    collection_name = color.get('collection', '')
    collection_slug = ""
    
    for coll in collections:
        if coll['name'] == collection_name or color['url'] in coll.get('colors', []):
            collection_slug = coll['slug']
            break
    
    # If not found, extract from URL
    if not collection_slug:
        url_slug = color['url'].split('/')[-1]
        # Extract collection part from URL (before the 4-digit code)
        match = re.search(r'(dlw-[a-z-]+?)-\d{4}', url_slug)
        if match:
            collection_slug = match.group(1)
        else:
            # Fallback: take first 3 parts
            parts = url_slug.split('-')
            collection_slug = '-'.join(parts[:3]) if len(parts) >= 3 else url_slug
    
    # Color folder
    color_name_slug = color['name'].lower().replace(' ', '-')
    color_slug = f"{color['code']}-{color_name_slug}"
    color_folder = images_folder / collection_slug / color_slug
    
    # Find images in color folder
    image_files = []
    if color_folder.exists():
        image_files = list(color_folder.glob("*.jpg")) + list(color_folder.glob("*.jpeg")) + list(color_folder.glob("*.png"))
    
    # Primary image (first one found)
    primary_image = ""
    if image_files:
        primary_image = f"/images/products/linoleum/{collection_slug}/{color_slug}/{image_files[0].name}"
    
    # Find collection name (full name, not slug)
    collection_full_name = collection_name
    for coll in collections:
        if coll['slug'] == collection_slug:
            collection_full_name = coll['name']
            break
    
    # Build characteristics (Serbian labels)
    specs = color.get('specs', {}) or {}
    scraped_characteristics = color.get('characteristics', {}) or {}
    dimension_val = specs.get('DIMENSION', '')
    format_val = specs.get('FORMAT', '')
    thickness_val = specs.get('OVERALL THICKNESS', '')
    welding_rod = specs.get('WELDING ROD REF.', '')
    width_val, length_val = parse_dimension_parts(dimension_val)

    characteristics = {}
    for key, value in scraped_characteristics.items():
        if not value:
            continue
        label = CHARACTERISTICS_LABELS.get(key, key)
        characteristics[label] = value

    if format_val and "Format" not in characteristics:
        characteristics["Format"] = format_val
    if thickness_val and "Ukupna debljina" not in characteristics:
        characteristics["Ukupna debljina"] = thickness_val
    if dimension_val and "Dimenzije" not in characteristics:
        characteristics["Dimenzije"] = dimension_val
    if width_val and "Širina rolne" not in characteristics:
        characteristics["Širina rolne"] = width_val
    if length_val and "Dužina rolne" not in characteristics:
        characteristics["Dužina rolne"] = length_val
    if welding_rod and "Šifra šipke za varenje" not in characteristics:
        characteristics["Šifra šipke za varenje"] = welding_rod
    characteristics.setdefault("Tip", "Linoleum")
    characteristics.setdefault("Tip instalacije", "Lepljenje")
    characteristics.setdefault("Površinska obrada", "Neocare")

    # Build color entry
    color_entry = {
        "collection": collection_slug,
        "collection_name": collection_full_name,
        "code": color['code'],
        "name": color['name'],
        "full_name": f"{color['code']} {color['name']}",
        "slug": color_slug,
        "image_url": primary_image,
        "texture_url": primary_image,  # Same as primary for now
        "image_count": len(image_files),
        "welding_rod": welding_rod,
        "dimension": dimension_val,
        "format": format_val,
        "overall_thickness": thickness_val,
        "characteristics": characteristics,
    }
    
    linoleum_colors.append(color_entry)

print(f"\nGenerirano: {len(linoleum_colors)} boja")

# Save to public/data/
output_path = Path("public/data/linoleum_colors_complete.json")
output_path.parent.mkdir(parents=True, exist_ok=True)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(linoleum_colors, f, indent=2, ensure_ascii=False)

print(f"✓ Sačuvano u: {output_path}")

# Statistics
print("\n" + "="*80)
print("STATISTIKA:")
print("="*80)

# Group by collection
from collections import defaultdict
by_collection = defaultdict(int)
for color in linoleum_colors:
    by_collection[color['collection']] += 1

for coll, count in sorted(by_collection.items()):
    print(f"{coll[:40]:.<40} {count:>3} boja")

print(f"\n{'UKUPNO':.>40} {len(linoleum_colors):>3} boja")
