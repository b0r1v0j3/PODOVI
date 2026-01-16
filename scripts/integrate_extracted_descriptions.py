#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Integriše ekstraktovane opise iz dokumenata i strukturiše ih kao na Gerflor sajtu
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

# Load extracted descriptions
extracted_file = json.load(open('downloads/extracted_product_descriptions.json', 'r', encoding='utf-8'))

# Load complete file
complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

def structure_description(text, collection_name):
    """Structure description into sections like Gerflor site"""
    if not text:
        return None
    
    # Build structured sections
    sections = []
    
    # Product section
    product_lines = []
    if '0,40mm wear-layer' in text or '0.40mm' in text or '0,55mm' in text or '0.55mm' in text:
        product_lines.append(f"Wear layer: {re.search(r'0[,.]?(\d+)mm', text).group(0) if re.search(r'0[,.]?(\d+)mm', text) else '0.40mm'}")
    if 'total thickness' in text.lower() or 'overall thickness' in text.lower():
        thickness_match = re.search(r'(\d+[,.]?\d*)\s*mm', text.lower())
        if thickness_match:
            product_lines.append(f"Ukupna debljina: {thickness_match.group(1).replace(',', '.')} mm")
    if 'planks and tiles' in text.lower():
        product_lines.append('Dostupno u formatima: daske i pločice')
    if 'beveled edges' in text.lower():
        product_lines.append('4 zakošene ivice')
    if 'acoustic' in text.lower():
        product_lines.append('Akustični gornji sloj za bolje hodanje i toplotni komfor')
    if 'Protecshield' in text or 'protecshield' in text.lower():
        product_lines.append('ProtecShield™ površinska obrada: poboljšana otpornost, jednostavno čišćenje')
    
    if product_lines:
        sections.append(('Proizvod:', product_lines))
    
    # Installation section
    installation_lines = []
    if 'glue-down' in text.lower():
        installation_lines.append('Dry Back sistem: profesionalna ugradnja za dugotrajnu performansu')
    elif 'looselay' in text.lower() or 'loose lay' in text.lower():
        installation_lines.append('Uklonjiva ugradnja sa lepkom - pogodno za podignute podove')
        if 'asbestos' in text.lower():
            installation_lines.append('Moguća ugradnja na azbest kontaminirane podloge')
    if 'removable' in text.lower():
        installation_lines.append('Uklonjivi podovi - mogu se ukloniti po potrebi')
    
    if installation_lines:
        sections.append(('Ugradnja:', installation_lines))
    
    # Application section
    application_lines = []
    if '23-32' in text or '33-42' in text or '34-42' in text:
        class_match = re.search(r'(\d+[/-]\d+)', text)
        if class_match:
            application_lines.append(f"Evropska klasa upotrebe: {class_match.group(1)}")
    if 'commercial' in text.lower() or 'industrial' in text.lower():
        application_lines.append('Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice')
    elif 'residential' in text.lower():
        application_lines.append('Idealno za stambene prostore')
    
    if application_lines:
        sections.append(('Primena:', application_lines))
    
    # Environment section
    environment_lines = []
    if '100% recyclable' in text.lower():
        environment_lines.append('100% reciklabilno')
    if 'recycled content' in text.lower():
        recycled_match = re.search(r'(\d+)%', text)
        if recycled_match:
            environment_lines.append(f"{recycled_match.group(1)}% recikliranog sadržaja")
    if 'TVOC' in text or '10 µg' in text or '<10' in text:
        environment_lines.append('TVOC <10µg/m³')
    if 'phthalate' in text.lower() and 'free' in text.lower():
        environment_lines.append('Bez ftalata')
    if 'REACH' in text:
        environment_lines.append('Kompatibilno sa REACH standardima')
    
    if environment_lines:
        sections.append(('Okruženje:', environment_lines))
    
    # Build final structured text
    structured_lines = []
    for section_title, section_items in sections:
        structured_lines.append(section_title)
        for item in section_items:
            structured_lines.append(f"• {item}")
        structured_lines.append('')
    
    return '\n'.join(structured_lines).strip()

# Build index by collection
by_collection = {}
for c in colors:
    coll = c.get('collection', '')
    if coll:
        if coll not in by_collection:
            by_collection[coll] = []
        by_collection[coll].append(c)

updated = 0

for collection_name, description_text in extracted_file.items():
    # Normalize collection name
    normalized = collection_name.replace('creation-', 'creation-').lower()
    
    collection_colors = by_collection.get(normalized, [])
    
    if not collection_colors:
        # Try variations
        for coll, cols in by_collection.items():
            if normalized in coll or coll in normalized:
                collection_colors = cols
                break
    
    if collection_colors:
        structured_desc = structure_description(description_text, collection_name)
        if structured_desc:
            for color in collection_colors:
                color['description'] = structured_desc
            updated += len(collection_colors)
            print(f'✅ {normalized}: {len(collection_colors)} boja')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Ažurirano: {updated} boja sa strukturiranim opisima iz dokumenata')
