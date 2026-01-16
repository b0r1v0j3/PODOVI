#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prevod ekstraktovanih opisa na srpski
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Collections that were updated from documents
doc_collections = ['creation-40', 'creation-40-zen', 'creation-55', 'creation-55-zen', 'creation-70-zen']

translations = {
    'Wear layer:': 'Sloj habanja:',
    'Ukupna debljina:': 'Ukupna debljina:',
    'Sintetičko, dekorativno i fleksibilno PVC rešenje za podove': 'Sintetičko, dekorativno i fleksibilno PVC rešenje za podove',
    'Dostupno u formatima: daske i pločice': 'Dostupno u formatima: daske i pločice',
    '4 zakošene ivice': '4 zakošene ivice',
    'Akustični gornji sloj za bolje hodanje i toplotni komfor': 'Akustični gornji sloj za bolje hodanje i toplotni komfor',
    'Visok nivo akustične izolacije (-20dB)': 'Visok nivo akustične izolacije (-20dB)',
    'ProtecShield™ površinska obrada: poboljšana otpornost, jednostavno čišćenje': 'ProtecShield™ površinska obrada: poboljšana otpornost, jednostavno čišćenje',
    'Crosslinked polyurethane površinska obrada za lako održavanje': 'Crosslinked polyurethane površinska obrada za lako održavanje',
    'Velika varijacija dizajna sa high-definition štampanim dekorativnim filmom': 'Velika varijacija dizajna sa high-definition štampanim dekorativnim filmom',
    'Dry Back sistem: profesionalna ugradnja za dugotrajnu performansu': 'Dry Back sistem: profesionalna ugradnja za dugotrajnu performansu',
    'Idealno za novu gradnju': 'Idealno za novu gradnju',
    'Uklonjiva ugradnja sa lepkom - pogodno za podignute podove': 'Uklonjiva ugradnja sa lepkom - pogodno za podignute podove',
    'Moguća ugradnja na različite podloge': 'Moguća ugradnja na različite podloge',
    'Moguća ugradnja na azbest kontaminirane podloge': 'Moguća ugradnja na azbest kontaminirane podloge',
    'Uklonjivi podovi - mogu se ukloniti po potrebi': 'Uklonjivi podovi - mogu se ukloniti po potrebi',
    'Lako sečenje za jednostavnu ugradnju': 'Lako sečenje za jednostavnu ugradnju',
    'Evropska klasa upotrebe:': 'Evropska klasa upotrebe:',
    'Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice': 'Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice',
    'Idealno za stambene prostore': 'Idealno za stambene prostore',
    'Otporno na visok promet': 'Otporno na visok promet',
    'Protivpožarna klasifikacija: Bfl-s1 (EN 13501-1)': 'Protivpožarna klasifikacija: Bfl-s1 (EN 13501-1)',
    '100% reciklabilno': '100% reciklabilno',
    '% recikliranog sadržaja': '% recikliranog sadržaja',
    'TVOC <10µg/m³': 'TVOC <10µg/m³',
    'Bez ftalata': 'Bez ftalata',
    'Kompatibilno sa REACH standardima': 'Kompatibilno sa REACH standardima',
    'A+ ocena - najviši nivo zdravstvenih standarda': 'A+ ocena - najviši nivo zdravstvenih standarda',
    'Certifikovano: Floorscore®, IAC Gold & M1': 'Certifikovano: Floorscore®, IAC Gold & M1',
    'Proizvedeno u Francuskoj': 'Proizvedeno u Francuskoj',
}

translated = 0

for color in colors:
    coll = color.get('collection', '')
    if coll not in doc_collections:
        continue
    
    desc = color.get('description', '')
    if not desc:
        continue
    
    # Translate remaining English
    original = desc
    for eng, srb in translations.items():
        desc = desc.replace(eng, srb)
    
    if desc != original:
        color['description'] = desc
        translated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Prevedeno: {translated} opisa')
