#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Updates mock-data.ts with Packaging specs aggregated from lvt_colors_complete.json
"""

import sys
import json
import re
from pathlib import Path
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

def main():
    json_path = Path("public/data/lvt_colors_complete.json")
    ts_path = Path("lib/data/mock-data.ts")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Aggregate packaging by collection slug
    # Collection slug in JSON might match 'collection' field or derived from it.
    # In mock-data.ts, slug is 'gerflor-creation-30'.
    # In JSON, colors have 'collection': 'creation-30'.
    # Mapping: 'gerflor-' + json_collection
    
    pkg_by_coll = {}
    
    for c in data.get('colors', []):
        coll = c.get('collection')
        specs = c.get('specs', {})
        pkg = specs.get('packaging')
        
        if coll and pkg:
            if coll not in pkg_by_coll:
                pkg_by_coll[coll] = []
            pkg_by_coll[coll].append(pkg)
            
    # Calculate most common packaging per collection
    final_pkg_map = {}
    for coll, pkgs in pkg_by_coll.items():
        # pkgs is list of strings like "15 kom/kutija (3.36 m²)"
        # Find most common
        most_common = Counter(pkgs).most_common(1)[0][0]
        final_pkg_map[coll] = most_common
        print(f"Collection {coll}: {most_common}")

    # Read mock-data.ts
    with open(ts_path, 'r', encoding='utf-8') as f:
        ts_content = f.read()
        
    # Define collections to update (IDs 8 to 25 usually)
    # We look for "slug: 'gerflor-creation-XX'" and then the "specs: [" block
    
    # Strategy: Iterate over all matches of products in TS
    # This is tricky with regex regex finding nested structures.
    # We'll simple look for slug line, then look ahead for specs array closing bracket.
    
    # Split by product objects roughly?
    # Or just iterate through the file line by line statefully.
    
    lines = ts_content.split('\n')
    new_lines = []
    
    current_slug = None
    in_specs = False
    
    for i, line in enumerate(lines):
        # Detect slug
        slug_match = re.search(r"slug:\s*'([^']+)'", line)
        if slug_match:
            current_slug = slug_match.group(1)
            # Map gerflor-creation-30 -> creation-30
            if current_slug.startswith('gerflor-'):
                current_slug = current_slug.replace('gerflor-', '')
        
        # Detect start of specs
        if "specs: [" in line:
            in_specs = True
            
        # Detect end of specs (indentation based or '],')
        if in_specs and "]," in line:
            # We are closing specs. Check if we need to add packaging.
            # Only for Gerflor (active current_slug in our map)
            if current_slug in final_pkg_map:
                pkg_val = final_pkg_map[current_slug]
                # Check if already added
                # We can't easily check previous lines efficiently here without buffering, 
                # but we assume clean run.
                
                # Format: { key: 'packaging', label: 'Pakovanje', value: '15 kom/kutija (3.36 m²)' },
                new_spec_line = f"      {{ key: 'packaging', label: 'Pakovanje', value: '{pkg_val}' }},"
                new_lines.append(new_spec_line)
                print(f"  -> Added spec to {current_slug}")
            
            in_specs = False
            current_slug = None # Reset so we don't accidentally add to wrong product if logic fails
            
        new_lines.append(line)
        
    with open(ts_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
        
    print("Done updating mock-data.ts")

if __name__ == "__main__":
    main()
