#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ažurira carpet JSON da ima OBE slike (Color Scan + Room Scene)
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

# Mapiranje boja -> slike
image_mapping = {
    # Armonia 400
    "1801-INDIGO": {
        "color_scan": "57596 - ARMONIA 400 Indigo - Color Scan.jpg",
        "room_scene": "57601 - ARMONIA400Indigo-RoomSceneViewColour.jpg"
    },
    "6501-BEIGE": {
        "color_scan": "57556 - ARMONIA 400 Beige - Color Scan.jpg",
        "room_scene": "57561 - ARMONIA 400 Beige - Room scen view (Colour) .jpg"
    },
    "7801-CACAO": {
        "color_scan": "57546 - ARMONIA 400 Cacao - Color Scan.jpg",
        "room_scene": "57551 - ARMONIA400Cacao-RoomSceneViewcolour.jpg"
    },
    "9501-OMBRA": {
        "color_scan": "57566 - ARMONIA 400 Ombra - Color Scan.jpg",
        "room_scene": "57571 - ARMONIA400Ombra-RoomSceneViewColour.jpg"
    },
    "9701-TITANIO": {
        "color_scan": "57576 - ARMONIA 400 Titanio - Color Scan.jpg",
        "room_scene": "57581 - ARMONIA400Titanio-RoomSceneViewColour.jpg"
    },
    "9901-OXFORD": {
        "color_scan": "57586 - ARMONIA 400 Oxford - Color Scan.jpg",
        "room_scene": "57591 - ARMONIA400Oxford-RoomSceneViewColour.jpg"
    },
    # Armonia 540
    "1790-CANAPA": {
        "color_scan": "64876 - Armonia 540 - Canapa 1790 - 72dpi - 800x800.jpg",
        "room_scene": "64741 - Armonia 540 - Canapa 1790 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1791-TALPA": {
        "color_scan": "64956 - JPG 72 dpi-Armonia-540-1791 Talpa.jpg",
        "room_scene": "64751 - Armonia 540 - Talpa 1791 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1792-PERLA": {
        "color_scan": "64946 - JPG 72 dpi-Armonia-540-1792 Perla.jpg",
        "room_scene": "64761 - Armonia 540 - Perla 1792 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1793-FERRO": {
        "color_scan": "64921 - JPG 72 dpi-Armonia-540-1793 Ferro.jpg",
        "room_scene": "64771 - Armonia 540 - Ferro 1793 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1794-PLATINO": {
        "color_scan": "64951 - JPG 72 dpi-Armonia-540-1794 Platino.jpg",
        "room_scene": "64781 - Armonia 540 - Platino 1794 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1795-GRAFITE": {
        "color_scan": "64931 - JPG 72 dpi-Armonia-540-1795 Grafite.jpg",
        "room_scene": "64791 - Armonia 540 - Grafite 1795 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1796-OCEANO": {
        "color_scan": "64941 - JPG 72 dpi-Armonia-540-1796 Oceano.jpg",
        "room_scene": "64801 - Armonia 540 - Oceano 1796 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1797-MARINO": {
        "color_scan": "64936 - JPG 72 dpi-Armonia-540-1797 Marino.jpg",
        "room_scene": "64811 - Armonia 540 - Marino 1797 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1798-CELESTE": {
        "color_scan": "64911 - JPG 72 dpi-Armonia-540-1798 Celeste.jpg",
        "room_scene": "64821 - Armonia 540 - Celeste 1798 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1799-BOSCO": {
        "color_scan": "64906 - JPG 72 dpi-Armonia-540-1799 Bosco.jpg",
        "room_scene": "64841 - Armonia 540 - Bosco 1799 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1800-FOGLIA": {
        "color_scan": "64926 - JPG 72 dpi-Armonia-540-1800 Foglia.jpg",
        "room_scene": "64831 - Armonia 540 - Foglia 1800 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1801-CORALLO": {
        "color_scan": "64916 - JPG 72 dpi-Armonia-540-1801 Corallo.jpg",
        "room_scene": "64851 - Armonia 540 - Corallo 1801 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1802-TOSCANO": {
        "color_scan": "64961 - JPG 72 dpi-Armonia-540-1802 Toscano.jpg",
        "room_scene": "64861 - Armonia 540 - Toscano 1802 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    "1803-AMBRA": {
        "color_scan": "64901 - JPG 72 dpi-Armonia-540-1803 Ambre.jpg",
        "room_scene": "64871 - Armonia 540 - Ambra 1803 - 72dpi - 1500x1125 - sRVB.jpg"
    },
    # Armonia 620
    "2173-SALVIA": {
        "color_scan": "56726 - ARMONIA 620 Salvia - Color Scan.jpg",
        "room_scene": "56731 - ARMONIA620Salvia-RoomSceneViewColour.jpg"
    },
    "8103-POLVERE": {
        "color_scan": "56706 - ARMONIA 620 Polvere - Color Scan.jpg",
        "room_scene": "56711 - ARMONIA620Polvere-RoomSceneViewColour.jpg"
    },
    "6273-ARGILLA": {
        "color_scan": "56696 - ARMONIA 620 Argilla - Color Scan.jpg",
        "room_scene": "56701 - ARMONIA620Argilla-RoomSceneViewColour.jpg"
    },
    "9303-NUVOLA": {
        "color_scan": "56716 - ARMONIA 620 Nuvola - Color Scan.jpg",
        "room_scene": "56721 - ARMONIA620Nuvola-RoomSceneViewColour.jpg"
    },
    "9203-PIOMBO": {
        "color_scan": "56746 - ARMONIA 620 Piombo - Color Scan.jpg",
        "room_scene": "56751 - ARMONIA620Piombo-RoomSceneViewColour.jpg"
    },
    "9503-ANTRACITE": {
        "color_scan": "56736 - ARMONIA 620 Antracite - Color Scan.jpg",
        "room_scene": "56741 - ARMONIA620Antracite-RoomSceneViewColour.jpg"
    }
}

# Ažuriraj sve boje
for color in data['colors']:
    code = color.get('code', '')
    name = color.get('name', '').split()[-1] if color.get('name') else ''
    key = f"{code}-{name}".upper()
    
    if key in image_mapping:
        images = image_mapping[key]
        
        # Postavi image_url (glavna - Color Scan)
        color['image_url'] = f"/images/products/carpet/{images['color_scan']}"
        
        # Dodaj texture_url (Room Scene View)
        color['texture_url'] = f"/images/products/carpet/{images['room_scene']}"
        
        # Dodaj image_count
        color['image_count'] = 2

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Ažurirano: Sve boje sada imaju OBE slike (Color Scan + Room Scene)!')
