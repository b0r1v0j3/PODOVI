#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Poboljšava strukturirane opise iz ekstraktovanih dokumenata
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

def structure_description_improved(text, collection_name):
    """Improved structure description into sections like Gerflor site"""
    if not text:
        return None
    
    sections = []
    
    # Product section - more detailed
    product_lines = []
    
    # Extract key features
    if 'decorative' in text.lower() and 'flexible' in text.lower():
        product_lines.append('Sintetičko, dekorativno i fleksibilno PVC rešenje za podove')
    
    # Formats
    if 'planks and tiles' in text.lower() or 'plank and tile' in text.lower():
        product_lines.append('Dostupno u formatima: daske i pločice')
    elif 'plank' in text.lower() and 'tile' in text.lower():
        product_lines.append('Dostupno u formatima: daske i pločice')
    
    # Edges
    if 'beveled edges' in text.lower() or 'bevelled edges' in text.lower():
        product_lines.append('4 zakošene ivice')
    
    # Wear layer
    wear_match = re.search(r'(\d+[,.]?\d*)\s*mm.*wear', text, re.IGNORECASE)
    if wear_match:
        product_lines.append(f"Wear layer: {wear_match.group(1).replace(',', '.')} mm")
    elif '0,40mm' in text or '0.40mm' in text:
        product_lines.append('Wear layer: 0.40 mm')
    elif '0,55mm' in text or '0.55mm' in text:
        product_lines.append('Wear layer: 0.55 mm')
    elif '0,70mm' in text or '0.70mm' in text:
        product_lines.append('Wear layer: 0.70 mm')
    
    # Thickness
    thickness_match = re.search(r'total thickness.*?(\d+[,.]?\d*)\s*mm', text, re.IGNORECASE)
    if thickness_match:
        product_lines.append(f"Ukupna debljina: {thickness_match.group(1).replace(',', '.')} mm")
    elif 'overall thickness' in text.lower():
        thick_match = re.search(r'overall thickness.*?(\d+[,.]?\d*)\s*mm', text, re.IGNORECASE)
        if thick_match:
            product_lines.append(f"Ukupna debljina: {thick_match.group(1).replace(',', '.')} mm")
    
    # Acoustic
    if 'acoustic' in text.lower() and 'layer' in text.lower():
        if 'top' in text.lower() or 'walking' in text.lower():
            product_lines.append('Akustični gornji sloj za bolje hodanje i toplotni komfor')
        if 'insulation' in text.lower() or '-20dB' in text or '-20 dB' in text:
            product_lines.append('Visok nivo akustične izolacije (-20dB)')
    
    # Surface treatment
    if 'Protecshield' in text or 'protecshield' in text.lower():
        product_lines.append('ProtecShield™ površinska obrada: poboljšana otpornost, jednostavno čišćenje')
    elif 'polyurethane' in text.lower() and 'surface' in text.lower():
        product_lines.append('Crosslinked polyurethane površinska obrada za lako održavanje')
    
    # Design variety
    if 'design variety' in text.lower() or 'extensive design' in text.lower():
        product_lines.append('Velika varijacija dizajna sa high-definition štampanim dekorativnim filmom')
    
    if product_lines:
        sections.append(('Proizvod:', product_lines))
    
    # Installation section
    installation_lines = []
    if 'glue-down' in text.lower() or 'glue down' in text.lower():
        installation_lines.append('Dry Back sistem: profesionalna ugradnja za dugotrajnu performansu')
        installation_lines.append('Idealno za novu gradnju')
    elif 'looselay' in text.lower() or 'loose lay' in text.lower():
        installation_lines.append('Uklonjiva ugradnja sa lepkom - pogodno za podignute podove')
        installation_lines.append('Moguća ugradnja na različite podloge')
        if 'asbestos' in text.lower():
            installation_lines.append('Moguća ugradnja na azbest kontaminirane podloge')
    if 'removable' in text.lower():
        installation_lines.append('Uklonjivi podovi - mogu se ukloniti po potrebi')
    if 'cutting' in text.lower() and 'easy' in text.lower():
        installation_lines.append('Lako sečenje za jednostavnu ugradnju')
    
    if installation_lines:
        sections.append(('Ugradnja:', installation_lines))
    
    # Application section
    application_lines = []
    class_match = re.search(r'(\d+[/-]\d+)', text)
    if class_match:
        application_lines.append(f"Evropska klasa upotrebe: {class_match.group(1)}")
    elif '23-32' in text:
        application_lines.append('Evropska klasa upotrebe: 23-32')
    elif '33-42' in text:
        application_lines.append('Evropska klasa upotrebe: 33-42')
    elif '34-42' in text:
        application_lines.append('Evropska klasa upotrebe: 34-42')
    
    if 'commercial' in text.lower() or 'industrial' in text.lower():
        application_lines.append('Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice')
    elif 'residential' in text.lower():
        application_lines.append('Idealno za stambene prostore')
    if 'high traffic' in text.lower():
        application_lines.append('Otporno na visok promet')
    
    # Fire classification
    if 'Bfl-s1' in text or 'Bfl-s1' in text:
        application_lines.append('Protivpožarna klasifikacija: Bfl-s1 (EN 13501-1)')
    
    if application_lines:
        sections.append(('Primena:', application_lines))
    
    # Environment section
    environment_lines = []
    if '100% recyclable' in text.lower():
        environment_lines.append('100% reciklabilno')
    if 'recycled content' in text.lower():
        recycled_match = re.search(r'(\d+)%\s*recycled', text, re.IGNORECASE)
        if recycled_match:
            environment_lines.append(f"{recycled_match.group(1)}% recikliranog sadržaja")
        elif '35%' in text and 'recycled' in text.lower():
            environment_lines.append('35% recikliranog sadržaja')
        elif '15%' in text and 'recycled' in text.lower():
            environment_lines.append('15% recikliranog sadržaja')
    if 'TVOC' in text or '10 µg' in text or '<10' in text or '10 μg' in text:
        environment_lines.append('TVOC <10µg/m³')
    if 'phthalate' in text.lower() and 'free' in text.lower():
        environment_lines.append('Bez ftalata')
    if 'REACH' in text:
        environment_lines.append('Kompatibilno sa REACH standardima')
    if 'A+' in text or 'A+ rating' in text.lower():
        environment_lines.append('A+ ocena - najviši nivo zdravstvenih standarda')
    if 'Floorscore' in text or 'IAC Gold' in text:
        environment_lines.append('Certifikovano: Floorscore®, IAC Gold & M1')
    if 'Made in France' in text or 'made in France' in text:
        environment_lines.append('Proizvedeno u Francuskoj')
    
    if environment_lines:
        sections.append(('Okruženje:', environment_lines))
    
    # Build final structured text
    structured_lines = []
    for section_title, section_items in sections:
        structured_lines.append(section_title)
        for item in section_items:
            structured_lines.append(item)
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
    normalized = collection_name.replace('creation-', 'creation-').lower()
    
    collection_colors = by_collection.get(normalized, [])
    
    if not collection_colors:
        for coll, cols in by_collection.items():
            if normalized in coll or coll in normalized:
                collection_colors = cols
                break
    
    if collection_colors:
        structured_desc = structure_description_improved(description_text, collection_name)
        if structured_desc:
            for color in collection_colors:
                color['description'] = structured_desc
            updated += len(collection_colors)
            print(f'✅ {normalized}: {len(collection_colors)} boja')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Ažurirano: {updated} boja sa poboljšanim strukturiranim opisima')
