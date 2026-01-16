#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kompletna skripta za ekstrakciju svih LVT i Linoleum kolekcija sa category stranica
Ekstraktuje description i characteristics za sve kolekcije i sve boje
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
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

sys.stdout.reconfigure(encoding='utf-8')

def setup_driver():
    """Setup Chrome WebDriver"""
    chrome_options = Options()
    chrome_options.add_argument('--start-maximized')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver

def accept_cookies(driver):
    """Accept cookies if present"""
    try:
        cookie_button = driver.find_element(By.ID, "tarteaucitronPersonalize2")
        if cookie_button.is_displayed():
            cookie_button.click()
            time.sleep(1)
    except:
        pass

def get_all_collections_from_category(driver, category_url):
    """Get all collection URLs from a category page"""
    print(f"\n📊 Sakupljam sve kolekcije sa category stranice...")
    print(f"   URL: {category_url}\n")
    
    driver.get(category_url)
    time.sleep(3)
    accept_cookies(driver)
    
    collection_urls = []
    
    try:
        # Find all product/collection links
        # They usually have format like /products/collection-name
        product_links = driver.find_elements(By.XPATH, 
            "//a[contains(@href, '/products/')]"
        )
        
        seen_urls = set()
        for link in product_links:
            href = link.get_attribute('href')
            if href and '/products/' in href:
                # Clean URL (remove fragments, query params)
                clean_url = href.split('#')[0].split('?')[0]
                if clean_url not in seen_urls and clean_url != category_url:
                    # Check if it's a collection (not a specific color)
                    # Collections usually don't have color codes in URL
                    if not re.search(r'-\d{4}-', clean_url) and not re.search(r'r\d{7}', clean_url):
                        collection_urls.append(clean_url)
                        seen_urls.add(clean_url)
        
        print(f"  ✓ Pronađeno {len(collection_urls)} kolekcija")
        
        # Print first few for verification
        for i, url in enumerate(collection_urls[:5], 1):
            slug = url.split('/')[-1]
            print(f"    {i}. {slug}")
        if len(collection_urls) > 5:
            print(f"    ... i još {len(collection_urls) - 5} kolekcija")
            
    except Exception as e:
        print(f"  ⚠️  Greška pri sakupljanju kolekcija: {e}")
    
    return collection_urls

def extract_collection_description(driver, collection_url):
    """Extract collection description from popup or page - using existing logic"""
    # Use the same logic as extract_collection_descriptions.py
    description_data = extract_description_from_popup(driver)
    
    if description_data:
        return {
            'intro_text': description_data.get('intro_text', ''),
            'full_text': description_data.get('full_text', ''),
            'sections': description_data.get('sections', {}),
            'specs': description_data.get('specs', {})
        }
    
    return {
        'intro_text': None,
        'full_text': None,
        'sections': {},
        'specs': {}
    }

def extract_description_from_popup(driver):
    """Extract description text from 'See full description' popup - using existing proven logic"""
    # Import and use the exact same logic from extract_collection_descriptions.py
    # This is a simplified version that matches the working script
    try:
        wait = WebDriverWait(driver, 10)
        
        # Find and click "See full description" button
        see_full_btn = wait.until(EC.element_to_be_clickable((
            By.XPATH, "//a[contains(text(), 'See full description')] | //button[contains(text(), 'See full description')]"
        )))
        driver.execute_script("arguments[0].scrollIntoView(true);", see_full_btn)
        time.sleep(0.5)
        driver.execute_script("arguments[0].click();", see_full_btn)
        time.sleep(2)
        
        # Extract intro description
        intro_text = ""
        try:
            intro_elements = driver.find_elements(By.XPATH, 
                "//*[contains(text(), 'natural ingredients') or contains(text(), 'flooring solution') or contains(text(), 'performance flooring') or contains(text(), 'high performance')]"
            )
            for elem in intro_elements:
                if elem.is_displayed() and elem.tag_name in ['p', 'div', 'strong', 'span']:
                    text = elem.text.strip()
                    if 20 < len(text) < 500:
                        intro_text = text
                        break
        except:
            pass
        
        # Extract full text from popup
        full_text = ""
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
                        full_text = popup.text
                        break
                except:
                    continue
        except:
            pass
        
        # Extract structured sections
        sections = {}
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
                            sections[section_name] = section_bullets[:15]
                        break
            except:
                pass
        
        # Extract specs
        specs = {}
        try:
            spec_keywords = ['FORMAT', 'OVERALL THICKNESS', 'DIMENSION']
            for keyword in spec_keywords:
                try:
                    elements = driver.find_elements(By.XPATH, 
                        f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{keyword.lower()}')]"
                    )
                    for elem in elements:
                        if elem.is_displayed():
                            text = elem.text.strip()
                            if keyword.upper() in text.upper() and ':' in text:
                                value = text.split(':', 1)[1].strip()
                                if value:
                                    specs[keyword] = value
                                    break
                except:
                    pass
        except:
            pass
        
        # Close popup
        try:
            driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
            time.sleep(0.5)
        except:
            pass
        
        return {
            'intro_text': intro_text,
            'full_text': full_text,
            'sections': sections,
            'specs': specs
        }
    except Exception as e:
        return None

