#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prevod sa DeepL API - BOLJI prevod
"""

import sys
import json
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

# Check if DeepL API key exists
deepl_key = os.getenv('DEEPL_API_KEY')
if not deepl_key:
    print('⚠️  DEEPL_API_KEY nije postavljen - koristiću osnovni prevod')
    use_deepl = False
else:
    try:
        import deepl
        translator = deepl.Translator(deepl_key)
        use_deepl = True
        print('✅ DeepL API dostupan')
    except ImportError:
        print('⚠️  deepl paket nije instaliran - koristiću osnovni prevod')
        use_deepl = False

def translate_basic(text):
    """Basic translation using dictionary"""
    if not text:
        return text
    
    # Common translations
    translations = {
        "Create without limits": "Kreirajte bez ograničenja",
        "where design meets innovation": "gde se dizajn susreće sa inovacijom",
        "a complete flooring solution": "kompletno rešenje za podove",
        "offering ultra-realistic designs": "koje nudi ultra-realistične dizajne",
        "versatile formats": "raznovrsne formate",
        "seamless harmony": "besprekorna harmonija",
        "ideal for new build projects": "idealno za nove projekte",
        "perfect for light traffic applications": "savršeno za lagane prometne zone",
        "housing": "stanovanje",
        "acoustic top layer": "akustični gornji sloj",
        "for better walking": "za bolje hodanje",
        "thermal comfort": "toplotni komfor",
        "sound reduction": "smanjenje buke",
        "easy cutting": "lako sečenje",
        "simple cutter": "jednostavan sekač",
        "Removable flooring to meet your needs": "Uklonjivi podovi koji odgovaraju vašim potrebama",
    }
    
    result = text
    for eng, srb in translations.items():
        result = result.replace(eng, srb)
    
    return result

def translate_text(text):
    """Translate text to Serbian"""
    if not text:
        return text
    
    # Check if already in Serbian
    has_cyrillic = bool(re.search(r'[А-Яа-я]', text))
    if has_cyrillic:
        return text
    
    if use_deepl:
        try:
            result = translator.translate_text(text, target_lang='SR')
            return result.text
        except Exception as e:
            print(f'  ⚠️  DeepL greška: {e}')
            return translate_basic(text)
    else:
        return translate_basic(text)

# Load complete file
complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

translated = 0

for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    # Check if already in Serbian
    has_cyrillic = bool(re.search(r'[А-Яа-я]', desc))
    has_serbian_words = any(word in desc.lower() for word in ['dizajn', 'proizvod', 'ugradnja', 'održavanje', 'kolekcija', 'kreirajte', 'idealno'])
    
    if has_cyrillic or has_serbian_words:
        continue
    
    # Translate
    translated_desc = translate_text(desc)
    
    if translated_desc != desc:
        color['description'] = translated_desc
        translated += 1
        if translated % 50 == 0:
            print(f'  Prevedeno: {translated}...')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Prevedeno: {translated} opisa')
