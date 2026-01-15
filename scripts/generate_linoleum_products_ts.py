#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generiši TypeScript fajl sa linoleum kolekcijama
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json
from pathlib import Path

print("="*80)
print("GENERISANJE linoleum-products.ts")
print("="*80)

# Serbian translations for Gerflor linoleum descriptions
INTRO_TRANSLATIONS = {
    "The high performance flooring solution based on 98% natural ingredients!": "Visokoperformansno podno rešenje zasnovano na 98% prirodnih sastojaka!",
    "The high performance flooring solution based on 98% natural ingredients and 19dB sound insulation!": "Visokoperformansno podno rešenje zasnovano na 98% prirodnih sastojaka uz 19 dB zvučne izolacije!",
    "The high perforrmance flooring solution based on 98% natural ingredients and 19dB sound insulation!": "Visokoperformansno podno rešenje zasnovano na 98% prirodnih sastojaka uz 19 dB zvučne izolacije!",
    "The high performance flooring solution with the trendy terrazzo design based on 98% natural ingredients !": "Visokoperformansno podno rešenje sa modernim terrazzo dizajnom, zasnovano na 98% prirodnih sastojaka!",
    "The high performance flooring solution with a modern urban industrial design based on 98% natural ingredients !": "Visokoperformansno podno rešenje sa modernim urbanim industrijskim dizajnom, zasnovano na 98% prirodnih sastojaka!",
    "The high performance flooring solution with the well known marble design based on 98% natural ingredients !": "Visokoperformansno podno rešenje sa poznatim mermernim dizajnom, zasnovano na 98% prirodnih sastojaka!",
    "The high performance flooring solution with the well known marble design and 15dB sound insulation based on 98% natural ingredients !": "Visokoperformansno podno rešenje sa poznatim mermernim dizajnom i 15 dB zvučne izolacije, zasnovano na 98% prirodnih sastojaka!",
    "The high performance flooring solution with the well known marble design and dissipative properties based on 98% natural ingredients !": "Visokoperformansno podno rešenje sa poznatim mermernim dizajnom i disipativnim svojstvima, zasnovano na 98% prirodnih sastojaka!",
    "The powerhouse of the DLW Linoleum range based on 98% natural ingredients": "Najjače rešenje u DLW Linoleum asortimanu, zasnovano na 98% prirodnih sastojaka",
}