def get_product_specs(driver):
    """Extract product specifications from current page - using proven logic from existing script"""
    specs = {}
    try:
        # Use the same logic as extract_collection_descriptions.py
        spec_keywords = ['FORMAT', 'DIMENSION', 'OVERALL THICKNESS', 'WELDING ROD REF.', 'WELDING ROD', 'WIDTH', 'LENGTH', 'WIDTH OF SHEET', 'LENGTH OF SHEET']
        
        for keyword in spec_keywords:
            try:
                elements = driver.find_elements(By.XPATH, 
                    f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{keyword.lower()}')]"
                )
                
                for elem in elements:
                    if elem.is_displayed():
                        # Try to find value in same element or parent
                        text = elem.text.strip()
                        if keyword.upper() in text.upper():
                            if ':' in text:
                                parts = text.split(':', 1)
                                value = parts[1].strip()
                                if value:
                                    specs[keyword] = value
                                    break
                            else:
                                # Try parent
                                try:
                                    parent = elem.find_element(By.XPATH, "..")
                                    parent_text = parent.text.strip()
                                    if ':' in parent_text:
                                        parts = parent_text.split(':', 1)
                                        if keyword.upper() in parts[0].upper():
                                            value = parts[1].strip()
                                            if value:
                                                specs[keyword] = value
                                                break
                                except:
                                    pass
                                    
                        # Also check for category-label class (from existing script)
                        if elem.get_attribute('class') == 'category-label':
                            try:
                                parent = elem.find_element(By.XPATH, "..")
                                parent_lines = parent.text.strip().split("\n")
                                if len(parent_lines) >= 2:
                                    label = parent_lines[0].strip()
                                    value = parent_lines[1].strip()
                                    if keyword.upper() in label.upper():
                                        specs[keyword] = value
                                        break
                            except:
                                pass
            except:
                pass
        
        # Special handling: Combine WIDTH and LENGTH into DIMENSION
        if 'WIDTH' in specs and 'LENGTH' in specs and 'DIMENSION' not in specs:
            specs['DIMENSION'] = f"{specs['WIDTH']} X {specs['LENGTH']}"
        elif 'WIDTH OF SHEET' in specs and 'LENGTH OF SHEET' in specs and 'DIMENSION' not in specs:
            specs['DIMENSION'] = f"{specs['WIDTH OF SHEET']} X {specs['LENGTH OF SHEET']}"
        
    except Exception as e:
        print(f"      ⚠️  Greška pri ekstrakciji specs: {e}")
    
    return specs

def get_all_colors_from_collection(driver, collection_url):
    """Get all color URLs from a collection page"""
    print(f"  📊 Sakupljam sve boje iz kolekcije...")
    
    driver.get(collection_url)
    time.sleep(3)
    accept_cookies(driver)
    
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

