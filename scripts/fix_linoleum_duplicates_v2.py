#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix duplicate content in linoleum products - improved version
1. Merge duplicate "Neocare površinska obrada" items
2. Fix broken items (split across lines)
"""

import re
import sys

def fix_linoleum_products():
    file_path = 'lib/data/linoleum-products.ts'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix broken items (split across lines)
    # Pattern: item ending with ( and next line starting with text)
    content = re.sub(
        r"'([^']*\([^)]*)\n\s+'([^']*\))'",
        r"'\1\2'",
        content
    )
    
    # Fix items that are just continuation text (no label)
    # Pattern: 'text' followed by 'more text' where first doesn't end with :
    content = re.sub(
        r"'([^:']+)',\n\s+'([^']+)',",
        lambda m: f"'{m.group(1)}: {m.group(2)}'," if not m.group(1).endswith(':') else f"'{m.group(1)}',\n          '{m.group(2)}',",
        content
    )
    
    # Now merge Neocare items
    def merge_neocare_section(match):
        section_content = match.group(0)
        
        # Find all Neocare items
        neocare_items = re.findall(r"'Neocare površinska obrada: ([^']+)'", section_content)
        other_items = []
        
        # Extract all items
        all_items = re.findall(r"'([^']+)'", section_content)
        
        for item in all_items:
            if item.startswith('Neocare površinska obrada:'):
                continue  # Skip, we'll add merged version
            elif item in ['mat efekat', 'lako održavanje i nizak ukupni trošak vlasništva']:
                continue  # Skip parts of Neocare
            else:
                other_items.append(item)
        
        # Merge Neocare benefits
        neocare_benefits = []
        if 'mat efekat' in ' '.join(neocare_items) or any('mat' in item.lower() for item in neocare_items):
            neocare_benefits.append('mat efekat')
        if any('održavanje' in item.lower() or 'trošak' in item.lower() for item in neocare_items):
            neocare_benefits.append('lako održavanje i nizak ukupni trošak vlasništva')
        
        # If we found Neocare items, create merged version
        if neocare_benefits:
            merged_neocare = f"'Neocare površinska obrada: {', '.join(neocare_benefits)}'"
            # Insert merged Neocare at the beginning of other items
            other_items.insert(0, merged_neocare.strip("'"))
        
        # Rebuild items array
        items_str = ",\n          ".join([f"'{item}'" if not item.startswith("'") else item for item in other_items])
        
        return f"items: [\n          {items_str},\n        ],"
    
    # Apply to each detailsSections
    content = re.sub(
        r"items: \[\n          (.*?),\n        \],",
        merge_neocare_section,
        content,
        flags=re.DOTALL
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Fixed duplicate content in linoleum products (v2)")

if __name__ == '__main__':
    fix_linoleum_products()
