#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix duplicate content in linoleum products:
1. Remove "98% prirodnih sastojaka" from description/shortDescription (already in detailsSections)
2. Merge duplicate "Neocare površinska obrada" items in detailsSections
"""

import re
import sys

def fix_linoleum_products():
    file_path = 'lib/data/linoleum-products.ts'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix 1: Remove "98% prirodnih sastojaka" from descriptions
    # Replace various patterns
    patterns = [
        (r"description: 'Visokoperformansno podno rešenje zasnovano na 98% prirodnih sastojaka!'", 
         "description: 'Visokoperformansno podno rešenje za komercijalne i stambene prostore'"),
        (r"description: 'Visokoperformansno podno rešenje zasnovano na 98% prirodnih sastojaka uz 19 dB zvučne izolacije!'", 
         "description: 'Visokoperformansno podno rešenje sa zvučnom izolacijom od 19 dB'"),
        (r"description: 'Visokoperformansno podno rešenje sa modernim terrazzo dizajnom, zasnovano na 98% prirodnih sastojaka!'", 
         "description: 'Visokoperformansno podno rešenje sa modernim terrazzo dizajnom'"),
        (r"description: 'Visokoperformansno podno rešenje sa modernim urbanim industrijskim dizajnom, zasnovano na 98% prirodnih sastojaka!'", 
         "description: 'Visokoperformansno podno rešenje sa modernim urbanim industrijskim dizajnom'"),
        (r"description: 'Najjače rešenje u DLW Linoleum asortimanu, zasnovano na 98% prirodnih sastojaka'", 
         "description: 'Najjače rešenje u DLW Linoleum asortimanu'"),
        (r"description: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom, zasnovano na 98% prirodnih sastojaka!'", 
         "description: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom'"),
        (r"description: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom i 15 dB zvučne izolacije, zasnovano na 98% prirodnih sastojaka!'", 
         "description: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom i 15 dB zvučne izolacije'"),
        (r"description: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom i disipativnim svojstvima, zasnovano na 98% prirodnih sastojaka!'", 
         "description: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom i disipativnim svojstvima'"),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    # Same for shortDescription
    short_patterns = [
        (r"shortDescription: 'Visokoperformansno podno rešenje zasnovano na 98% prirodnih sastojaka!'", 
         "shortDescription: 'Visokoperformansno podno rešenje za komercijalne i stambene prostore'"),
        (r"shortDescription: 'Visokoperformansno podno rešenje zasnovano na 98% prirodnih sastojaka uz 19 dB zvučne izolacije!'", 
         "shortDescription: 'Visokoperformansno podno rešenje sa zvučnom izolacijom od 19 dB'"),
        (r"shortDescription: 'Visokoperformansno podno rešenje sa modernim terrazzo dizajnom, zasnovano na 98% prirodnih sastojaka!'", 
         "shortDescription: 'Visokoperformansno podno rešenje sa modernim terrazzo dizajnom'"),
        (r"shortDescription: 'Visokoperformansno podno rešenje sa modernim urbanim industrijskim dizajnom, zasnovano na 98% prirodnih sastojaka!'", 
         "shortDescription: 'Visokoperformansno podno rešenje sa modernim urbanim industrijskim dizajnom'"),
        (r"shortDescription: 'Najjače rešenje u DLW Linoleum asortimanu, zasnovano na 98% prirodnih sastojaka'", 
         "shortDescription: 'Najjače rešenje u DLW Linoleum asortimanu'"),
        (r"shortDescription: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom, zasnovano na 98% prirodnih sastojaka!'", 
         "shortDescription: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom'"),
        (r"shortDescription: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom i 15 dB zvučne izolacije, zasnovano na 98% prirodnih sastojaka!'", 
         "shortDescription: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom i 15 dB zvučne izolacije'"),
        (r"shortDescription: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom i disipativnim svojstvima, zasnovano na 98% prirodnih sastojaka!'", 
         "shortDescription: 'Visokoperformansno podno rešenje sa poznatim mermernim dizajnom i disipativnim svojstvima'"),
    ]
    
    for pattern, replacement in short_patterns:
        content = re.sub(pattern, replacement, content)
    
    # Fix 2: Merge duplicate "Neocare površinska obrada" items
    # Find all "Neocare površinska obrada" items and merge them
    def merge_neocare_items(match):
        items_text = match.group(1)
        items = [item.strip().strip("'") for item in items_text.split(',')]
        
        neocare_items = []
        other_items = []
        
        for item in items:
            if item.startswith('Neocare površinska obrada:'):
                neocare_items.append(item)
            else:
                other_items.append(item)
        
        # Merge Neocare items into one
        if len(neocare_items) > 1:
            # Combine all Neocare benefits
            benefits = []
            for item in neocare_items:
                if ': ' in item:
                    benefit = item.split(': ', 1)[1]
                    if benefit not in benefits:
                        benefits.append(benefit)
            
            merged_neocare = f"Neocare površinska obrada: {', '.join(benefits)}"
            items = [merged_neocare] + other_items
        else:
            items = neocare_items + other_items
        
        # Rebuild items string
        items_str = ",\n          ".join([f"'{item}'" for item in items])
        return f"items: [\n          {items_str},\n        ],"
    
    # Match detailsSections items arrays
    content = re.sub(
        r"items: \[\n          (.*?),\n        \],",
        merge_neocare_items,
        content,
        flags=re.DOTALL
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Fixed duplicate content in linoleum products")

if __name__ == '__main__':
    fix_linoleum_products()
