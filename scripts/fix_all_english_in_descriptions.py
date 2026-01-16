#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prevođenje svih engleskih reči u opisima na srpski
"""

import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

# Load data
complete = json.load(open('public/data/lvt_colors_complete.json', 'r', encoding='utf-8'))
colors = complete.get('colors', [])

# Comprehensive translation dictionary
translations = {
    # Section headers
    'Product:': 'Proizvod:',
    'Product :': 'Proizvod:',
    'Installation:': 'Ugradnja:',
    'Installation :': 'Ugradnja:',
    'Application:': 'Primena:',
    'Application :': 'Primena:',
    'Environment:': 'Okruženje:',
    'Environment :': 'Okruženje:',
    
    # Common English phrases
    'Synthetic, decorative, and flexible PVC flooring solution': 'Sintetičko, dekorativno i fleksibilno PVC rešenje za podove',
    'available in planks and tiles': 'dostupno u formatima daske i pločice',
    'four-sided beveled edges': 'četiri zakošene ivice',
    '4 beveled edges': '4 zakošene ivice',
    'wear-layer': 'sloj habanja',
    'wear layer': 'sloj habanja',
    'high definition printed decorative film': 'high-definition štampani dekorativni film',
    'extensive design variety': 'velika varijacija dizajna',
    'acoustic top layer': 'akustični gornji sloj',
    'enhanced walking comfort': 'poboljšan komfor pri hodanju',
    'resilient core': 'fleksibilna jezgra',
    'facilitates easy cutting': 'olakšava lako sečenje',
    'during installation': 'tokom ugradnje',
    'total thickness': 'ukupna debljina',
    'overall thickness': 'ukupna debljina',
    'crosslinked polyurethane surface treatment': 'crosslinked polyurethane površinska obrada',
    'easy maintenance': 'lako održavanje',
    'improved resistance to micro-scratches': 'poboljšana otpornost na mikro-ogrebotine',
    'designed for glue-down installation': 'dizajnirano za glue-down ugradnju',
    'classified as': 'klasifikovano kao',
    'fire safety standard': 'standard protivpožarne bezbednosti',
    'meets the European usage classification': 'zadovoljava evropsku klasifikaciju upotrebe',
    'free from phthalates': 'bez ftalata',
    'except for recycled content': 'izuzev recikliranog sadržaja',
    'recyclable': 'reciklabilno',
    '100% recyclable': '100% reciklabilno',
    'Installation offcuts': 'Ugradnja otpada',
    'end-of-life material': 'materijal na kraju životnog veka',
    'under certain conditions': 'pod određenim uslovima',
    'collected and recycled': 'prikupljen i recikliran',
    'Second Life program': 'program Druga Život',
    'contains an average of': 'sadrži prosečno',
    'recycled content': 'recikliranog sadržaja',
    'complies with REACH regulations': 'u skladu sa REACH propisima',
    'indoor air quality performance': 'performanse kvaliteta vazduha u zatvorenom prostoru',
    'TVOC emissions after 28 days': 'TVOC emisije nakon 28 dana',
    'below': 'ispod',
    'earning an': 'dobija',
    'rating': 'ocenu',
    'highest level': 'najviši nivo',
    'health labeling standards': 'zdravstveni standardi označavanja',
    'certified by': 'certifikovano od strane',
    'Made in France': 'Proizvedeno u Francuskoj',
    'made in France': 'proizvedeno u Francuskoj',
    'acoustic and decorative floor': 'akustični i dekorativni pod',
    'PVC multilayers reinforced with': 'PVC višeslojni ojačan',
    'fiber veil': 'staklenim vlaknom',
    'fiber glass layers': 'staklenim vlaknima',
    'tile and plank format': 'format pločice i daske',
    'antistatic abrasion group': 'antistatička grupa habanja',
    'antislip performance': 'antiklizajuće performanse',
    'transparent wearlayer': 'transparentni sloj habanja',
    'high density foam': 'visokogustinski penasti sloj',
    'good indentation resistance': 'dobra otpornost na utiskivanje',
    'average measure': 'prosečna mera',
    'high acoustic insulation level': 'visok nivo akustične izolacije',
    'making maintenance easier': 'olakšava održavanje',
    'prevent from micro scratches': 'sprečava mikro-ogrebotine',
    'European class': 'Evropska klasa',
    'residential / commercial': 'stambena / komercijalna',
    'according to': 'prema',
    'class for smoke emission': 'klasa za emisiju dima',
    'looselay product': 'looselay proizvod',
    'maintained with tackifier': 'održavan sa lepkom',
    'allows, among other things': 'omogućava, između ostalog',
    'installation on asbestos-contaminated support': 'ugradnja na azbest kontaminirane podloge',
    'removable': 'uklonjivo',
    'phthalate free plasticizers': 'bez ftalatnih plastifikatora',
    'compliant with REACH': 'u skladu sa REACH',
    'emission rate of organic compounds': 'stopa emisije organskih jedinjenja',
    'below detection levels': 'ispod nivoa detekcije',
    'anti-viral activity': 'antivirusna aktivnost',
    'human Coronavirus': 'ljudskog koronavirusa',
    'reducing the number of viruses': 'smanjuje broj virusa',
    'antibacterial efficacy': 'antibakterijska efikasnost',
    'after 24 hours': 'nakon 24 sata',
}

def translate_description(desc):
    """Translate English text to Serbian"""
    if not desc:
        return desc
    
    result = desc
    
    # Replace section headers first
    result = re.sub(r'Product\s*:', 'Proizvod:', result, flags=re.IGNORECASE)
    result = re.sub(r'Installation\s*:', 'Ugradnja:', result, flags=re.IGNORECASE)
    result = re.sub(r'Application\s*:', 'Primena:', result, flags=re.IGNORECASE)
    result = re.sub(r'Environment\s*:', 'Okruženje:', result, flags=re.IGNORECASE)
    
    # Replace common phrases (longer first to avoid partial matches)
    for eng, srb in sorted(translations.items(), key=lambda x: -len(x[0])):
        # Case insensitive replacement
        result = re.sub(re.escape(eng), srb, result, flags=re.IGNORECASE)
    
    # Common word replacements
    word_replacements = {
        r'\bProduct\b': 'Proizvod',
        r'\bInstallation\b': 'Ugradnja',
        r'\bApplication\b': 'Primena',
        r'\bEnvironment\b': 'Okruženje',
        r'\bDesign\b': 'Dizajn',
        r'\bMaintenance\b': 'Održavanje',
        r'\bStandard\b': 'Standard',
        r'\bPVC\b': 'PVC',
        r'\bEN\s+ISO': 'EN ISO',
        r'\bEN\s+13501': 'EN 13501',
    }
    
    for pattern, replacement in word_replacements.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    
    return result

updated = 0
for color in colors:
    desc = color.get('description', '')
    if not desc:
        continue
    
    translated = translate_description(desc)
    if translated != desc:
        color['description'] = translated
        updated += 1

json.dump(complete, open('public/data/lvt_colors_complete.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

print(f'✅ Prevedeno: {updated} opisa')
