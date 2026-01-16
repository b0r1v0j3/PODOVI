#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prevod SVIH engleskih reči na srpski - agresivniji pristup
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

# Extended translation dictionary
translations = {
    # Common English words
    "Smart Comfort innovation": "Smart Comfort inovacija",
    "innovation": "inovacija",
    "Smart Design": "Smart Design",
    "Smart Comfort": "Smart Comfort",
    "where design meets": "gde se dizajn susreće",
    "acoustic top layer": "akustični gornji sloj",
    "for walking comfort": "za komfor pri hodanju",
    "thermal comfort": "toplotni komfor",
    "sound reduction": "smanjenje buke",
    "easy cutting": "lako sečenje",
    "with a simple cutter": "jednostavnim sekačem",
    "acoustic back layer": "akustični donji sloj",
    "for impact sound insulation improvement": "za poboljšanje izolacije od udarnog zvuka",
    "rigid core": "čvrsta jezgra",
    "ideal for renovation": "idealno za renovaciju",
    "compatible with existing subfloors": "kompatibilno sa postojećim podlogama",
    "resistant to temperature variations": "otporno na temperaturne varijacije",
    "ultra-realistic designs": "ultra-realistični dizajni",
    "ultra-realistic textures": "ultra-realistične teksture",
    "velvet-touch surfaces": "površine sa baršunastim dodirom",
    "elegant ultra-matt finish": "elegantan ultra-mat završetak",
    "enhanced visual variation": "poboljšana vizuelna varijacija",
    "deeper realism": "dublji realizam",
    "varied textures": "raznovrsne teksture",
    "bring each design to life": "oživljavaju svaki dizajn",
    "Available formats": "Dostupni formati",
    "XL planks": "XL daske",
    "standard planks": "standardne daske",
    "small planks": "male daske",
    "for herringbone": "za riblju kost",
    "rectangular tiles": "pravougaone pločice",
    "designed to suit every space": "dizajnirano da odgovara svakom prostoru",
    "lightweight construction": "lagana konstrukcija",
    "easier to transport": "lakše za transport",
    "handle and install": "rukovanje i ugradnja",
    "from floor to wall": "od poda do zida",
    "create": "stvorite",
    "Mural Revela Collection": "Mural Revela kolekcija",
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

def translate_text(text):
    """Translate all English words to Serbian"""
    if not text:
        return text
    
    # Check if already fully in Serbian (has Cyrillic and no common English words)
    has_cyrillic = bool(re.search(r'[А-Яа-я]', text))
    common_english = ['innovation', 'Smart', 'Comfort', 'Design', 'where', 'meets', 'acoustic', 'layer', 'comfort', 'thermal', 'sound', 'reduction', 'cutting', 'cutter', 'rigid', 'core', 'ideal', 'renovation', 'compatible', 'existing', 'subfloors', 'resistant', 'temperature', 'variations', 'ultra-realistic', 'designs', 'textures', 'velvet-touch', 'surfaces', 'elegant', 'finish', 'enhanced', 'visual', 'variation', 'deeper', 'realism', 'varied', 'bring', 'each', 'life', 'Available', 'formats', 'planks', 'standard', 'small', 'herringbone', 'rectangular', 'tiles', 'designed', 'suit', 'every', 'space', 'lightweight', 'construction', 'easier', 'transport', 'handle', 'install', 'from', 'floor', 'wall', 'create', 'Mural', 'Revela', 'Collection', 'Removable', 'flooring', 'meet', 'your', 'needs', 'sizes', 'including', 'Exclusive', 'reinforced', 'fiber', 'glass', 'stability', 'natural', 'look', 'clean', 'installation', 'tackifier', 'suitable', 'raised', 'Direct', 'ceramic', 'joint', 'Ideal', 'intense', 'traffic', 'areas', 'office', 'hotel', 'shops', 'european', 'class', 'recycled', 'content', 'Phtalate', 'free']
    
    has_english = any(re.search(rf'\b{word}\b', text, re.IGNORECASE) for word in common_english)
    
    if has_cyrillic and not has_english:
        return text
    
    result = text
    
    # Replace phrases (longer first)
    for eng, srb in sorted(translations.items(), key=lambda x: -len(x[0])):
        result = result.replace(eng, srb)
    
    # Replace remaining common English words
    word_replacements = {
        'innovation': 'inovacija',
        'Smart': 'Smart',
        'Comfort': 'Komfor',
        'Design': 'Dizajn',
        'where': 'gde',
        'meets': 'susreće',
        'acoustic': 'akustični',
        'layer': 'sloj',
        'comfort': 'komfor',
        'thermal': 'toplotni',
        'sound': 'zvuk',
        'reduction': 'smanjenje',
        'cutting': 'sečenje',
        'cutter': 'sekač',
        'rigid': 'čvrsta',
        'core': 'jezgra',
        'ideal': 'idealno',
        'renovation': 'renovaciju',
        'compatible': 'kompatibilno',
        'existing': 'postojećim',
        'subfloors': 'podlogama',
        'resistant': 'otporno',
        'temperature': 'temperaturne',
        'variations': 'varijacije',
        'ultra-realistic': 'ultra-realistični',
        'designs': 'dizajni',
        'textures': 'teksture',
        'velvet-touch': 'baršunastim dodirom',
        'surfaces': 'površine',
        'elegant': 'elegantan',
        'finish': 'završetak',
        'enhanced': 'poboljšana',
        'visual': 'vizuelna',
        'variation': 'varijacija',
        'deeper': 'dublji',
        'realism': 'realizam',
        'varied': 'raznovrsne',
        'bring': 'oživljavaju',
        'each': 'svaki',
        'life': 'život',
        'Available': 'Dostupni',
        'formats': 'formati',
        'planks': 'daske',
        'standard': 'standardne',
        'small': 'male',
        'herringbone': 'riblju kost',
        'rectangular': 'pravougaone',
        'tiles': 'pločice',
        'designed': 'dizajnirano',
        'suit': 'odgovara',
        'every': 'svakom',
        'space': 'prostoru',
        'lightweight': 'lagana',
        'construction': 'konstrukcija',
        'easier': 'lakše',
        'transport': 'transport',
        'handle': 'rukovanje',
        'install': 'ugradnja',
        'from': 'od',
        'floor': 'poda',
        'wall': 'zida',
        'create': 'stvorite',
        'Mural': 'Mural',
        'Revela': 'Revela',
        'Collection': 'kolekcija',
        'Removable': 'Uklonjivi',
        'flooring': 'podovi',
        'meet': 'odgovaraju',
        'your': 'vašim',
        'needs': 'potrebama',
        'sizes': 'veličine',
        'including': 'uključujući',
        'Exclusive': 'Ekskluzivna',
        'reinforced': 'ojačano',
        'fiber': 'staklenim',
        'glass': 'vlaknima',
        'stability': 'stabilnost',
        'natural': 'prirodan',
        'look': 'izgled',
        'clean': 'čišćenje',
        'installation': 'ugradnja',
        'tackifier': 'lepkom',
        'suitable': 'pogodno',
        'raised': 'podignute',
        'Direct': 'Direktno',
        'ceramic': 'keramiku',
        'joint': 'spoj',
        'Ideal': 'Idealno',
        'intense': 'intenzivnim',
        'traffic': 'prometom',
        'areas': 'zone',
        'office': 'kancelarije',
        'hotel': 'hoteli',
        'shops': 'prodavnice',
        'european': 'evropska',
        'class': 'klasa',
        'recycled': 'recikliranog',
        'content': 'sadržaja',
        'Phtalate': 'ftalata',
        'free': 'bez',
    }
    
    for eng_word, srb_word in word_replacements.items():
        result = re.sub(rf'\b{eng_word}\b', srb_word, result, flags=re.IGNORECASE)
    
    return result

# Load complete file
complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

translated = 0

for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    translated_desc = translate_text(desc)
    
    if translated_desc != desc:
        color['description'] = translated_desc
        translated += 1
        if translated % 50 == 0:
            print(f'  Prevedeno: {translated}...')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Prevedeno: {translated} opisa')
