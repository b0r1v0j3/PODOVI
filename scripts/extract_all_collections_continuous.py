#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ekstraktuje sve kolekcije u jednom session-u sa checkpoint-ima
Ne gasi se nakon svake kolekcije - radi kontinuirano
Ima checkpoint-e da može nastaviti ako se pokvari
"""

import sys
import json
import time
import re
from pathlib import Path
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

sys.stdout.reconfigure(encoding='utf-8')

# Checkpoint file
CHECKPOINT_FILE = Path('downloads/extraction_checkpoint.json')

def setup_driver():
    """Setup Chrome WebDriver"""
    chrome_options = Options()
    chrome_options.add_argument('--start-maximized')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver

def load_checkpoint():
    """Load checkpoint to see which collections are already processed"""
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'processed': [], 'failed': []}

def save_checkpoint(processed, failed):
    """Save checkpoint"""
    checkpoint = {
        'processed': processed,
        'failed': failed,
        'timestamp': datetime.now().isoformat()
    }
    with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
        json.dump(checkpoint, f, indent=2, ensure_ascii=False)

def get_all_colors_from_collection(driver, collection_url):
    """Get all color URLs from a collection page"""
    print(f"  📊 Sakupljam sve boje iz kolekcije...")
    
    driver.get(collection_url)
    time.sleep(3)
    
    color_urls = []
    
    try:
        # Try to click "View all" to see all colors
        try:
            view_all_btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, 
                    "//button[contains(text(), 'View all')] | "
                    "//a[contains(text(), 'View all')] | "
                    "//button[contains(text(), 'view all')] | "
                    "//a[contains(text(), 'view all')]"
                ))
            )
            driver.execute_script("arguments[0].click();", view_all_btn)
            time.sleep(3)
        except:
            pass
        
        # Find all color/product links
        product_links = driver.find_elements(By.XPATH, 
            "//a[contains(@href, '/products/')]"
        )
        
        seen_urls = set()
        for link in product_links:
            href = link.get_attribute('href')
            if href and '/products/' in href:
                clean_url = href.split('#')[0].split('?')[0]
                if clean_url not in seen_urls and clean_url != collection_url:
                    # Check if it's a color (has color code pattern)
                    if re.search(r'-\d{4}-', clean_url) or re.search(r'r\d{7}', clean_url) or re.search(r'-\d{4}', clean_url):
                        color_urls.append(clean_url)
                        seen_urls.add(clean_url)
        
        # Close modal if open
        try:
            driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
            time.sleep(1)
        except:
            pass
        
    except Exception as e:
        print(f"    ⚠️  Greška pri sakupljanju boja: {e}")
    
    print(f"    ✓ Pronađeno {len(color_urls)} boja")
    return color_urls

def extract_description(driver):
    """Extract description from 'See full description' popup"""
    description = {
        'intro_text': None,
        'full_text': None,
        'sections': {}
    }
    
    try:
        # Find and click "See full description" button
        try:
            see_full_btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, 
                    "//a[contains(text(), 'See full description')] | "
                    "//button[contains(text(), 'See full description')]"
                ))
            )
            driver.execute_script("arguments[0].scrollIntoView(true);", see_full_btn)
            time.sleep(0.5)
            driver.execute_script("arguments[0].click();", see_full_btn)
            time.sleep(2)
        except:
            return description
        
        # Extract intro description
        try:
            intro_elements = driver.find_elements(By.XPATH, 
                "//*[contains(text(), 'natural ingredients') or contains(text(), 'flooring solution') or contains(text(), 'performance flooring') or contains(text(), 'high performance')]"
            )
            for elem in intro_elements:
                if elem.is_displayed() and elem.tag_name in ['p', 'div', 'strong', 'span']:
                    text = elem.text.strip()
                    if 20 < len(text) < 500:
                        description['intro_text'] = text
                        break
        except:
            pass
        
        # Extract full text from popup
        try:
            popup_selectors = [
                "//div[contains(@class, 'modal')]",
                "//div[contains(@class, 'popup')]",
                "//div[contains(@class, 'overlay')]//div[contains(@class, 'content')]",
                "//div[contains(@class, 'product-description')]",
                "//div[contains(@class, 'product-details')]"
            ]
            
            for selector in popup_selectors:
                try:
                    popup = driver.find_element(By.XPATH, selector)
                    if popup.is_displayed():
                        description['full_text'] = popup.text
                        break
                except:
                    continue
        except:
            pass
        
        # Extract structured sections
        section_keywords = [
            'Product & Design', 'Design & Product', 'Installation & Maintenance',
            'Market Application', 'Sustainability', 'Technical', 'Environmental'
        ]
        
        for section_name in section_keywords:
            try:
                section_headings = driver.find_elements(By.XPATH, 
                    f"//*[contains(text(), '{section_name}')]"
                )
                
                for heading in section_headings:
                    if heading.is_displayed() and heading.tag_name in ['h2', 'h3', 'strong', 'h4']:
                        try:
                            parent = heading.find_element(By.XPATH, "../..")
                        except:
                            try:
                                parent = heading.find_element(By.XPATH, "..")
                            except:
                                parent = heading
                        
                        bullets = parent.find_elements(By.XPATH, ".//li")
                        section_bullets = []
                        for bullet in bullets:
                            text = bullet.text.strip()
                            if text and len(text) < 200:
                                section_bullets.append(text)
                        
                        if section_bullets:
                            description['sections'][section_name] = section_bullets[:15]
                        break
            except:
                pass
        
        # Close popup
        try:
            driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
            time.sleep(0.5)
        except:
            pass
        
    except Exception as e:
        print(f"      ⚠️  Greška pri ekstrakciji opisa: {e}")
    
    return description

def extract_characteristics(driver):
    """Extract characteristics by clicking on 'Characteristics' dropdown"""
    specs = {}
    
    try:
        # First, scroll to top to ensure we can find elements
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(0.5)
        
        # Find "Technical and environmental specifications" section first
        try:
            section_header = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH,
                    "//*[contains(text(), 'Technical and environmental specifications')] | "
                    "//*[contains(text(), 'Technical')] | "
                    "//*[contains(text(), 'Specifications')]"
                ))
            )
            # Scroll to section with offset to ensure it's fully visible
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", section_header)
            time.sleep(1)
        except:
            # If section not found, try to scroll down gradually
            driver.execute_script("window.scrollTo(0, 500);")
            time.sleep(0.5)
        
        # Find and click "Characteristics" dropdown/button
        try:
            # Look for Characteristics text first
            char_text = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, 
                    "//*[contains(text(), 'Characteristics')]"
                ))
            )
            
            # Scroll to Characteristics with center alignment
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", char_text)
            time.sleep(0.5)
            
            # Find clickable parent (button or div with click handler)
            char_button = None
            try:
                # Try to find button ancestor
                char_button = char_text.find_element(By.XPATH, 
                    "./ancestor::button[1] | "
                    "./ancestor::div[contains(@class, 'accordion')][1] | "
                    "./ancestor::div[contains(@class, 'collapsible')][1] | "
                    "./ancestor::div[contains(@class, 'header')][1] | "
                    "./parent::*[contains(@class, 'header') or contains(@class, 'title')] | "
                    "./.."
                )
            except:
                char_button = char_text
            
            if char_button:
                # Scroll again to ensure button is visible
                driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", char_button)
                time.sleep(0.5)
                
                # Click to expand
                driver.execute_script("arguments[0].click();", char_button)
                time.sleep(2)  # Wait longer for dropdown to expand
        except Exception as e:
            print(f"      ⚠️  Nije pronađen Characteristics button: {e}")
            return specs
        
        # Extract all key-value pairs from Characteristics section
        try:
            # Find the expanded Characteristics section
            char_section = driver.find_element(By.XPATH,
                "//*[contains(text(), 'Characteristics')]/ancestor::div[contains(@class, 'section') or contains(@class, 'panel') or contains(@class, 'details')][1] | "
                "//*[contains(text(), 'Characteristics')]/following-sibling::div[1] | "
                "//*[contains(text(), 'Characteristics')]/parent::div"
            )
            
            # Find all items in the section
            items = char_section.find_elements(By.XPATH,
                ".//div[contains(@class, 'item')] | "
                ".//div[contains(@class, 'row')] | "
                ".//li | "
                ".//tr | "
                ".//div[contains(@class, 'spec')] | "
                ".//div[contains(@class, 'characteristic')]"
            )
            
            for item in items:
                text = item.text.strip()
                if not text or len(text) < 3:
                    continue
                
                # Try different formats
                if ':' in text:
                    parts = text.split(':', 1)
                    key = parts[0].strip().upper()
                    value = parts[1].strip()
                    if key and value:
                        specs[key] = value
                elif '\n' in text:
                    lines = text.split('\n')
                    if len(lines) >= 2:
                        key = lines[0].strip().upper()
                        value = lines[1].strip()
                        if key and value:
                            specs[key] = value
        except Exception as e:
            print(f"      ⚠️  Greška pri ekstrakciji iz Characteristics sekcije: {e}")
        
        # Fallback: Look for specific keywords
        spec_keywords = {
            'FORMAT': ['format', 'Format details'],
            'DIMENSION': ['dimension', 'dimensions'],
            'OVERALL THICKNESS': ['overall thickness', 'thickness'],
            'WELDING ROD': ['welding rod', 'welding rod ref'],
            'WIDTH': ['width', 'width of sheet'],
            'LENGTH': ['length', 'length of sheet']
        }
        
        for key, search_terms in spec_keywords.items():
            if key in specs:  # Already found
                continue
            
            for term in search_terms:
                try:
                    elements = driver.find_elements(By.XPATH, 
                        f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{term.lower()}')]"
                    )
                    
                    for elem in elements:
                        if not elem.is_displayed():
                            continue
                        
                        text = elem.text.strip()
                        if term.lower() not in text.lower():
                            continue
                        
                        if ':' in text:
                            parts = text.split(':', 1)
                            if term.lower() in parts[0].lower():
                                value = parts[1].strip()
                                if value:
                                    specs[key] = value
                                    break
                except:
                    pass
                
                if key in specs:
                    break
        
        # Special handling: Combine WIDTH and LENGTH into DIMENSION
        if 'WIDTH' in specs and 'LENGTH' in specs and 'DIMENSION' not in specs:
            specs['DIMENSION'] = f"{specs['WIDTH']} X {specs['LENGTH']}"
        elif 'WIDTH OF SHEET' in specs and 'LENGTH OF SHEET' in specs and 'DIMENSION' not in specs:
            specs['DIMENSION'] = f"{specs['WIDTH OF SHEET']} X {specs['LENGTH OF SHEET']}"
        
    except Exception as e:
        print(f"      ⚠️  Greška pri ekstrakciji characteristics: {e}")
    
    return specs

def process_collection(driver, collection_url, collection_type):
    """Process a single collection - extract only color data"""
    collection_slug = collection_url.split('/')[-1]
    print(f"\n{'='*80}")
    print(f"OBRADA KOLEKCIJE: {collection_slug.upper()}")
    print(f"{'='*80}")
    print(f"URL: {collection_url}\n")
    
    try:
        # Get all colors
        color_urls = get_all_colors_from_collection(driver, collection_url)
        
        if not color_urls:
            print(f"  ⚠️  Nisu pronađene boje!")
            return None
        
        results = {
            'collection_slug': collection_slug,
            'collection_type': collection_type,
            'collection_url': collection_url,
            'timestamp': datetime.now().isoformat(),
            'colors': []
        }
        
        # Process each color
        print(f"\n🎨 Obrada {len(color_urls)} boja...")
        for i, color_url in enumerate(color_urls, 1):
            color_slug = color_url.split('/')[-1]
            print(f"\n  [{i}/{len(color_urls)}] {color_slug}")
            
            try:
                driver.get(color_url)
                time.sleep(2)
                
                # Extract description
                print(f"    📝 Ekstraktujem description...")
                description = extract_description(driver)
                
                # Extract characteristics (click on dropdown)
                print(f"    🔧 Ekstraktujem characteristics...")
                specs = extract_characteristics(driver)
                
                color_data = {
                    'url': color_url,
                    'slug': color_slug,
                    'description': description,
                    'specs': specs
                }
                
                results['colors'].append(color_data)
                
                if specs:
                    print(f"    ✓ Specs: {specs}")
                else:
                    print(f"    ⚠️  Nisu pronađeni specs")
                    
            except Exception as e:
                print(f"    ❌ Greška pri obradi boje: {e}")
                continue
        
        return results
        
    except Exception as e:
        print(f"❌ Greška pri obradi kolekcije: {e}")
        return None

def main():
    """Main function - processes all collections in one session"""
    print("="*80)
    print("KONTINUIRANA EKSTRAKCIJA SVIH KOLEKCIJA")
    print("="*80)
    print("\n⚠️  PAUZA: Klikni 'Accept All' na cookie popup-u ako se pojavi!")
    print("   Skripta će sačekati 30 sekundi da klikneš cookies...")
    print("   Zatim će nastaviti sa ekstrakcijom.\n")
    
    time.sleep(30)  # Wait for user to click cookies
    
    # Load checkpoint
    checkpoint = load_checkpoint()
    processed = set(checkpoint.get('processed', []))
    failed = checkpoint.get('failed', [])
    
    # Collections
    LVT_COLLECTIONS = [
        'https://www.gerflor-cee.com/products/creation-30-new-collection',
        'https://www.gerflor-cee.com/products/creation-55-new-collection',
        'https://www.gerflor-cee.com/products/creation-55-clic-new-collection',
        'https://www.gerflor-cee.com/products/creation-55-looselay',
        'https://www.gerflor-cee.com/products/creation-70-megaclic',
        'https://www.gerflor-cee.com/products/creation-saga2',
        'https://www.gerflor-cee.com/products/new-2025-creation-70-looselay',
        'https://www.gerflor-cee.com/products/creation-70-zen',
        'https://www.gerflor-cee.com/products/creation-40-zen',
        'https://www.gerflor-cee.com/products/creation-55-clic-acoustic-new-collection',
        'https://www.gerflor-cee.com/products/creation-70-clic-5mm-new-collection',
        'https://www.gerflor-cee.com/products/creation-40-clic-acoustic-new-collection',
        'https://www.gerflor-cee.com/products/creation-55-looselay-acoustic',
        'https://www.gerflor-cee.com/products/creation-70-connect',
        'https://www.gerflor-cee.com/products/creation-70-new-collection',
        'https://www.gerflor-cee.com/products/creation-55-zen',
        'https://www.gerflor-cee.com/products/creation-40-clic-new-collection',
        'https://www.gerflor-cee.com/products/creation-40-new-collection',
    ]
    
    LINOLEUM_COLLECTIONS = [
        'https://www.gerflor-cee.com/products/dlw-marmorette-2-mm',
        'https://www.gerflor-cee.com/products/dlw-marmorette-25-mm',
        'https://www.gerflor-cee.com/products/dlw-linodur',
        'https://www.gerflor-cee.com/products/dlw-marmorette-lch',
        'https://www.gerflor-cee.com/products/dlw-marmorette-r10',
        'https://www.gerflor-cee.com/products/dlw-marmorette-32-mm',
        'https://www.gerflor-cee.com/products/dlw-marmorette-acousticplus',
        'https://www.gerflor-cee.com/products/dlw-uni-walton-acoustic-plus',
        'https://www.gerflor-cee.com/products/dlw-uni-walton',
        'https://www.gerflor-cee.com/products/dlw-marmorette-acoustic',
        'https://www.gerflor-cee.com/products/dlw-marmorette-bfl-s1',
        'https://www.gerflor-cee.com/products/dlw-lino-art-urban',
        'https://www.gerflor-cee.com/products/dlw-colorette-acoustic-plus',
        'https://www.gerflor-cee.com/products/dlw-lino-art-moon',
        'https://www.gerflor-cee.com/products/dlw-colorette',
    ]
    
    all_collections = [
        ('lvt', LVT_COLLECTIONS),
        ('linoleum', LINOLEUM_COLLECTIONS),
    ]
    
    driver = setup_driver()
    
    try:
        total = sum(len(cols) for _, cols in all_collections)
        current = 0
        
        for collection_type, collections in all_collections:
            print(f"\n{'='*80}")
            print(f"OBRADA {collection_type.upper()} KOLEKCIJA ({len(collections)} kolekcija)")
            print(f"{'='*80}\n")
            
            for collection_url in collections:
                collection_slug = collection_url.split('/')[-1]
                
                # Skip if already processed
                if collection_slug in processed:
                    print(f"\n⏭️  Preskačem {collection_slug} (već obrađena)")
                    continue
                
                current += 1
                print(f"\n[{current}/{total}]")
                
                results = process_collection(driver, collection_url, collection_type)
                
                if results:
                    # Save results
                    output_dir = Path(f'downloads/product_descriptions/{collection_type}')
                    output_dir.mkdir(parents=True, exist_ok=True)
                    
                    output_file = output_dir / f"{results['collection_slug']}_colors.json"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(results, f, indent=2, ensure_ascii=False)
                    
                    print(f"\n💾 Sačuvano: {output_file.name}")
                    print(f"   Kolekcija: {results['collection_slug']}")
                    print(f"   Boja: {len(results['colors'])}")
                    
                    # Update checkpoint
                    processed.add(collection_slug)
                    save_checkpoint(list(processed), failed)
                    
                    colors_with_specs = sum(1 for c in results['colors'] if c.get('specs'))
                    print(f"   Boja sa specs: {colors_with_specs}/{len(results['colors'])}")
                else:
                    print(f"\n❌ Neuspešno: {collection_slug}")
                    failed.append(collection_slug)
                    save_checkpoint(list(processed), failed)
                
                # Pause between collections
                if current < total:
                    print(f"\n⏳ Pauza 5 sekundi pre sledeće kolekcije...")
                    time.sleep(5)
        
        print("\n" + "="*80)
        print("✅ EKSTRAKCIJA ZAVRŠENA!")
        print("="*80)
        print(f"\n📊 Rezime:")
        print(f"   ✓ Uspešno obrađeno: {len(processed)}")
        print(f"   ✗ Neuspešno: {len(failed)}")
        
        if failed:
            print(f"\n❌ Neuspešne kolekcije:")
            for slug in failed:
                print(f"   - {slug}")
        
    finally:
        driver.quit()
        print("\n🔒 Driver zatvoren")

if __name__ == '__main__':
    main()