def process_collection(driver, collection_url, collection_type):
    """Process a single collection - extract description and all colors"""
    collection_slug = collection_url.split('/')[-1]
    print(f"\n{'='*80}")
    print(f"OBRADA KOLEKCIJE: {collection_slug.upper()}")
    print(f"{'='*80}")
    print(f"URL: {collection_url}\n")
    
    results = {
        'collection_slug': collection_slug,
        'collection_type': collection_type,
        'collection_url': collection_url,
        'timestamp': datetime.now().isoformat(),
        'collection_description': None,
        'colors': []
    }
    
    try:
        # Extract collection description
        print("📝 Ekstraktujem opis kolekcije...")
        driver.get(collection_url)
        time.sleep(3)
        accept_cookies(driver)
        
        results['collection_description'] = extract_collection_description(driver, collection_url)
        print(f"  ✓ Opis ekstraktovan")
        
        # Get all colors
        color_urls = get_all_colors_from_collection(driver, collection_url)
        
        if not color_urls:
            print(f"  ⚠️  Nisu pronađene boje!")
            return results
        
        # Process each color
        print(f"\n🎨 Obrada {len(color_urls)} boja...")
        for i, color_url in enumerate(color_urls, 1):
            color_slug = color_url.split('/')[-1]
            print(f"\n  [{i}/{len(color_urls)}] {color_slug}")
            
            try:
                driver.get(color_url)
                time.sleep(2)
                accept_cookies(driver)
                
                # Extract color description
                color_desc = extract_collection_description(driver, color_url)
                
                # Extract color specs
                color_specs = get_product_specs(driver)
                
                color_data = {
                    'url': color_url,
                    'slug': color_slug,
                    'specs': color_specs,
                    'description': color_desc
                }
                
                results['colors'].append(color_data)
                
                if color_specs:
                    print(f"    ✓ Specs ekstraktovani: {color_specs}")
                else:
                    print(f"    ⚠️  Nisu pronađeni specs")
                    
            except Exception as e:
                print(f"    ❌ Greška pri obradi boje: {e}")
                continue
        
    except Exception as e:
        print(f"❌ Greška pri obradi kolekcije: {e}")
    
    return results

def main():
    """Main function"""
    print("="*80)
    print("KOMPLETNA EKSTRAKCIJA SVIH KOLEKCIJA")
    print("="*80)
    
    # Category URLs
    LVT_CATEGORY = "https://www.gerflor-cee.com/category/lvt-tiles-planks"
    LINOLEUM_CATEGORY = "https://www.gerflor-cee.com/category/linoleum"
    
    driver = setup_driver()
    
    try:
        # Process LVT collections
        print("\n" + "="*80)
        print("LVT KOLEKCIJE")
        print("="*80)
        
        lvt_collections = get_all_collections_from_category(driver, LVT_CATEGORY)
        
        lvt_output_dir = Path('downloads/product_descriptions/lvt')
        lvt_output_dir.mkdir(parents=True, exist_ok=True)
        
        for i, collection_url in enumerate(lvt_collections, 1):
            print(f"\n[{i}/{len(lvt_collections)}]")
            results = process_collection(driver, collection_url, 'lvt')
            
            # Save results
            output_file = lvt_output_dir / f"{results['collection_slug']}_descriptions.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Sačuvano: {output_file.name}")
            print(f"   Kolekcija: {len(results.get('colors', []))} boja")
            
            # Wait between collections
            if i < len(lvt_collections):
                print("⏳ Čekam 3 sekunde...")
                time.sleep(3)
        
        # Process Linoleum collections
        print("\n" + "="*80)
        print("LINOLEUM KOLEKCIJE")
        print("="*80)
        
        linoleum_collections = get_all_collections_from_category(driver, LINOLEUM_CATEGORY)
        
        linoleum_output_dir = Path('downloads/product_descriptions/linoleum')
        linoleum_output_dir.mkdir(parents=True, exist_ok=True)
        
        for i, collection_url in enumerate(linoleum_collections, 1):
            print(f"\n[{i}/{len(linoleum_collections)}]")
            results = process_collection(driver, collection_url, 'linoleum')
            
            # Save results
            output_file = linoleum_output_dir / f"{results['collection_slug']}_descriptions.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Sačuvano: {output_file.name}")
            print(f"   Kolekcija: {len(results.get('colors', []))} boja")
            
            # Wait between collections
            if i < len(linoleum_collections):
                print("⏳ Čekam 3 sekunde...")
                time.sleep(3)
        
        print("\n" + "="*80)
        print("✅ EKSTRAKCIJA ZAVRŠENA!")
        print("="*80)
        
    finally:
        driver.quit()

if __name__ == '__main__':
    main()
