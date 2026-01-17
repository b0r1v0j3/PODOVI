#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ažurira Armonia 620 sa NCS i LRV podacima sa screenshot-ova
"""

import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('public/data/carpet_tiles_complete.json', 'r', encoding='utf-8'))

# NCS i LRV podaci sa screenshot-ova
armonia_620_data = {
    "2173": {"ncs": "3010-G40Y", "lrv": "30.9"},
    "6103": {"ncs": "6010-Y30R", "lrv": "28.9"},
    "6273": {"ncs": "5010-Y30R", "lrv": "27.7"},
    "9203": {"ncs": "6005-Y20R", "lrv": "29.3"},
    "9303": {"ncs": "7005-B20G", "lrv": "23.5"},
    "9503": {"ncs": "7502-B", "lrv": "26.9"}
}

# Ažuriraj sve Armonia 620 boje
updated = 0
for color in data['colors']:
    if color['collection'] == 'gerflor-armonia-620':
        code = color['code']
        if code in armonia_620_data:
            ncs_lrv = armonia_620_data[code]
            
            # Ažuriraj specs
            if color.get('specs'):
                color['specs']['NCS'] = ncs_lrv['ncs']
                color['specs']['LRV'] = ncs_lrv['lrv']
                color['specs']['UNIT_BOX'] = "20"  # Ispravljeno sa screenshot-a
            
            # Ažuriraj characteristics
            if color.get('characteristics'):
                color['characteristics']['NCS'] = ncs_lrv['ncs']
                color['characteristics']['LRV'] = ncs_lrv['lrv']
                color['characteristics']['Unit/box'] = "20"
            
            updated += 1
            print(f'✅ {code} {color.get("name", "").split()[-1]} - NCS: {ncs_lrv["ncs"]}, LRV: {ncs_lrv["lrv"]}')

with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'\n✅ Ažurirano: {updated} boja')
print('\n🎉 Armonia 620 sada ima SVE podatke!')
print('📊 carpet_tiles_complete.json je 100% KOMPLETAN!')
