#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Postavlja TAČAN tekst sa Gerflor sajta za Armonia 540
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

# TAČAN tekst sa Gerflor sajta (preveden)
armonia_540_exact_text = """Strukturirajte svoje prostore, kreirajte harmoniju.

Armonia 540 carpet ploče su specijalno dizajnirane da se uklapaju sa našim Creation Loose Lay i Saga kolekcijama za vaše profesionalne prostore:

Proizvod i Dekor:
• 50×50cm format pločica
• 100% Nylon solution dyed
• Težina vlakna: 540 g/m²
• 14 ekskluzivnih boja koordinisanih sa Création i Saga kolekcijama
• Savršeno se uklapa sa našim LVT, heterogenim i linoleum kolekcijama

Ugradnja:
• Monolitna ili quarter-turn instalacija
• Mogućnost ugradnje bez lepka sa konektorima (B-connect)

Primena:
• Klasa 33 za intenzivnu komercijalnu upotrebu

Održivost:
• Third party certified EPD
• Proizvedeno u EU
• TVOC <100µg/m³ → kvalitet unutrašnjeg vazduha"""

# Ažuriraj sve Armonia 540 boje
for color in data['colors']:
    if color['collection'] == 'gerflor-armonia-540':
        color['description'] = armonia_540_exact_text

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Ažurirano sa TAČNIM Gerflor tekstom za Armonia 540!')
