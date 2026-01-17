#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract collection descriptions and specs from mock-data.ts and merge into JSON files
"""

import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def extract_collection_data_from_mockdata():
    """Extract collection info from mock-data.ts"""
    mock_data_path = Path("lib/data/mock-data.ts")
    
    with open(mock_data_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    collections = {}
    
    # Pattern to extract each product object
    # Look for: slug: 'gerflor-creation-XX', then description and specs
    pattern = r"slug:\s*'(gerflor-creation-[^']+)'.*?description:\s*[`'\"](.*?)[`'\"].*?specs:\s*\[(.*?)\]"
    
    matches = re.finditer(pattern, content, re.DOTALL)
    
    for match in matches:
        slug = match.group(1)
        description = match.group(2)
        specs_str = match.group(3)
        
        # Extract collection name from slug (gerflor-creation-30 -> creation-30)
        collection = slug.replace('gerflor-', '')
        
        # Parse specs array
        specs = []
        spec_pattern = r"\{\s*key:\s*'([^']+)',\s*label:\s*'([^']+)',\s*value:\s*'([^']+)'\s*\}"
        for spec_match in re.finditer(spec_pattern, specs_str):
            specs.append({
                'key': spec_match.group(1),
                'label': spec_match.group(2),
                'value': spec_match.group(3)
            })
        
        # Clean description (remove escape characters)
        description = description.replace('\\n', '\n').replace("\\'", "'").replace('\\"', '"')
        description = description.replace('\\\\', '\\')
        
        collections[collection] = {
            'slug': collection,
            'description': description.strip(),
            'specs': specs
        }
        
        print(f"Extracted: {collection}")
    
    return collections

def merge_into_lvt_json(collections):
    """Merge collection data into lvt_colors_complete.json"""
    json_path = Path("public/data/lvt_colors_complete.json")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    colors = data.get('colors', [])
    updated = 0
    
    for color in colors:
        collection = color.get('collection')
        if collection in collections:
            # ALWAYS overwrite description with the latest from mock-data.ts
            color['description'] = collections[collection]['description']
            updated += 1
            
            # Add collection-level specs (merge with existing color specs)
            if 'collection_specs' not in color:
                color['collection_specs'] = collections[collection]['specs']
                updated += 1
    
    # Save
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Updated {updated} color entries in lvt_colors_complete.json")
    return updated

def main():
    print("="*80)
    print("ENRICHING JSON FILES WITH COLLECTION DATA")
    print("="*80)
    print()
    
    # Step 1: Extract from mock-data.ts
    print("📖 Extracting collection data from mock-data.ts...")
    collections = extract_collection_data_from_mockdata()
    print(f"   Found {len(collections)} collections\n")
    
    # Step 2: Merge into LVT JSON
    print("📝 Merging into lvt_colors_complete.json...")
    merge_into_lvt_json(collections)
    
    print("\n" + "="*80)
    print("✅ DONE!")
    print("="*80)

if __name__ == "__main__":
    main()
