
import json
import re
import os

JSON_PATH = 'public/data/linoleum_colors_complete.json'

REPLACEMENTS = [
    (r"High abrasion i scratch resisance", "Visoka otpornost na habanje i ogrebotine"),
    (r"idealno za high trafic primena", "idealno za prostore sa visokim prometom"),
    (r"\( education, healthcare,...\)", "(obrazovne ustanove, zdravstvo...)"),
    (r"98% natural \(Na bazi bio materijala & Mineralnini\) ingredients", "98% prirodni sastojci (bio-baza i minerali)"),
    (r"organski podovi", "prirodni podovi"),
    (r"TVOC after 28 days <10 micrograms/m3", "TVOC nakon 28 dana <10 µg/m³"),
    (r"Up to 40% recikliranog sadržaja/100% reciklabilno", "Do 40% recikliranog sadržaja / 100% reciklabilno"),
    (r"Cradle to Cradle Silver sertifikat sertifikat", "Cradle to Cradle Silver sertifikat"), # Fix double word
    (r"Cradle to Cradle Bronze", "Cradle to Cradle Bronze sertifikat"),
    (r"Recycled foam backing 1,5mm", "Reciklirana penasta podloga 1.5mm"),
    (r"impact zvučna izolacija", "zvučna izolacija od udara"),
    (r"slip resistance", "otpornost na klizanje"),
    (r"Neocare Površinska obrada treatmen", "Neocare površinska obrada"), # Fix typo
    (r"Neocare površinska obrada: mat efekat", "Neocare površinska obrada: mat efekat"),
    (r"98% prirodni sastojci: Svetle i blistave boje", "98% prirodni sastojci: Svetle i blistave boje"), # Keep good ones
    (r"Creative Desgin", "Kreativni dizajn"), # Fix typo and translate
    (r"Broad pallet of 64 colours: to create every desired atmosphere", "Široka paleta od 64 boje: za kreiranje željene atmosfere"),
    (r"modern urban Industrijski dezen", "moderni urbani industrijski dezen"),
    (r"trendy terrazzo pattern", "trendi teraco dezen"),
    (r"Cork backing 2mm: 15dB zvučna izolacija", "Podloga od plute 2mm: 15dB zvučna izolacija"),
    (r"Slip otpornost", "Otpornost na klizanje"),
    (r"protivpožarna klasifikacija", "Protivpožarna klasifikacija"),
    (r"Excellent antiviral and antibacterial activity", "Odlična antivirusna i antibakterijska svojstva"),]

def refine_text(text):
    if not text:
        return text
    
    # Apply regex replacements
    for pattern, replacement in REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
    return text

def main():
    if not os.path.exists(JSON_PATH):
        print(f"Error: {JSON_PATH} not found")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    count = 0
    for item in data.get('colors', []):
        old_desc = item.get('description', '')
        new_desc = refine_text(old_desc)
        
        if old_desc != new_desc:
            item['description'] = new_desc
            count += 1

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ Refined {count} linoleum descriptions.")

if __name__ == "__main__":
    main()