BULLET_TRANSLATIONS = {
    "98% natural ingredients: bright & sparkling colours": "98% prirodnih sastojaka: svetle i živopisne boje",
    "Inlaid designs: long lasting aspect": "Uloženi dizajni: dugotrajan izgled",
    "Neocare surface treatmen:matt effect": "Neocare površinska obrada: mat efekat",
    "Neocare surface treatment: matt effect": "Neocare površinska obrada: mat efekat",
    "Neocare surface treatment: easy maintenance and low total cost of ownership": "Neocare površinska obrada: lako održavanje i nizak ukupni trošak vlasništva",
    "Flexible product: easy to cut and to install": "Fleksibilan proizvod: lako se seče i ugrađuje",
    "High abrasion and scratch resisance: ideal for high trafic application ( education, healthcare,...)": "Visoka otpornost na habanje i ogrebotine: idealno za prostore sa velikim prometom (obrazovanje, zdravstvo...)",
    "Excellent antiviral and antibacterial comportment: suitable for healthcare application": "Odlično antivirusno i antibakterijsko ponašanje: pogodno za zdravstvene ustanove",
    "98% natural (bio based & mineral) ingredients: organic flooring solution": "98% prirodnih (bio-baziranih i mineralnih) sastojaka: organsko rešenje za podove",
    "76% rapidly renewable ingredients: preservation of resources": "76% brzo obnovljivih sastojaka: očuvanje resursa",
    "83% rapidly renewable ingredients: preservation of resources": "83% brzo obnovljivih sastojaka: očuvanje resursa",
    "83 % rapidly renewable ingredients: preservation of resources": "83% brzo obnovljivih sastojaka: očuvanje resursa",
    "Creative Design: marble pattern": "Kreativan dizajn: mermerni uzorak",
    "Creative Desgin: marble pattern": "Kreativan dizajn: mermerni uzorak",
    "Creative Design: solid pattern": "Kreativan dizajn: jednobojni uzorak",
    "Creative design: speckled pattern": "Kreativan dizajn: šareno tačkasti uzorak",
    "Creative Desgin: speckled pattern": "Kreativan dizajn: šareno tačkasti uzorak",
    "Creative Desgin: trendy terrazzo pattern": "Kreativan dizajn: moderni terrazzo uzorak",
    "Creative Desgin: modern urban industrial pattern": "Kreativan dizajn: moderan urbani industrijski uzorak",
    "Modern design: fine grain effect": "Moderan dizajn: efekat fine granulacije",
    "Broad pallet of 64 colours: to create every desired atmosphere": "Široka paleta od 64 boje: za kreiranje željene atmosfere",
    "Recycle foam backing 1,5mm: 19dB sound insulation": "Reciklirana penasta podloga 1,5 mm: 19 dB zvučne izolacije",
    "Recycled foam backing 1,5mm: 19dB sound insulation": "Reciklirana penasta podloga 1,5 mm: 19 dB zvučne izolacije",
    "Cork backing 2mm: 15dB sound insulation": "Podloga od plute 2 mm: 15 dB zvučne izolacije",
    "Thickness of 4 mm: suitable for mechanical traffic": "Debljina 4 mm: pogodno za mehanički saobraćaj",
    "High abrasion & scratch resisance: designed for industrial areas": "Visoka otpornost na habanje i ogrebotine: namenjeno industrijskim prostorima",
    "High abrasion and scratch resisance: ideal for high trafic application and environments where a dissipative version is required": "Visoka otpornost na habanje i ogrebotine: idealno za prostore sa velikim prometom i okruženja gde je potrebna disipativna verzija",
    "Slip Resistance: class R10": "Otpornost na klizanje: klasa R10",
    "Fire rating: Bfl-s1": "Otpornost na požar: Bfl-s1",
    "Dissipative features: vertical resistance ( EN 1081):  1x10⁶ ≤ R ≤ 1x10⁸": "Antistatička svojstva: vertikalni otpor (EN 1081): 1x10⁶ ≤ R ≤ 1x10⁸",
}

SECTION_TITLE_TRANSLATIONS = {
    "Product & Design": "Dizajn i struktura",
    "Installation & Maintenance": "Ugradnja i održavanje",
    "Market Application": "Primena",
    "Sustainability": "Održivost",
}

def ts_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ").strip()

def translate_intro(text: str) -> str:
    text = text.strip()
    if not text:
        return ""
    return INTRO_TRANSLATIONS.get(text, text)

def translate_bullet(text: str) -> str:
    text = text.strip()
    if not text:
        return ""
    return BULLET_TRANSLATIONS.get(text, text)

# Load data
with open('scripts/gerflor_linoleum_clean.json', encoding='utf-8') as f:
    data = json.load(f)

collections = data['collections']

print(f"\nKolekcije: {len(collections)}")

# Generate TypeScript
ts_content = """// Generated Gerflor Linoleum Products
// Auto-generated from scraped Gerflor website data

import { Product } from '@/types';

export const linoleumProducts: Product[] = [
"""

base_id = 100  # Start IDs from 100 to avoid conflict with LVT

