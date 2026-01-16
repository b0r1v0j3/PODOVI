#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proverava status obrađenih kolekcija
"""

import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def main():
    desc_dir = Path('downloads/product_descriptions/lvt')
    files = list(desc_dir.glob('*_descriptions.json'))
    
    print(f"Pronađeno {len(files)} JSON fajlova:\n")
    
    for f in sorted(files):
        try:
            with open(f, 'r', encoding='utf-8') as file:
                data = json.load(file)
                colors_count = len(data.get('colors', []))
                collection_slug = data.get('collection_slug', 'N/A')
                print(f"  {f.name}")
                print(f"    Kolekcija: {collection_slug}")
                print(f"    Boja: {colors_count}")
                print()
        except Exception as e:
            print(f"  {f.name}: Greška - {e}\n")

if __name__ == '__main__':
    main()
