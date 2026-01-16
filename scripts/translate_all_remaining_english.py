#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prevod SVIH preostalih engleskih reči u opisima na srpski
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Comprehensive translation dictionary
translations = {
    # Formats
    'rectangular tiles': 'pravougaone pločice',
    'square tiles': 'kvadratne pločice',
    'standard planks': 'standardne daske',
    'XL planks': 'XL daske',
    'small planks': 'male daske',
    
    # Common phrases
    'designed to meet every project need': 'dizajnirano da zadovolji svaki projekat',
    'every detail crafted to create exclusiv space': 'svaki detalj osmišljen da stvori ekskluzivan prostor',
    'ultra-realistic and varied textures that elevate each design': 'ultra-realistične i raznovrsne teksture koje uzdignu svaki dizajn',
    'velvet touch and natural elegance': 'baršunasti dodir i prirodna elegancija',
    'enhanced visual variation on selected designs for deeper realism': 'poboljšana vizuelna varijacija na odabranim dizajnima za dublji realizam',
    'acoustic top layer for better walking (79dB) and thermal comfort': 'akustični gornji sloj za bolje hodanje (79dB) i toplotni komfor',
    'authentic wood and tile effects': 'autentičan efekat drveta i pločica',
    'create seamless harmony with our Mural Revela Collection': 'stvorite besprekornu harmoniju sa našom Mural Revela kolekcijom',
    'professional-grade installation for lasting performance': 'profesionalna ugradnja za dugotrajnu performansu',
    'enhanced resistance, effortless cleaning': 'poboljšana otpornost, jednostavno čišćenje',
    'simplified care, maximum impact': 'pojednostavljena nega, maksimalan efekat',
    
    # More phrases
    'Complete format offering:': 'Kompletan format:',
    'Refined designs & harmonious color palettes:': 'Profinjeni dizajni i harmonične palete boja:',
    'New surface embosses:': 'Novi površinski utisci:',
    'Ultra-matt finish with Protecshield™:': 'Ultra-mat završetak sa Protecshield™:',
    'Smart Design – up to 3sqm of design variation:': 'Smart Design – do 3 m² varijacije dizajna:',
    'Smart Comfort innovation:': 'Smart Comfort inovacija:',
    '4 bevelled edges:': '4 zakošene ivice:',
    'From floor to wall:': 'Od poda do zida:',
    'Dry Back system:': 'Dry Back sistem:',
    'Ideal for new build': 'Idealno za novu gradnju',
    'Protecshield™ surface treatment:': 'Protecshield™ površinska obrada:',
    'Efficient maintenance protocol:': 'Efikasan protokol održavanja:',
}

translated = 0

for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    original = desc
    
    # Apply translations (longer first)
    for eng, srb in sorted(translations.items(), key=lambda x: -len(x[0])):
        desc = desc.replace(eng, srb)
    
    if desc != original:
        color['description'] = desc
        translated += 1
        if translated % 50 == 0:
            print(f'  Prevedeno: {translated}...')

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'\n✅ Prevedeno: {translated} opisa')
