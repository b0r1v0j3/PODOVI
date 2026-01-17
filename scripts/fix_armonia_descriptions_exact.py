#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Postavlja TAČAN Gerflor opis (preveden) za Armonia kolekcije
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

# Učitaj JSON
data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

# TAČAN Gerflor opis za Armonia 400 (preveden)
armonia_400_exact = """Strukturirajte svoje prostore, kreirajte harmoniju.

Armonia 400 je ulaznica u svet Armonia. Pažljivo izrađene u Evropskoj uniji, ove loop carpet ploče donose udobnost i harmoniju u prostore sa lakim prometom:

Proizvod i Dekor:
• 50×50cm format pločica
• 100% solution-dyed polipropilen
• Težina vlakna: 400 g/m²
• Lako se kombinuje sa Gerflor kolekcijama (Creation i Saga²)

Ugradnja:
• Monolitna ili quarter-turn instalacija
• Mogućnost ugradnje bez lepka sa konektorima (B-connect)

Primena:
• Laka komercijalna upotreba

Održivost:
• Proizvedeno u EU
• TVOC <100µg/m³ → kvalitet unutrašnjeg vazduha"""

# TAČAN Gerflor opis za Armonia 540 (preveden)
armonia_540_exact = """Strukturirajte svoje prostore, kreirajte harmoniju.

Armonia 540 tekstilne ploče su specijalno dizajnirane da se uklapaju sa našim Creation Loose Lay i Saga kolekcijama za profesionalne prostore:

Proizvod i Dekor:
• 50×50cm format pločica
• 100% Nylon solution dyed
• Težina vlakna: 540 g/m²
• 14 ekskluzivnih boja koordinisanih sa Creation i Saga kolekcijama
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

# Ažuriraj sve boje
updated = 0
for color in data['colors']:
    if color['collection'] == 'gerflor-armonia-400':
        color['description'] = armonia_400_exact
        updated += 1
    elif color['collection'] == 'gerflor-armonia-540':
        color['description'] = armonia_540_exact
        updated += 1

# Sačuvaj
with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Ažurirano: {updated} opisa')
print('Svi opisi sada odgovaraju TAČNO Gerflor sajtu!')
