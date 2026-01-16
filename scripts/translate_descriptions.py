#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prevodi description tekstove sa engleskog na srpski
"""

import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Translation mapping
TRANSLATIONS = {
    # Section titles
    'Design & Product': 'Dizajn i proizvod',
    'Product & Design': 'Dizajn i proizvod',
    'Installation & Maintenance': 'Ugradnja i održavanje',
    'Market Application': 'Primena',
    'Sustainability': 'Održivost',
    'Sustainability & Comfort': 'Održivost i komfor',
    'Technical': 'Tehničke karakteristike',
    'Environmental': 'Ekološke karakteristike',
    'Technical and environmental specifications': 'Tehničke i ekološke specifikacije',
    
    # Common phrases
    'Create without limits': 'Kreirajte bez ograničenja',
    'Complete format offering': 'Kompletna ponuda formata',
    'Refined designs': 'Profinjena rešenja',
    'harmonious color palettes': 'harmonične palete boja',
    'New surface embosses': 'Novi površinski utisci',
    'ultra-realistic': 'ultra-realistične',
    'varied textures': 'raznovrsne teksture',
    'velvet touch': 'baršunasti dodir',
    'natural elegance': 'prirodna elegancija',
    'enhanced visual variation': 'poboljšana vizuelna varijacija',
    'deeper realism': 'dublja realističnost',
    'authentic wood': 'autentičan drveni',
    'tile effects': 'efekat pločica',
    'seamless harmony': 'besprekorna harmonija',
    'professional-grade installation': 'profesionalna ugradnja',
    'lasting performance': 'dugotrajna performansa',
    'Ideal for new build': 'Idealno za novu gradnju',
    'enhanced resistance': 'poboljšana otpornost',
    'effortless cleaning': 'jednostavno čišćenje',
    'simplified care': 'pojednostavljeno održavanje',
    'maximum impact': 'maksimalan učinak',
    'Dry Back system': 'Dry Back sistem',
    'Click sistem': 'Click sistem',
    'Glue down': 'Lepljenje',
    'easy maintenance': 'jednostavno održavanje',
    'low total cost of ownership': 'niska ukupna cena vlasništva',
    'Flexible product': 'Fleksibilan proizvod',
    'easy to cut and to install': 'jednostavno za sečenje i ugradnju',
    'High abrasion and scratch resistance': 'Visoka otpornost na habanje i ogrebotine',
    'ideal for high traffic application': 'idealno za prostore sa visokim saobraćajem',
    'Excellent antiviral and antibacterial comportment': 'Odlična antivirusna i antibakterijska svojstva',
    'suitable for healthcare application': 'pogodno za zdravstvene ustanove',
    'natural ingredients': 'prirodni sastojci',
    'bright & sparkling colours': 'svetle i blistave boje',
    'Inlaid designs': 'Ugrađeni dizajni',
    'long lasting aspect': 'dugotrajan izgled',
    'matt effect': 'mat efekat',
    'Creative Design': 'Kreativni dizajn',
    'marble pattern': 'mermer šara',
    'organic flooring solution': 'organski podovi',
    'rapidly renewable ingredients': 'brzo obnovljivi sastojci',
    'preservation of resources': 'očuvanje resursa',
    'very good indoor air quality': 'vrlo dobar kvalitet unutrašnjeg vazduha',
    'recyclable': 'reciklabilno',
    'Made in Germany': 'Proizvedeno u Nemačkoj',
    'reduced CO2 footprint of transport': 'smanjen CO2 otisak transporta',
    'CO2 neutral from cradle to gate': 'CO2 neutralno od proizvodnje do isporuke',
    'Cradle to Cradle Silver': 'Cradle to Cradle Silver sertifikat',
}

def translate_text(text):
    """Translate text from English to Serbian"""
    if not text or not isinstance(text, str):
        return text
    
    translated = text
    
    # Translate known phrases (case insensitive, preserve original case pattern)
    for eng, srb in TRANSLATIONS.items():
        # Case insensitive replacement
        import re
        pattern = re.compile(re.escape(eng), re.IGNORECASE)
        translated = pattern.sub(srb, translated)
    
    return translated

def translate_description_in_file(file_path):
    """Translate descriptions in a colors JSON file"""
    print(f"\n📝 Prevođenje: {file_path.name}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    colors = data.get('colors', [])
    translated_count = 0
    
    for color in colors:
        description = color.get('description', {})
        if not description:
            continue
        
        # Translate intro_text
        if description.get('intro_text'):
            original = description['intro_text']
            translated = translate_text(original)
            if translated != original:
                description['intro_text'] = translated
                translated_count += 1
        
        # Translate full_text
        if description.get('full_text'):
            original = description['full_text']
            translated = translate_text(original)
            if translated != original:
                description['full_text'] = translated
                translated_count += 1
    
    # Save translated file
    if translated_count > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  ✅ Prevedeno: {translated_count} opisa")
    else:
        print(f"  ⚠️  Nije bilo šta za prevesti")
    
    return translated_count

def main():
    """Main function"""
    print("="*80)
    print("PREVOĐENJE DESCRIPTION TEKSTOVA SA ENGLESKOG NA SRPSKI")
    print("="*80)
    
    lvt_dir = Path('downloads/product_descriptions/lvt')
    linoleum_dir = Path('downloads/product_descriptions/linoleum')
    
    total_translated = 0
    
    # Translate LVT collections
    if lvt_dir.exists():
        print(f"\n🎨 PREVOĐENJE LVT KOLEKCIJA")
        print("-"*80)
        
        lvt_files = list(lvt_dir.glob('*_colors.json'))
        for colors_file in lvt_files:
            translated = translate_description_in_file(colors_file)
            total_translated += translated
    
    # Translate Linoleum collections
    if linoleum_dir.exists():
        print(f"\n🌿 PREVOĐENJE LINOLEUM KOLEKCIJA")
        print("-"*80)
        
        linoleum_files = list(linoleum_dir.glob('*_colors.json'))
        for colors_file in linoleum_files:
            translated = translate_description_in_file(colors_file)
            total_translated += translated
    
    print("\n" + "="*80)
    print("✅ PREVOĐENJE ZAVRŠENO!")
    print("="*80)
    print(f"\n📊 Rezime:")
    print(f"   ✓ Prevedeno: {total_translated} opisa")
    print(f"\n⚠️  NAPOMENA: Nakon prevođenja, pokreni:")
    print(f"   python scripts/integrate_colors_data.py")
    print(f"   da ažuriraš glavne JSON fajlove sa prevedenim tekstovima.")

if __name__ == '__main__':
    main()
