#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dodaj wrapper linoleum JSON-u da bude kao LVT JSON
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json

# Load current linoleum colors
with open('public/data/linoleum_colors_complete.json', encoding='utf-8') as f:
    colors = json.load(f)

# Count collections
collections = set(c['collection'] for c in colors)

# Create wrapped structure
wrapped_data = {
    "total": len(colors),
    "collections": len(collections),
    "colors": colors
}

# Save
with open('public/data/linoleum_colors_complete.json', 'w', encoding='utf-8') as f:
    json.dump(wrapped_data, f, indent=2, ensure_ascii=False)

print("✓ Linoleum JSON ažuriran sa wrapper-om")
print(f"  Total: {len(colors)}")
print(f"  Collections: {len(collections)}")
