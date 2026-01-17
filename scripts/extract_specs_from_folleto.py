#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ekstraktuje NCS, LRV, Packaging iz 'creation 304050 - folleto.pdf'
"""

import sys
import json
import re
import pdfplumber
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def normalize_text(text):
    if not text:
        return ""
    return text.replace('\n', ' ').strip()

def main():
    pdf_path = Path("downloads/gerflor_documents/creation-40/creation 304050 - folleto.pdf")
    json_path = Path("public/data/lvt_colors_complete.json")
    
    if not pdf_path.exists():
        print(f"❌ PDF not found: {pdf_path}")
        return

    print(f"📄 Processing: {pdf_path.name}")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    colors = data.get('colors', [])
    updated_count = 0
    
    # Map code -> color object for fast lookup
    # Note: A code like "1704" might exist in multiple collections (30, 40, 55).
    # The Folleto covers 30, 40, 55. 
    # Usually the NCS/LRV is the same for the same design code.
    colors_by_code = {}
    for c in colors:
        code = c.get('code')
        if code:
            if code not in colors_by_code:
                colors_by_code[code] = []
            colors_by_code[code].append(c)

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                # Basic heuristic: look for rows with 4-digit codes and NCS patterns
                for row in table:
                    # Flatten row to text
                    row_text = " ".join([normalize_text(cell) for cell in row if cell])
                    
                    # Debug print
                    # print(f"DEBUG ROW: {row_text[:50]}...")
                    
                    # Find NCS Code
                    ncs_match = re.search(r'(NCS\s+S\s+\d{4}-[A-Z]\d{2}[A-Z]|[A-Z]\d{4}-[A-Z]\d{2}[A-Z]|\d{4}-[A-Z]\d{2}[A-Z])', row_text)
                    
                    # Find LRV
                    lrv_match = re.search(r'\b(\d{1,2}\.\d)\b', row_text)
                    
                    # Find Packaging (e.g. "15 3.36" -> 15 units, 3.36 m2)
                    # Look for pattern: Dimension ... Int ... Float ...
                    # Example: 184x1219 15 3.36 241.92
                    # Regex: \s(\d{1,3})\s+(\d{1,2}\.\d{2})
                    pkg_match = re.search(r'\b(\d{1,3})\s+(\d{1,2}[.,]\d{2})\b', row_text)
                    
                    if ncs_match:
                        ncs_value = ncs_match.group(1).replace('S ', 'S ') # Ensure spacing standard if needed
                        if not ncs_value.startswith('NCS'):
                            ncs_value = "NCS S " + ncs_value.replace("NCS S ", "").replace("S ", "")
                        
                        lrv_value = lrv_match.group(1) if lrv_match else None
                        
                        box_units = None
                        box_m2 = None
                        if pkg_match:
                            box_units = pkg_match.group(1)
                            box_m2 = pkg_match.group(2).replace(',', '.')
                        
                        # MATCHING STRATEGY
                        matched_colors = []
                        
                        # 1. Try by Code
                        for code, color_objs in colors_by_code.items():
                             if re.search(r'\b' + re.escape(code) + r'\b', row_text):
                                 matched_colors.extend(color_objs)
                                 
                        # 2. Try by Name if no code match found (or even if found, to be safe?)
                        # Use simple name containment (case insensitive)
                        if not matched_colors:
                            row_text_lower = row_text.lower()
                            for c in colors:
                                name_part = c.get('name', '').split(' - ')[0] # Handle "Name - Suffix"
                                name_part = name_part.lower().strip()
                                
                                # Skip very short names to avoid false positives
                                if len(name_part) < 4:
                                    continue
                                    
                                if name_part in row_text_lower:
                                    matched_colors.append(c)
                        
                        if matched_colors:
                            for color in matched_colors:
                                if 'specs' not in color:
                                    color['specs'] = {}
                                
                                color['specs']['NCS'] = ncs_value
                                if lrv_value:
                                    color['specs']['LRV'] = lrv_value
                                if box_units and box_m2:
                                    color['specs']['packaging'] = f"{box_units} kom/kutija ({box_m2} m²)"
                                    
                                # Mark as updated
                                updated_count += 1
                                print(f"Updated {color.get('code')} {color.get('name')[:20]}: NCS={ncs_value}, LRV={lrv_value}, Pkg={box_units}")

                                    
            # Also try to extract packaging info from text if not in table (it's often in headers)
            # But packaging is collection specific, not row specific usually.
            # We can hardcode packaging rules for Creation 30/40/55 based on the screenshot/knowledge if needed.
            # Or parse: "184x1219 15 3.36" -> 15 units.
            
            # Let's stick to NCS/LRV first as that is critical and unique per color.

    # Save
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"\n✅ Updated {updated_count} colors.")

if __name__ == "__main__":
    main()
