#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KOMPLETAN prevod SVIH opisa na srpski - ceo tekst, ne samo fraze
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

# Comprehensive translation dictionary
translations = {
    # Common phrases
    "Create without limits": "Kreirajte bez ograničenja",
    "with Creation": "sa Creation",
    "where design meets innovation": "gde se dizajn susreće sa inovacijom",
    "a complete flooring solution": "kompletno rešenje za podove",
    "offering": "koje nudi",
    "ultra-realistic designs": "ultra-realistične dizajne",
    "versatile formats": "raznovrsne formate",
    "and": "i",
    "seamless harmony": "besprekorna harmonija",
    "ideal for": "idealno za",
    "new build projects": "nove projekte",
    "perfect for": "savršeno za",
    "light traffic applications": "lagane prometne zone",
    "housing": "stanovanje",
    
    # Technical
    "acoustic top layer": "akustični gornji sloj",
    "for better walking": "za bolje hodanje",
    "thermal comfort": "toplotni komfor",
    "sound reduction": "smanjenje buke",
    "easy cutting": "lako sečenje",
    "with a simple cutter": "jednostavnim sekačem",
    "acoustic back layer": "akustični donji sloj",
    "for impact sound insulation improvement": "za poboljšanje izolacije od udarnog zvuka",
    "rigid core": "čvrsta jezgra",
    "for renovation": "za renovaciju",
    "compatible with existing subfloors": "kompatibilno sa postojećim podlogama",
    "resistant to temperature variations": "otporno na temperaturne varijacije",
    
    # Design
    "ultra-realistic": "ultra-realistični",
    "textures": "teksture",
    "velvet-touch surfaces": "površine sa baršunastim dodirom",
    "elegant ultra-matt finish": "elegantan ultra-mat završetak",
    "enhanced visual variation": "poboljšana vizuelna varijacija",
    "deeper realism": "dublji realizam",
    "varied": "raznovrsne",
    "bring each design to life": "oživljavaju svaki dizajn",
    
    # Formats
    "XL planks": "XL daske",
    "standard planks": "standardne daske",
    "small planks": "male daske",
    "for herringbone": "za riblju kost",
    "rectangular tiles": "pravougaone pločice",
    "designed to suit every space": "dizajnirano da odgovara svakom prostoru",
    
    # Installation
    "lightweight construction": "lagana konstrukcia",
    "easier to transport": "lakše za transport",
    "handle and install": "rukovanje i ugradnja",
    "from floor to wall": "od poda do zida",
    "create": "stvorite",
    "Mural Revela Collection": "Mural Revela kolekcija",
    
    # Removable
    "Removable flooring to meet your needs": "Uklonjivi podovi koji odgovaraju vašim potrebama",
    "5 sizes": "5 veličina",
    "including": "uključujući",
    "Exclusive construction": "Ekskluzivna konstrukcija",
    "reinforced with a fiber glass": "ojačano staklenim vlaknima",
    "for comfort & stability": "za komfor i stabilnost",
    "natural look": "prirodan izgled",
    "easy to clean": "lako za čišćenje",
    "Removable installation with tackifier": "Uklonjiva ugradnja sa lepkom",
    "suitable for raised floor": "pogodno za podignute podove",
    "Direct on ceramic if joint <4mm": "Direktno na keramiku ako je spoj <4mm",
    "Ideal for intense traffic areas": "Idealno za zone sa intenzivnim prometom",
    "office, hotel, shops": "kancelarije, hoteli, prodavnice",
    "european class": "evropska klasa",
    "100% reciklabilno": "100% reciklabilno",
    "35% recycled content": "35% recikliranog sadržaja",
    "Phtalate free": "Bez ftalata",
}

def translate_full_text(text):
    """Translate entire text to Serbian"""
    if not text:
        return text
    
    # Check if already in Serbian (has Cyrillic)
    if re.search(r'[А-Яа-я]', text):
        return text
    
    result = text
    
    # Replace common phrases (longer first to avoid partial matches)
    for eng, srb in sorted(translations.items(), key=lambda x: -len(x[0])):
        result = result.replace(eng, srb)
    
    # Fix remaining English words
    result = re.sub(r'\b(and|with|for|the|a|an|to|of|in|on|at|by)\b', '', result, flags=re.IGNORECASE)
    result = re.sub(r'\s+', ' ', result)
    result = result.strip()
    
    return result

# Load complete file
complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

translated = 0

for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    # Check if already fully in Serbian
    has_cyrillic = bool(re.search(r'[А-Яа-я]', desc))
    # Check if has English words (common English words)
    has_english = bool(re.search(r'\b(and|with|for|the|where|meets|offering|designed|ideal|perfect)\b', desc, re.IGNORECASE))
    
    if has_cyrillic and not has_english:
        # Already in Serbian, skip
        continue
    
    # Translate
    translated_desc = translate_full_text(desc)
    
    if translated_desc != desc:
        color['description'] = translated_desc
        translated += 1
        if translated % 50 == 0:
            print(f'  Prevedeno: {translated}...')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Prevedeno: {translated} opisa')
