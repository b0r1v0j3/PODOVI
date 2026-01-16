#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FIX CREATION 70 LOOSELAY - koristi TAČNO ono što je na Gerflor sajtu
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Load creation-70-looselay data
looselay_file = json.load(open('downloads/product_descriptions/lvt/new-2025-creation-70-looselay_colors.json', 'r', encoding='utf-8'))
extracted = looselay_file.get('colors', [])

# Build index by code for creation-70-looselay
by_code = {}
for c in colors:
    if c.get('collection') == 'creation-70-looselay':
        code = c.get('code', '').strip()
        if code:
            by_code[code] = c

print(f'Creation-70-looselay: {len(by_code)} boja\n')

# Get template from first color (all have same description)
full_text_template = None
for ec in extracted:
    desc = ec.get('description', {})
    if desc:
        full_text_template = desc.get('full_text', '')
        if full_text_template:
            break

if not full_text_template:
    print('❌ Nema full_text template!')
    sys.exit(1)

# Build structured description in Serbian (exactly as on Gerflor site)
structured_desc = """Uklonjivi podovi koji odgovaraju vašim potrebama

Proizvod:
5 veličina: uključujući riblju kost i XL daske
Ekskluzivna konstrukcija « Duo Core », ojačano staklenim vlaknima za komfor i stabilnost
ProtecShield™ lak: prirodan izgled i lako za čišćenje

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Direktno na keramiku ako je spoj <4mm

Primena:
Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice - evropska klasa 34-43

Okruženje:
100% reciklabilno
35% recikliranog sadržaja
TVOC <10µg/m³
Bez ftalata"""

updated = 0

# Apply to ALL creation-70-looselay colors
for code, color in by_code.items():
    # Update description
    color['description'] = structured_desc
    
    # Update specs if available
    for ec in extracted:
        ec_slug = ec.get('slug', '')
        codes = re.findall(r'\b(\d{4})\b', ec_slug)
        ec_code = None
        for c in codes:
            if c != '2025':
                ec_code = c
                break
        
        if ec_code == code:
            specs = ec.get('specs', {})
            if specs:
                if specs.get('DIMENSION') and not color.get('dimension'):
                    color['dimension'] = specs.get('DIMENSION')
                if specs.get('FORMAT DETAILS') and not color.get('format'):
                    color['format'] = specs.get('FORMAT DETAILS')
                if specs.get('OVERALL THICKNESS') and not color.get('overall_thickness'):
                    color['overall_thickness'] = specs.get('OVERALL THICKNESS')
            break
    
    updated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Ažurirano: {updated} boja sa strukturiranim opisima kao na Gerflor sajtu')
