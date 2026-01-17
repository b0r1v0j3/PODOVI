#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dodaje Armonia 620 boje sa tačnim Gerflor podacima
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

# Armonia 620 boje (pretpostavljam NCS/LRV na osnovu naziva, ti ćeš poslati tačne)
# Za sada stavljam placeholder, ti ćeš poslati screenshot-ove
armonia_620_colors = [
    {"code": "2173", "name": "SALVIA", "file": "56726 - ARMONIA 620 Salvia - Color Scan.jpg"},
    {"code": "8103", "name": "POLVERE", "file": "56706 - ARMONIA 620 Polvere - Color Scan.jpg"},
    {"code": "6273", "name": "ARGILLA", "file": "56696 - ARMONIA 620 Argilla - Color Scan.jpg"},
    {"code": "9303", "name": "NUVOLA", "file": "56716 - ARMONIA 620 Nuvola - Color Scan.jpg"},
    {"code": "9203", "name": "PIOMBO", "file": "56746 - ARMONIA 620 Piombo - Color Scan.jpg"},
    {"code": "9503", "name": "ANTRACITE", "file": "56736 - ARMONIA 620 Antracite - Color Scan.jpg"}
]

# TAČAN Gerflor tekst (ispravljeno "Armonia 520" -> "Armonia 620")
armonia_620_exact = """Strukturirajte svoje prostore, kreirajte harmoniju.

Armonia 620 su strukturirane carpet ploče dizajnirane da se uklapaju sa našim Creation Loose Lay i Saga kolekcijama za vaše profesionalne prostore:

Proizvod i Dekor:
• 50×50cm format pločica
• Solution-Dyed Nylon - Econyl® 100% reciklirani
• Težina vlakna: 620 g/m²
• 6 ekskluzivnih boja koordinisanih sa Création i Saga kolekcijama
• Savršeno se uklapa sa našim heterogenim i linoleum kolekcijama

Ugradnja:
• Monolitna ili quarter-turn instalacija
• Mogućnost ugradnje bez lepka sa konektorima (B-connect)

Primena:
• Klasa 33 za intenzivnu komercijalnu upotrebu

Održivost:
• Third party certified EPD
• Proizvedeno u EU
• TVOC <100µg/m³ → kvalitet unutrašnjeg vazduha"""

# Dodaj sve boje
for color in armonia_620_colors:
    data['colors'].append({
        "collection": "gerflor-armonia-620",
        "collection_name": "Armonia 620",
        "code": color["code"],
        "name": f"{color['code']} {color['name']}",
        "full_name": f"{color['code']} {color['name']}",
        "slug": f"armonia-620-{color['code'].lower()}-{color['name'].lower()}",
        "image_url": f"/images/products/carpet/{color['file']}",
        "description": armonia_620_exact,
        "dimension": "50 cm X 50 cm",
        "format": "Square tile",
        "overall_thickness": "6.50 mm",
        "specs": {
            "NCS": "TBD",  # Čekam screenshot
            "LRV": "TBD",  # Čekam screenshot
            "UNIT_BOX": "20",  # Pretpostavka, možda drugačije
            "PILE_WEIGHT": "620 g/m²",
            "SURFACE_YARN": "Solution Dyed Nylon - Econyl®",
            "INSTALLATION": "Looselay (Tackified)",
            "CLASSIFICATION": "Class 33"
        },
        "characteristics": {
            "Length": "50 cm",
            "Width": "50 cm",
            "Unit/box": "20",
            "Overall thickness": "6.50 mm",
            "Installation system covering": "Looselay (Tackified)",
            "Format details": "Square tile",
            "Surface yarn": "Solution Dyed Nylon - Econyl®",
            "Pile weight": "620 g/m²",
            "Classification (BS EN 13307)": "Class 33"
        }
    })

data['total'] = len(data['colors'])

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Dodato {len(armonia_620_colors)} boja za Armonia 620')
print(f'Ukupno boja: {data["total"]} (6+14+6)')
print('\n⚠️  NCS i LRV za Armonia 620 su TBD - čekam screenshot-ove')
