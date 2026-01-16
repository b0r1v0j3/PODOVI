#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ekstraktuje samo podatke o bojama iz jedne kolekcije
Za svaku boju: description + characteristics (klikne na padajući meni)
Obrađuje jednu kolekciju, zatim se gasi i prikazuje rezultate
"""

import sys
import json
import time
import re
import argparse
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

def accept_cookies(driver):
    """Accept cookies if present - with screenshot and coordinate click"""
    try:
        # Wait for cookie popup to appear
        time.sleep(3)
        
        # Take screenshot for debugging
        try:
            screenshot_path = Path('downloads/cookie_popup_debug.png')
            driver.save_screenshot(str(screenshot_path))
            print(f"      📸 Screenshot sačuvan: {screenshot_path}")
        except:
            pass
        
        # Strategy 1: Find all buttons and check text (most reliable)
        try:
            # Wait for any buttons to be present
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.TAG_NAME, "button"))
            )
            
            all_buttons = driver.find_elements(By.TAG_NAME, "button")
            print(f"      🔍 Pronađeno {len(all_buttons)} dugmadi, tražim 'Accept All'...")
            
            # Print all button texts for debugging
            for i, btn in enumerate(all_buttons[:10]):  # First 10 buttons
                try:
                    if btn.is_displayed():
                        btn_text = btn.text.strip()
                        if btn_text:
                            print(f"        Button {i+1}: '{btn_text}'")
                except:
                    pass
            
            for btn in all_buttons:
                try:
                    if not btn.is_displayed():
                        continue
                    
                    btn_text = btn.text.strip()
                    btn_text_lower = btn_text.lower()
                    
                    # Check if it's Accept All button
                    if 'accept all' in btn_text_lower or btn_text_lower == 'accept all':
                        print(f"      ✓ Pronađeno 'Accept All' dugme: '{btn_text}'")
                        
                        # Get button location and size
                        location = btn.location
                        size = btn.size
                        center_x = location['x'] + size['width'] // 2
                        center_y = location['y'] + size['height'] // 2
                        print(f"      📍 Pozicija dugmeta: x={center_x}, y={center_y}")
                        
                        # Try multiple click methods
                        try:
                            # Method 1: Click on coordinates (most reliable for popups)
                            driver.execute_script(f"document.elementFromPoint({center_x}, {center_y}).click();")
                            time.sleep(2)
                            print("      ✓ Cookies prihvaćeni (Coordinate click)")
                            return
                        except Exception as e:
                            print(f"        ⚠️  Coordinate click failed: {e}")
                        
                        try:
                            # Method 2: Scroll to center and JavaScript click
                            driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});", btn)
                            time.sleep(0.5)
                            driver.execute_script("arguments[0].click();", btn)
                            time.sleep(2)
                            print("      ✓ Cookies prihvaćeni (JavaScript click)")
                            return
                        except Exception as e:
                            print(f"        ⚠️  JavaScript click failed: {e}")
                        
                        try:
                            # Method 3: ActionChains click
                            ActionChains(driver).move_to_element(btn).click().perform()
                            time.sleep(2)
                            print("      ✓ Cookies prihvaćeni (ActionChains click)")
                            return
                        except Exception as e:
                            print(f"        ⚠️  ActionChains click failed: {e}")
                        
                        try:
                            # Method 4: Direct click
                            btn.click()
                            time.sleep(2)
                            print("      ✓ Cookies prihvaćeni (Direct click)")
                            return
                        except Exception as e:
                            print(f"        ⚠️  Direct click failed: {e}")
                except Exception as e:
                    continue
        except Exception as e:
            print(f"      ⚠️  Strategy 1 failed: {e}")
        
        # Strategy 2: Try clicking on center of screen (where popup usually is)
        try:
            window_size = driver.get_window_size()
            center_x = window_size['width'] // 2
            center_y = window_size['height'] // 2
            print(f"      🎯 Pokušavam klik na centar ekrana: x={center_x}, y={center_y}")
            # Try clicking slightly to the right (where Accept All button usually is)
            driver.execute_script(f"document.elementFromPoint({center_x + 100}, {center_y + 50}).click();")
            time.sleep(2)
            print("      ✓ Pokušao klik na centar ekrana")
        except Exception as e:
            print(f"      ⚠️  Center click failed: {e}")
        
        # Strategy 3: Find by XPath with various patterns
        try:
            xpath_patterns = [
                "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'accept all')]",
                "//button[normalize-space(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'))='accept all']",
                "//button[text()='Accept All']",
                "//button[.='Accept All']",
            ]
            
            for xpath in xpath_patterns:
                try:
                    accept_all_btn = WebDriverWait(driver, 3).until(
                        EC.element_to_be_clickable((By.XPATH, xpath))
                    )
                    if accept_all_btn.is_displayed():
                        location = accept_all_btn.location
                        size = accept_all_btn.size
                        center_x = location['x'] + size['width'] // 2
                        center_y = location['y'] + size['height'] // 2
                        driver.execute_script(f"document.elementFromPoint({center_x}, {center_y}).click();")
                        time.sleep(2)
                        print("      ✓ Cookies prihvaćeni (XPath + Coordinate)")
                        return
                except:
                    continue
        except Exception as e:
            print(f"      ⚠️  Strategy 3 failed: {e}")
        
        print("      ⚠️  Nije pronađeno Accept All dugme")
    except Exception as e:
        print(f"      ⚠️  Greška pri prihvatanju cookies: {e}")

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
    """Extract characteristics by clicking on 'Characteristics' dropdown - improved scrolling"""
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

def process_collection(collection_url, collection_type):
    """Process a single collection - extract only color data"""
    collection_slug = collection_url.split('/')[-1]
    print(f"\n{'='*80}")
    print(f"OBRADA KOLEKCIJE: {collection_slug.upper()}")
    print(f"{'='*80}")
    print(f"URL: {collection_url}\n")
    
    driver = setup_driver()
    
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
                accept_cookies(driver)
                
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
        
    finally:
        driver.quit()

def main():
    parser = argparse.ArgumentParser(description='Ekstraktuje podatke o bojama iz jedne kolekcije')
    parser.add_argument('collection_url', help='URL kolekcije (npr. https://www.gerflor-cee.com/products/creation-55-looselay-acoustic)')
    parser.add_argument('--type', choices=['lvt', 'linoleum'], default='lvt', help='Tip kolekcije')
    
    args = parser.parse_args()
    
    results = process_collection(args.collection_url, args.type)
    
    if results:
        # Save results
        output_dir = Path(f'downloads/product_descriptions/{args.type}')
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_file = output_dir / f"{results['collection_slug']}_colors.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\n{'='*80}")
        print(f"✅ GOTOVO!")
        print(f"{'='*80}")
        print(f"\n💾 Sačuvano: {output_file}")
        print(f"   Kolekcija: {results['collection_slug']}")
        print(f"   Boja: {len(results['colors'])}")
        print(f"\n📊 Rezime:")
        colors_with_specs = sum(1 for c in results['colors'] if c.get('specs'))
        print(f"   - Boja sa specs: {colors_with_specs}/{len(results['colors'])}")
        print(f"   - Boja sa description: {sum(1 for c in results['colors'] if c.get('description', {}).get('full_text'))}/{len(results['colors'])}")

if __name__ == '__main__':
    main()
