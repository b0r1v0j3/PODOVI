#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prevod SVIH opisa sa engleskog na srpski - DOBAR prevod
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

# Translation dictionary - common phrases
translations = {
    # Product descriptions
    "Create without limits": "Kreirajte bez ograničenja",
    "where design meets innovation": "gde se dizajn susreće sa inovacijom",
    "a complete flooring solution": "kompletno rešenje za podove",
    "offering ultra-realistic designs": "koje nudi ultra-realistične dizajne",
    "versatile formats": "raznovrsne formate",
    "seamless harmony": "besprekorna harmonija",
    "ideal for new build projects": "idealno za nove projekte",
    "perfect for light traffic applications": "savršeno za lagane prometne zone",
    "housing": "stanovanje",
    
    # Technical terms
    "acoustic top layer": "akustični gornji sloj",
    "for better walking": "za bolje hodanje",
    "thermal comfort": "toplotni komfor",
    "sound reduction": "smanjenje buke",
    "easy cutting": "lako sečenje",
    "simple cutter": "jednostavan sekač",
    "acoustic back layer": "akustični donji sloj",
    "for impact sound insulation improvement": "za poboljšanje izolacije od udarnog zvuka",
    "rigid core": "čvrsta jezgra",
    "ideal for renovation": "idealno za renovaciju",
    "compatible with existing subfloors": "kompatibilno sa postojećim podlogama",
    "resistant to temperature variations": "otporno na temperaturne varijacije",
    
    # Design terms
    "ultra-realistic designs": "ultra-realistični dizajni",
    "ultra-realistic textures": "ultra-realistične teksture",
    "velvet-touch surfaces": "površine sa baršunastim dodirom",
    "elegant ultra-matt finish": "elegantan ultra-mat završetak",
    "enhanced visual variation": "poboljšana vizuelna varijacija",
    "deeper realism": "dublji realizam",
    "varied textures": "raznovrsne teksture",
    "bring each design to life": "oživljavaju svaki dizajn",
    
    # Formats
    "XL planks": "XL daske",
    "standard planks": "standardne daske",
    "small planks": "male daske",
    "for herringbone": "za riblju kost",
    "rectangular tiles": "pravougaone pločice",
    "designed to suit every space": "dizajnirano da odgovara svakom prostoru",
    
    # Installation
    "lightweight construction": "lagana konstrukcija",
    "easier to transport": "lakše za transport",
    "handle and install": "rukovanje i ugradnja",
    "from floor to wall": "od poda do zida",
    "create seamless harmony": "stvorite besprekornu harmoniju",
    "Mural Revela Collection": "Mural Revela kolekcija",
    
    # Maintenance
    "Dry Back system": "Dry Back sistem",
    "professional-grade installation": "profesionalna ugradnja",
    "for lasting performance": "za dugotrajnu performansu",
    "Ideal for new build": "Idealno za novu gradnju",
    "ideal for refined parquet-style layouts": "idealno za profinjene rasporede u stilu parketa",
    "surface treatment": "površinska obrada",
    "enhanced resistance": "poboljšana otpornost",
    "effortless cleaning": "jednostavno čišćenje",
    "simplified care": "pojednostavljena nega",
    "maximum impact": "maksimalan efekat",
    
    # Removable flooring
    "Removable flooring to meet your needs": "Uklonjivi podovi koji odgovaraju vašim potrebama",
    "5 sizes": "5 veličina",
    "including herringbone and XL planks": "uključujući riblju kost i XL daske",
    "Exclusive construction": "Ekskluzivna konstrukcija",
    "Duo Core": "Duo Core",
    "reinforced with a fiber glass": "ojačano staklenim vlaknima",
    "for comfort & stability": "za komfor i stabilnost",
    "natural look": "prirodan izgled",
    "easy to clean": "lako za čišćenje",
    "Removable installation with tackifier": "Uklonjiva ugradnja sa lepkom",
    "suitable for raised floor": "pogodno za podignute podove",
    "Direct on ceramic if joint <4mm": "Direktno na keramiku ako je spoj <4mm",
    "Ideal for intense traffic areas": "Idealno za zone sa intenzivnim prometom",
    "office, hotel, shops": "kancelarije, hoteli, prodavnice",
    "european class 34-43": "evropska klasa 34-43",
    "100% reciklabilno": "100% reciklabilno",
    "35% recycled content": "35% recikliranog sadržaja",
    "Phtalate free": "Bez ftalata",
}

def translate_text(text):
    """Translate English text to Serbian"""
    if not text:
        return text
    
    result = text
    
    # Replace common phrases
    for eng, srb in translations.items():
        result = result.replace(eng, srb)
    
    # Fix common patterns
    result = re.sub(r'\b(\d+)\s*sqm\b', r'\1 m²', result, flags=re.IGNORECASE)
    result = re.sub(r'\b(\d+)\s*dB\b', r'\1 dB', result)
    
    return result

# Load complete file
complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

translated = 0

for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    # Check if already in Serbian (has Cyrillic or common Serbian words)
    has_cyrillic = bool(re.search(r'[А-Яа-я]', desc))
    has_serbian_words = any(word in desc.lower() for word in ['dizajn', 'proizvod', 'ugradnja', 'održavanje', 'kolekcija'])
    
    if has_cyrillic or has_serbian_words:
        # Already in Serbian, skip
        continue
    
    # Translate
    translated_desc = translate_text(desc)
    
    if translated_desc != desc:
        color['description'] = translated_desc
        translated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Prevedeno: {translated} opisa')
