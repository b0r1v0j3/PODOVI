#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate design recommendations based on Gerflor analysis
"""

import json
import os

def generate_recommendations():
    """Generate design recommendations"""
    
    recommendations = {
        'layout_improvements': [
            {
                'issue': 'Praznine na stranici',
                'solution': 'Dodati više sekcija sa relevantnim informacijama (sertifikati, ekološke karakteristike, dokumenti)',
                'priority': 'HIGH'
            },
            {
                'issue': 'Linoleum stranica nema sertifikate i ekološke karakteristike',
                'solution': 'Dodati iste sekcije kao kod LVT proizvoda',
                'priority': 'HIGH'
            },
            {
                'issue': 'Nedovoljno iskorišćen prostor',
                'solution': 'Dodati više informacija u grid layout, popuniti prazne sekcije',
                'priority': 'MEDIUM'
            }
        ],
        'sections_to_add': [
            {
                'section': 'Sertifikati kvaliteta',
                'description': 'Dodati sekciju sa sertifikatima (FloorScore, Indoor Air Comfort, M1, CE, itd.)',
                'location': 'Ispod karakteristika proizvoda',
                'for_categories': ['LVT', 'Linoleum']
            },
            {
                'section': 'Ekološke karakteristike',
                'description': 'Dodati sekciju sa ekološkim karakteristikama (bez ftalata, reciklabilno, niske VOC emisije)',
                'location': 'Ispod sertifikata',
                'for_categories': ['LVT', 'Linoleum']
            },
            {
                'section': 'Dokumenti za preuzimanje',
                'description': 'Dodati sekciju sa PDF dokumentima (tehnički listovi, sertifikati)',
                'location': 'Ispod ekoloških karakteristika',
                'for_categories': ['LVT', 'Linoleum']
            },
            {
                'section': 'Primena',
                'description': 'Dodati sekciju koja opisuje gde se proizvod može koristiti',
                'location': 'U detailsSections',
                'for_categories': ['Linoleum']
            }
        ],
        'layout_changes': [
            {
                'change': 'Grid layout za karakteristike',
                'description': 'Koristiti grid layout umesto liste za bolje iskorišćenje prostora',
                'example': '2-3 kolone za karakteristike'
            },
            {
                'change': 'Kompaktniji spacing',
                'description': 'Smanjiti praznine između sekcija, dodati više sadržaja',
                'example': 'margin-bottom: 1.5rem umesto 3rem'
            },
            {
                'change': 'Sidebar sa brzim linkovima',
                'description': 'Dodati sidebar sa brzim linkovima (dokumenti, sertifikati, kontakt)',
                'example': 'Sticky sidebar na desktop verziji'
            }
        ],
        'content_improvements': [
            {
                'area': 'Linoleum proizvodi',
                'missing': [
                    'Sertifikati kvaliteta',
                    'Ekološke karakteristike',
                    'Dokumenti za preuzimanje',
                    'Detaljniji opis primene'
                ],
                'action': 'Dodati sve ove sekcije kao kod LVT proizvoda'
            }
        ]
    }
    
    # Save recommendations
    output_file = "downloads/gerflor_analysis/design_recommendations.json"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(recommendations, f, ensure_ascii=False, indent=2)
    
    # Generate markdown report
    markdown_file = "downloads/gerflor_analysis/DESIGN_RECOMMENDATIONS.md"
    with open(markdown_file, 'w', encoding='utf-8') as f:
        f.write("# Preporuke za poboljšanje dizajna sajta\n\n")
        f.write("Bazirano na analizi Gerflor sajta\n\n")
        
        f.write("## 🔴 Visok prioritet\n\n")
        for rec in recommendations['layout_improvements']:
            if rec['priority'] == 'HIGH':
                f.write(f"### {rec['issue']}\n")
                f.write(f"**Rešenje:** {rec['solution']}\n\n")
        
        f.write("## 📋 Sekcije koje treba dodati\n\n")
        for section in recommendations['sections_to_add']:
            f.write(f"### {section['section']}\n")
            f.write(f"- **Opis:** {section['description']}\n")
            f.write(f"- **Lokacija:** {section['location']}\n")
            f.write(f"- **Za kategorije:** {', '.join(section['for_categories'])}\n\n")
        
        f.write("## 🎨 Promene u layout-u\n\n")
        for change in recommendations['layout_changes']:
            f.write(f"### {change['change']}\n")
            f.write(f"- **Opis:** {change['description']}\n")
            f.write(f"- **Primer:** {change['example']}\n\n")
        
        f.write("## 📝 Poboljšanja sadržaja\n\n")
        for improvement in recommendations['content_improvements']:
            f.write(f"### {improvement['area']}\n")
            f.write("**Nedostaje:**\n")
            for item in improvement['missing']:
                f.write(f"- {item}\n")
            f.write(f"\n**Akcija:** {improvement['action']}\n\n")
    
    print("Preporuke generisane!")
    print(f"JSON: {output_file}")
    print(f"Markdown: {markdown_file}")

if __name__ == '__main__':
    generate_recommendations()
