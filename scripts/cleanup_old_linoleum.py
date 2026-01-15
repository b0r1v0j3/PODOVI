#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ukloni stare linoleum proizvode (ID 27-40) iz mock-data.ts
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import re

print("Čitam mock-data.ts...")
with open('lib/data/mock-data.ts', encoding='utf-8') as f:
    content = f.read()

print("Tražim stare linoleum proizvode...")

# Find start of ID '27' (first product to remove)
pattern_start = r"  \{\n    id: '27',"

# Find start of ID '41' (first product to keep - Armonia 400)
pattern_end = r"  \{\n    id: '41',"

match_start = re.search(pattern_start, content)
match_end = re.search(pattern_end, content)

if match_start and match_end:
    start_pos = match_start.start()
    end_pos = match_end.start()
    
    print(f"✓ Pronađeno:")
    print(f"  Start (ID 27): pozicija {start_pos}")
    print(f"  End (ID 41): pozicija {end_pos}")
    print(f"  Uklanjam: {end_pos - start_pos} karaktera")
    
    # Remove old linoleum products
    new_content = content[:start_pos] + content[end_pos:]
    
    # Fix double {{ if exists
    new_content = new_content.replace("  {\n  {", "  {")
    
    # Save
    with open('lib/data/mock-data.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✓ Stari linoleum proizvodi uklonjeni")
    print("✓ Fajl sačuvan")
else:
    print("✗ Ne mogu da pronađem start ili end poziciju")
