
import os
import re
import json

# Paths
BASE_DIR = os.getcwd()
MOCK_DATA_PATH = os.path.join(BASE_DIR, 'lib', 'data', 'mock-data.ts')
LINOLEUM_JSON_PATH = os.path.join(BASE_DIR, 'public', 'data', 'linoleum_colors_complete.json')

# Translation Dictionary
TRANSLATIONS = {
    # Keys
    "wear_layer": "Sloj habanja",
    "thickness": "Debljina",
    "format": "Format",
    "usage_class": "Klasa upotrebe",
    "fire_class": "Protivpožarna klasifikacija",
    "installation": "Tip instalacije",
    "surface": "Površinska obrada",
    "total_thickness": "Ukupna debljina",
    "dimension": "Dimenzije",
    "acoustic": "Akustična izolacija",
    "underlay": "Podloga",
    "lock": "Sistem spajanja",
    "warranty": "Garancija",
    "waterproof": "Vodootporan",
    
    # Values / Phrases
    "Plank": "Daska",
    "Tile": "Ploča",
    "Roll": "Rolna",
    "Glued": "Lepljenje",
    "Click system": "Click sistem",
    "Looselay": "Looselay",
    "High abrasion and scratch resistance": "Visoka otpornost na habanje i ogrebotine",
    "ideal for high traffic areas": "idealno za prostore sa visokim prometom",
    "Excellent antiviral and antibacterial properties": "Odlična antivirusna i antibakterijska svojstva",
    "suitable for healthcare facilities": "pogodno za zdravstvene ustanove",
    "natural ingredients": "prirodni sastojci",
    "renewable ingredients": "obnovljivi sastojci",
    "recycled content": "reciklirani sadržaj",
    "Made in Germany": "Proizvedeno u Nemačkoj",
    "Made in Europe": "Proizvedeno u Evropi",
    "Slip resistance": "Otpornost na klizanje",
    "sound insulation": "zvučna izolacija",
    "thermal comfort": "toplotna udobnost",
    "easy maintenance": "jednostavno održavanje",
    "easy cleaning": "lako čišćenje",
    "resistant to": "otporno na",
    "impact sound": "zvuk udara",
    "walking comfort": "udobnost pri hodu",
    "Phthalate free": "Bez ftalata",
    "Indoor air quality": "Kvalitet unutrašnjeg vazduha",
    "very good": "vrlo dobar",
    "Bio based": "Na bazi bio materijala",
    "Mineral": "Mineralni",
    "Organic flooring": "Organski podovi",
    "Resource preservation": "Očuvanje resursa",
    "Carbon neutral": "CO2 neutralno",
    "Cradle to Cradle": "Cradle to Cradle",
    "Silver certificate": "Srebrni sertifikat",
    "Bronze certificate": "Bronzani sertifikat",
    "Matt effect": "Mat efekat",
    "Marble pattern": "Mermerni dezen",
    "Solid pattern": "Jednobojni dezen",
    "Speckled pattern": "Tačkasti dezen",
    "Linear pattern": "Linearni dezen",
    "Industrial pattern": "Industrijski dezen",
    "Svetle i blistave boje": "Svetle i blistave boje", # Keep existing good ones
    "Dugotrajan izgled": "Dugotrajan izgled",
}

def clean_text(text):
    if not text:
        return ""
    
    # Remove escaped newlines and extra backslashes
    text = text.replace('\\n', '\n').replace('\\-', '-').replace('\\"', '"')
    # Use regex to replace escaped spaces '\ ' with ' '
    text = re.sub(r'\\ ', ' ', text)
    # Generic unescape for remaining backslashes before non-special chars if safe
    # text = re.sub(r'\\(.)', r'\1', text) # Be careful with this one

    
    # Remove raw JSON artifacts if any remnants exist (unlikely in clean text but good fallback)
    # text = re.sub(r'\{[^\}]+\}', '', text) # Dangerous if specs are embedded, skipping
    
    # Fix broken formatting like "Proizvod: n" -> "Proizvod:\n"
    text = re.sub(r':\s*n\s*', ':\n', text)
    
    # Normalize bullet points
    text = re.sub(r'\n\s*-\s*', '\n• ', text)
    
    # Apply translations
    for en, sr in TRANSLATIONS.items():
        # Case insensitive replace for phrases
        pattern = re.compile(re.escape(en), re.IGNORECASE)
        text = pattern.sub(sr, text)
        
    return text.strip()

def process_mock_data():
    if not os.path.exists(MOCK_DATA_PATH):
        print(f"Error: {MOCK_DATA_PATH} not found.")
        return

    with open(MOCK_DATA_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the products array or just process description strings globally
    # Processing description strings specificially is safer to avoid breaking code
    
    # Regex to find description: `...` or "..." or '...'
    # We target specific known problematic patterns from the file inspection
    
    def replacer(match):
        # Allow cleaning of the content inside backticks
        inner_text = match.group(1)
        cleaned = clean_text(inner_text)
        return f'`{cleaned}`'

    # Replace backtick strings (commonly used for multi-line descriptions in this file)
    new_content = re.sub(r'`([^`]*)`', replacer, content)
    
    # Specific fix for spec keys in mock-data if strictly needed, but let's see.
    # The user mentioned "specs" keys.
    # In mock-data.ts, specs are objects: { key: 'thickness', label: 'Debljina', value: '...' }
    # We should update the 'label' if it matches english terms.
    
    def spec_replacer(match):
        # match structure: { key: '...', label: '...', value: '...' }
        full_match = match.group(0)
        label_match = re.search(r"label:\s*['\"]([^'\"]+)['\"]", full_match)
        if label_match:
            label = label_match.group(1)
            if label in TRANSLATIONS:
                new_label = TRANSLATIONS[label]
                return full_match.replace(f"'{label}'", f"'{new_label}'")
        return full_match

    # Simplistic regex for single-line spec objects
    new_content = re.sub(r'\{[^{}]*key:[^{}]*\}', spec_replacer, new_content)

    with open(MOCK_DATA_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Processed {MOCK_DATA_PATH}")

def process_json_data():
    if not os.path.exists(LINOLEUM_JSON_PATH):
        print(f"Error: {LINOLEUM_JSON_PATH} not found.")
        return

    with open(LINOLEUM_JSON_PATH, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON in {LINOLEUM_JSON_PATH}")
            return

    if 'colors' in data:
        for item in data['colors']:
            # Clean description
            if 'description' in item:
                item['description'] = clean_text(item['description'])
            
            # Normalize characteristics keys and values
            if 'characteristics' in item:
                new_chars = {}
                for k, v in item['characteristics'].items():
                    # Translate Key
                    new_key = TRANSLATIONS.get(k, k)
                    # Translate Value
                    new_val = clean_text(v)
                    new_chars[new_key] = new_val
                item['characteristics'] = new_chars

    with open(LINOLEUM_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Processed {LINOLEUM_JSON_PATH}")

if __name__ == "__main__":
    print("Starting cleanup...")
    process_mock_data()
    process_json_data()
    print("Cleanup finished.")