for idx, collection in enumerate(collections, 1):
    product_id = base_id + idx
    slug = collection['slug']
    name = collection['name']
    specs = collection.get('specs', {})
    
    # Extract main characteristics
    format_val = specs.get('FORMAT', 'Roll')
    thickness = specs.get('OVERALL THICKNESS', '')
    intro = specs.get('intro_description', '')
    intro_sr = translate_intro(intro)
    
    # Build specs array
    spec_items = []
    
    if format_val:
        spec_items.append(f"      {{ key: 'format', label: 'Format', value: '{format_val}' }},")
    if thickness:
        spec_items.append(f"      {{ key: 'thickness', label: 'Ukupna debljina', value: '{thickness}' }},")
    
    spec_items.append(f"      {{ key: 'type', label: 'Tip', value: 'Linoleum' }},")
    spec_items.append(f"      {{ key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' }},")
    spec_items.append(f"      {{ key: 'surface', label: 'Površinska obrada', value: 'Neocare' }},")
    
    specs_str = "\n".join(spec_items)
    
    # Short description (Serbian)
    short_desc_source = intro_sr if intro_sr else 'Linoleum kolekcija - pogledajte sve boje'
    short_desc = short_desc_source[:150]
    if len(short_desc_source) > 150:
        short_desc = short_desc_source[:147] + '...'
    description_text = intro_sr if intro_sr else short_desc_source

    # Details sections (translated bullets)
    details_sections = []
    global_seen_items = set()
    for section_key, title_sr in SECTION_TITLE_TRANSLATIONS.items():
        items = specs.get(section_key, [])
        if isinstance(items, list) and items:
            translated_items = [translate_bullet(item) for item in items if isinstance(item, str)]
            translated_items = [item for item in translated_items if item]
            # Deduplicate items while keeping order
            unique_items = []
            seen_items = set()
            seen_98 = False
            for item in translated_items:
                if item in seen_items:
                    continue
                if item.lower().startswith('98% prirodnih') and seen_98:
                    continue
                if item.lower().startswith('98% prirodnih'):
                    seen_98 = True
                seen_items.add(item)
                unique_items.append(item)
            # Remove items that already appeared in previous sections
            filtered_items = []
            for item in unique_items:
                if item in global_seen_items:
                    continue
                global_seen_items.add(item)
                filtered_items.append(item)
            if filtered_items:
                details_sections.append({
                    "title": title_sr,
                    "items": filtered_items,
                })

    # Remove duplicate sections with identical item lists
    unique_sections = []
    seen_section_items = set()
    for section in details_sections:
        items_key = tuple(section.get("items", []))
        if items_key in seen_section_items:
            continue
        seen_section_items.add(items_key)
        unique_sections.append(section)

    details_sections_str = ""
    if unique_sections:
        lines = ["    detailsSections: ["]
        for section in unique_sections:
            lines.append("      {")
            lines.append(f"        title: '{ts_escape(section['title'])}',")
            lines.append("        items: [")
            for item in section["items"]:
                lines.append(f"          '{ts_escape(item)}',")
            lines.append("        ],")
            lines.append("      },")
        lines.append("    ],")
        details_sections_str = "\n" + "\n".join(lines)
    
    # External link
    external_link = collection['url']
    
    # Image
    image_url = f"/images/products/linoleum/{slug}.jpg"
    
    # Build product entry
    ts_content += f"""  {{
    id: '{product_id}',
    name: '{name}',
    slug: '{slug}',
    sku: 'LINOLEUM-{idx:02d}',
    categoryId: '7', // Linoleum category
    brandId: '6',    // Gerflor brand
    shortDescription: '{ts_escape(short_desc)}',
    description: '{ts_escape(description_text)}',
    images: [{{ id: '{product_id}-1', url: '{image_url}', alt: '{name}', isPrimary: true, order: 1 }}],
    specs: [
{specs_str}
    ],{details_sections_str}
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: {str(idx <= 5).lower()},
    externalLink: '{external_link}',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  }},
"""

ts_content += """];

export default linoleumProducts;
"""

# Save to lib/data/
output_path = Path("lib/data/linoleum-products.ts")
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"✓ Generisan TypeScript fajl: {output_path}")
print(f"✓ {len(collections)} proizvoda")
