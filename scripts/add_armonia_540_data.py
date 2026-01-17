#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dodaje Armonia 540 boje sa tačnim podacima sa screenshot-ova
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

# Učitaj postojeći JSON
data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

# Armonia 540 boje sa screenshot-ova
armonia_540_colors = [
    {"code": "1790", "name": "CANAPA", "ncs": "5005-Y50R", "lrv": "19.8"},
    {"code": "1791", "name": "TALPA", "ncs": "4005-Y20R", "lrv": "28.7"},
    {"code": "1792", "name": "PERLA", "ncs": "5502-R", "lrv": "20.4"},
    {"code": "1793", "name": "FERRO", "ncs": "8000-N", "lrv": "6.3"},
    {"code": "1794", "name": "PLATINO", "ncs": "6000-N", "lrv": "20.2"},
    {"code": "1795", "name": "GRAFITE", "ncs": "9000-N", "lrv": "3.1"},
    {"code": "1796", "name": "OCEANO", "ncs": "8010-R70B", "lrv": "3.8"},
    {"code": "1797", "name": "MARINO", "ncs": "7502-B", "lrv": "7.2"},
    {"code": "1798", "name": "CELESTE", "ncs": "5502-B", "lrv": "23.5"},
    {"code": "1799", "name": "BOSCO", "ncs": "8005-G20Y", "lrv": "6.1"},
    {"code": "1800", "name": "FOGLIA", "ncs": "6020-G30Y", "lrv": "11"},
    {"code": "1801", "name": "CORALLO", "ncs": "5020-Y90R", "lrv": "14.7"},
    {"code": "1802", "name": "TOSCANO", "ncs": "6030-Y90R", "lrv": "6.5"},
    {"code": "1803", "name": "AMBRA", "ncs": "5010-Y30R", "lrv": "26"}
]

# TAČAN opis sa Gerflor sajta
armonia_540_description = """Proizvod:
Armonia 540 tekstilne ploče su specijalno dizajnirane da se uklapaju sa našim Creation Loose Lay i Saga kolekcijama za profesionalne prostore.

Konstrukcija:
1. Polyamide tufted loop pile na polyester sloju
2. Bazni sloj sa latex premazom
3. Bitumen podloga

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

# Dodaj svaku boju
for color in armonia_540_colors:
    data['colors'].append({
        "collection": "gerflor-armonia-540",
        "collection_name": "Armonia 540",
        "code": color["code"],
        "name": f"{color['code']} {color['name']}",
        "full_name": f"{color['code']} {color['name']}",
        "slug": f"armonia-540-{color['code'].lower()}-{color['name'].lower()}",
        "image_url": f"/images/products/carpet/{color['code']}-{color['name'].lower()}.jpg",
        "description": armonia_540_description,
        "dimension": "50 cm X 50 cm",
        "format": "Square tile",
        "overall_thickness": "5.50 mm",
        "specs": {
            "NCS": color["ncs"],
            "LRV": color["lrv"],
            "UNIT_BOX": "24",
            "PILE_WEIGHT": "540 g/m²",
            "SURFACE_YARN": "Solution Dyed Nylon",
            "INSTALLATION": "Looselay (Tackified)",
            "CLASSIFICATION": "Class 33"
        },
        "characteristics": {
            "Length": "50 cm",
            "Width": "50 cm",
            "Unit/box": "24",
            "Overall thickness": "5.50 mm",
            "Installation system covering": "Looselay (Tackified)",
            "Format details": "Square tile",
            "NCS": color["ncs"],
            "LRV": color["lrv"],
            "Surface yarn": "Solution Dyed Nylon",
            "Pile weight": "540 g/m²",
            "Classification (BS EN 13307)": "Class 33"
        }
    })

data['total'] = len(data['colors'])

# Ažuriraj i Armonia 400 opis da bude tačniji
armonia_400_description_updated = """Proizvod:
Armonia 400 je ulaznica u svet Armonia. Pažljivo izrađene u Evropskoj uniji, ove loop carpet ploče donose udobnost i harmoniju u prostore sa lakim prometom.

Konstrukcija:
1. Polypropylene tufted loop pile na polyester sloju
2. Bazni sloj sa latex premazom
3. Bitumen podloga

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

# Ažuriraj Armonia 400 opise
for color in data['colors']:
    if color['collection'] == 'gerflor-armonia-400':
        color['description'] = armonia_400_description_updated

# Sačuvaj
with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Dodato {len(armonia_540_colors)} boja za Armonia 540')
print(f'Ažurirani opisi za Armonia 400')
print(f'Ukupno boja u JSON-u: {data["total"]}')
