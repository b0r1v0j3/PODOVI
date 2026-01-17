
import os
import json
import re

# Paths
BASE_DIR = os.getcwd()
MOCK_DATA_PATH = os.path.join(BASE_DIR, 'lib', 'data', 'mock-data.ts')
LINOLEUM_JSON_PATH = os.path.join(BASE_DIR, 'public', 'data', 'linoleum_colors_complete.json')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

# Audit Rules
ENGLISH_TERMS = [
    "wear layer", "thickness", "warranty", "resistance", "width", "length", 
    "waterproof", "installation", "surface", "plank", "tile", "roll", 
    "description", "feature", "made in"
]

REQUIRED_SPECS_LVT = ["Debljina", "Sloj habanja", "Format", "Tip instalacije", "Klasa upotrebe"]
REQUIRED_SPECS_LINO = ["Ukupna debljina", "Format", "Tip instalacije"]

def check_image_exists(url):
    if not url:
        return False
    # Remove leading slash for local path check
    local_path = url.lstrip('/')
    full_path = os.path.join(PUBLIC_DIR, local_path)
    return os.path.exists(full_path)

def detect_english(text):
    if not text:
        return []
    found = []
    text_lower = text.lower()
    for term in ENGLISH_TERMS:
        # Simple word boundary check to avoid partial matches inside valid words if needed
        # But for now simple substring check is okay for these specific terms
        if f" {term} " in f" {text_lower} ":
            found.append(term)
    return found

def audit_linoleum():
    print("\n--- Auditing Linoleum Data ---")
    issues = []
    
    if not os.path.exists(LINOLEUM_JSON_PATH):
        print("CRITICAL: Linoleum JSON file missing!")
        return
        
    with open(LINOLEUM_JSON_PATH, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except:
            print("CRITICAL: Invalid JSON")
            return

    colors = data.get("colors", [])
    print(f"Scanning {len(colors)} linoleum products...")

    for item in colors:
        pid = item.get("code", "UNKNOWN")
        name = item.get("name", "UNKNOWN")
        
        # 1. Description Check
        desc = item.get("description", "")
        if len(desc) < 20:
            issues.append(f"[{pid}] Short description: {len(desc)} chars")
        
        eng_found = detect_english(desc)
        if eng_found:
            issues.append(f"[{pid}] English terms in description: {', '.join(eng_found)}")

        # 2. Specs Check
        specs = item.get("characteristics", {})
        for req in REQUIRED_SPECS_LINO:
            if req not in specs:
                 issues.append(f"[{pid}] Missing characteristic: {req}")
        
        # Check for English in spec keys
        for key in specs.keys():
            if detect_english(key):
                issues.append(f"[{pid}] English spec key: {key}")

        # 3. Image Check
        img_url = item.get("image_url", "")
        if not check_image_exists(img_url):
            issues.append(f"[{pid}] Broken image link: {img_url}")

    if not issues:
        print("✅ Linoleum data looks CLEAN!")
    else:
        print(f"⚠️ Found {len(issues)} issues in Linoleum data.")
        # Print first 10
        for i in issues[:10]:
            print(f"  - {i}")
        if len(issues) > 10:
            print(f"  ... and {len(issues) - 10} more.")

def audit_lvt_mock():
    print("\n--- Auditing LVT/Mock Data ---")
    issues = []
    
    if not os.path.exists(MOCK_DATA_PATH):
        print("CRITICAL: Mock data file missing!")
        return

    with open(MOCK_DATA_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Naive parsing of TS object structure for 'products' array
    # We will look for objects inside `export const products: Product[] = [...]`
    
    # Extract the array content
    match = re.search(r'export const products: Product\[\] = \[(.*?)\];', content, re.DOTALL)
    if not match:
        print("Could not parse products array in mock-data.ts")
        return

    products_str = match.group(1)
    
    # Split by simple object heuristic is hard to do reliably with regex alone for nested objects
    # But we can iterate over `id: '...'` occurrences to approximate item boundaries
    
    product_blocks = re.split(r',\s*\{', products_str)
    
    print(f"Scanning approx {len(product_blocks)} mock products...")
    
    for block in product_blocks:
        # Extract ID
        id_match = re.search(r"id:\s*['\"]([^'\"]+)['\"]", block)
        if not id_match:
            continue
        pid = id_match.group(1)
        
        # Extract Name
        name_match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", block)
        name = name_match.group(1) if name_match else "Unknown"

        # Check Description logic (looking for escaped chars etc)
        if "\\n" in block:
             issues.append(f"[{pid} - {name}] Contains escaped newlines (\\n)")
             
        # Check for English terms in the block text
        eng_found = detect_english(block)
        if eng_found:
             # Filter out expected code keywords if any matches happen (e.g. 'width' might be a key)
             # We want to check VALUES mostly.
             pass 

        # Check Spec Keys (simple regex check for keys that look English)
        # e.g. { key: 'thickness', label: 'Thickness' ... } -> We want 'Debljina'
        
        # Find label assignments
        labels = re.findall(r"label:\s*['\"]([^'\"]+)['\"]", block)
        for label in labels:
            if label in ["Thickness", "Wear layer", "Warranty"]:
                issues.append(f"[{pid} - {name}] English spec label: {label}")

    if not issues:
        print("✅ LVT/Mock data looks CLEAN!")
    else:
        print(f"⚠️ Found {len(issues)} issues in LVT data.")
        for i in issues[:10]:
            print(f"  - {i}")

if __name__ == "__main__":
    audit_linoleum()
    audit_lvt_mock()
