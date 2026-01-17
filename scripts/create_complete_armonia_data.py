#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kreira kompletan carpet_tiles_complete.json sa svim podacima sa screenshot-ova
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

armonia_400_colors = [
    {
        "code": "1801",
        "name": "INDIGO",
        "ncs": "7020-R80B",
        "lrv": "45.3"
    },
    {
        "code": "6501",
        "name": "BEIGE",
        "ncs": "7005-Y80R",
        "lrv": "35"
    },
    {
        "code": "7801",
        "name": "CACAO",
        "ncs": "8005-Y80R",
        "lrv": "41.4"
    },
    {
        "code": "9501",
        "name": "OMBRA",
        "ncs": "6500-N",
        "lrv": "31.9"
    },
    {
        "code": "9701",
        "name": "TITANIO",
        "ncs": "9000-N",
        "lrv": "44.1"
    },
    {
        "code": "9901",
        "name": "OXFORD",
        "ncs": "8500-N",
        "lrv": "37.4"
    }
]

# Zajednički opis za Armonia 400
armonia_400_description = """Proizvod:
Armonia 400 je ulaznica u svet Armonia tekstilnih ploča. Pažljivo izrađene u Evropskoj uniji, ove ploče sa 'loop' teksturom donose udobnost i harmoniju u prostore sa lakim prometom.

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
• Idealno za kancelarije i poslovne prostore

Održivost:
• Proizvedeno u EU
• TVOC <100µg/m³ → kvalitet unutrašnjeg vazduha"""

all_colors = []

for color in armonia_400_colors:
    all_colors.append({
        "collection": "gerflor-armonia-400",
        "collection_name": "Armonia 400",
        "code": color["code"],
        "name": f"{color['code']} {color['name']}",
        "full_name": f"{color['code']} {color['name']}",
        "slug": f"armonia-400-{color['code'].lower()}-{color['name'].lower()}",
        "image_url": f"/images/products/carpet/{color['code']}-{color['name'].lower()}.jpg",
        "description": armonia_400_description,
        "dimension": "50 cm X 50 cm",
        "format": "Square tile",
        "overall_thickness": "5.30 mm",
        "specs": {
            "NCS": color["ncs"],
            "LRV": color["lrv"],
            "UNIT_BOX": "24",
            "PILE_WEIGHT": "400 g/m²",
            "SURFACE_YARN": "Polypropylene",
            "INSTALLATION": "Looselay (Tackified)"
        },
        "characteristics": {
            "Length": "50 cm",
            "Width": "50 cm",
            "Unit/box": "24",
            "Overall thickness": "5.30 mm",
            "Installation system covering": "Looselay (Tackified)",
            "Format details": "Square tile",
            "NCS": color["ncs"],
            "LRV": color["lrv"],
            "Surface yarn": "Polypropylene",
            "Pile weight": "400 g/m²"
        }
    })

# Sačuvaj
output = {
    "total": len(all_colors),
    "collections": 3,
    "colors": all_colors
}

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f'Kreiran carpet_tiles_complete.json sa {len(all_colors)} boja')
