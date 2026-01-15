#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Automatski scrape LINOLEUM proizvoda sa Gerflor sajta
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import json
import sys
import re
import os
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

print("="*80)
print("AUTOMATSKI SCRAPING GERFLOR LINOLEUM PROIZVODA")
print("="*80)
print()

# Chrome setup
chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--start-maximized")
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)

print("Pokrećem Chrome...")
driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=chrome_options
)
wait = WebDriverWait(driver, 15)

# Base URL for linoleum category
base_url = "https://www.gerflor-cee.com/category/linoleum"

all_products = []

try:
    # Accept cookies on first page
    print("Otvaranje linoleum kategorije...")
    driver.get(f"{base_url}?page=1")
    time.sleep(3)
    
    try:
        accept_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Accept') or contains(text(), 'Prihvat')]")
        driver.execute_script("arguments[0].click();", accept_btn)
        print("✓ Cookies accepted\n")
        time.sleep(1)
    except:
        print("- No cookies dialog\n")
    
    # Step 1: Find total number of pages
    print("Tražim broj stranica...")
    page_count = 1
    try:
        # Find pagination - look for page numbers
        pagination_links = driver.find_elements(By.XPATH, "//a[contains(@href, 'page=')]")
        if pagination_links:
            page_numbers = []
            for link in pagination_links:
                href = link.get_attribute('href')
                if href:
                    match = re.search(r'page=(\d+)', href)
                    if match:
                        page_numbers.append(int(match.group(1)))
            if page_numbers:
                page_count = max(page_numbers)
        print(f"✓ Pronađeno stranica: {page_count}\n")
    except Exception as e:
        print(f"⚠️  Ne mogu da pronađem pagination, pretpostavljam 1 stranicu: {e}\n")
    
    # Step 2: Collect all product URLs from all pages
    product_urls = []
    
    for page in range(1, page_count + 1):
        print(f"\n{'='*80}")
        print(f"Stranica {page}/{page_count}")
        print(f"{'='*80}\n")
        
        driver.get(f"{base_url}?page={page}")
        time.sleep(2)
        
        # Find all product links on this page
        try:
            # Look for links to DLW products (linoleum brand)
            product_links = driver.find_elements(By.XPATH, "//a[contains(@href, '/products/dlw-') or contains(@href, '/products/')]")
            
            page_products = []
            for link in product_links:
                url = link.get_attribute('href')
                if url and url not in product_urls and '/products/' in url and url != base_url:
                    product_urls.append(url)
                    page_products.append(url)
            
            print(f"  ✓ Pronađeno {len(page_products)} proizvoda na ovoj stranici")
            for url in page_products:
                print(f"    • {url}")
        
        except Exception as e:
            print(f"✗ Greška pri sakupljanju linkova: {e}")
    
    print(f"\n{'='*80}")
    print(f"Ukupno pronađenih proizvoda: {len(product_urls)}")
    print(f"{'='*80}\n")
    
    # Step 3: Visit each product and extract details
    for prod_idx, product_url in enumerate(product_urls, 1):
        print(f"\n[{prod_idx}/{len(product_urls)}] {product_url}")
        
        try:
            driver.get(product_url)
            time.sleep(2)
            
            product_data = {
                'url': product_url,
                'collection': '',
                'code': '',
                'name': '',
                'characteristics': {},
                'images': [],
                'downloads': []
            }
            
            # Extract product name and code from H1
            try:
                heading = wait.until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
                full_text = heading.text.strip()
                
                # Try to extract code (usually 4 digits)
                match = re.search(r'(\d{4})\s+(.+)', full_text)
                if match:
                    product_data['code'] = match.group(1)
                    product_data['name'] = match.group(2).strip().upper()
                else:
                    # No code found, use full text as name
                    product_data['code'] = ""
                    product_data['name'] = full_text.upper()
                
                # Try to extract collection (usually before the code/name)
                try:
                    breadcrumb = driver.find_element(By.XPATH, "//nav[contains(@class, 'breadcrumb')]//a[last()-1]")
                    product_data['collection'] = breadcrumb.text.strip()
                except:
                    # Extract from URL or heading
                    if 'dlw-' in product_url:
                        parts = product_url.split('dlw-')[1].split('-')
                        product_data['collection'] = 'DLW ' + ' '.join(parts[:2]).title()
                
                print(f"  Kolekcija: {product_data['collection']}")
                print(f"  Naziv: {product_data['name']}")
                print(f"  Kod: {product_data['code'] if product_data['code'] else 'N/A'}")
            
            except Exception as e:
                print(f"  ✗ Greška pri čitanju naziva: {e}")
                product_data['name'] = "UNKNOWN"
            
            # Click on "Characteristics" to expand details
            try:
                # Try multiple ways to find and click characteristics
                characteristics_clicked = False
                
                # Method 1: Find button with "Characteristics" text
                try:
                    characteristics_btn = driver.find_element(By.XPATH, "//button[contains(., 'Characteristics') or contains(., 'characteristics')]")
                    driver.execute_script("arguments[0].scrollIntoView(true);", characteristics_btn)
                    time.sleep(0.5)
                    driver.execute_script("arguments[0].click();", characteristics_btn)
                    print("  ✓ Kliknuto na Characteristics (Method 1)")
                    characteristics_clicked = True
                    time.sleep(1)
                except:
                    pass
                
                # Method 2: Try accordion/collapsible section
                if not characteristics_clicked:
                    try:
                        accordion = driver.find_element(By.XPATH, "//div[contains(@class, 'accordion') or contains(@class, 'collapse')]//button")
                        driver.execute_script("arguments[0].click();", accordion)
                        print("  ✓ Kliknuto na Characteristics (Method 2)")
                        characteristics_clicked = True
                        time.sleep(1)
                    except:
                        pass
                
                if characteristics_clicked:
                    # Extract characteristics - try multiple selectors
                    try:
                        # Method A: Find dt/dd pairs
                        char_labels = driver.find_elements(By.XPATH, "//dt")
                        char_values = driver.find_elements(By.XPATH, "//dd")
                        
                        if char_labels and len(char_labels) == len(char_values):
                            for label, value in zip(char_labels, char_values):
                                label_text = label.text.strip()
                                value_text = value.text.strip()
                                if label_text and value_text:
                                    product_data['characteristics'][label_text] = value_text
                                    print(f"    • {label_text}: {value_text}")
                        
                        # Method B: Try table format
                        elif not product_data['characteristics']:
                            rows = driver.find_elements(By.XPATH, "//table//tr | //div[contains(@class, 'specification')]//div[contains(@class, 'row')]")
                            for row in rows:
                                cells = row.find_elements(By.TAG_NAME, "td") or row.find_elements(By.XPATH, ".//div")
                                if len(cells) >= 2:
                                    label = cells[0].text.strip()
                                    value = cells[1].text.strip()
                                    if label and value:
                                        product_data['characteristics'][label] = value
                                        print(f"    • {label}: {value}")
                    
                    except Exception as e:
                        print(f"  ⚠️  Ne mogu da izvučem karakteristike: {e}")
                else:
                    print("  ⚠️  Characteristics section nije pronađen")
            
            except Exception as e:
                print(f"  ⚠️  Greška sa Characteristics: {e}")
            
            # Extract images
            try:
                # Find main product image(s)
                img_elements = driver.find_elements(By.XPATH, "//img[contains(@class, 'product') or contains(@alt, 'product') or parent::div[contains(@class, 'image')]]")
                
                for img in img_elements[:5]:  # Limit to first 5 images
                    img_url = img.get_attribute('src')
                    if img_url and 'placeholder' not in img_url and img_url not in product_data['images']:
                        product_data['images'].append(img_url)
                        print(f"  🖼️  Slika: {img_url[:70]}...")
                
                if not product_data['images']:
                    # Fallback: get any large image
                    all_images = driver.find_elements(By.TAG_NAME, "img")
                    for img in all_images[:3]:
                        img_url = img.get_attribute('src')
                        if img_url and ('product' in img_url or 'dlw' in img_url.lower()):
                            product_data['images'].append(img_url)
                            print(f"  🖼️  Slika (fallback): {img_url[:70]}...")
            
            except Exception as e:
                print(f"  ⚠️  Ne mogu da izvučem slike: {e}")
            
            # Look for download links (data sheets, etc.)
            try:
                download_links = driver.find_elements(By.XPATH, "//a[contains(@href, '.pdf') or contains(text(), 'Download') or contains(text(), 'download')]")
                for link in download_links[:3]:
                    href = link.get_attribute('href')
                    text = link.text.strip()
                    if href and href not in product_data['downloads']:
                        product_data['downloads'].append({
                            'url': href,
                            'label': text or 'Download'
                        })
                        print(f"  📄 Download: {text or 'Document'}")
            except Exception as e:
                print(f"  ⚠️  Ne mogu da izvučem download linkove: {e}")
            
            all_products.append(product_data)
            print(f"  ✓ Proizvod dodat ({len(all_products)}/{len(product_urls)})")
        
        except Exception as e:
            print(f"  ✗ Greška pri obradi proizvoda: {e}")
            import traceback
            traceback.print_exc()
            continue

except KeyboardInterrupt:
    print("\n\n⏹️  Prekinuto korisničkim zahtevom")

except Exception as e:
    print(f"\n\n❌ Kritična greška: {e}")
    import traceback
    traceback.print_exc()

finally:
    # Save results
    output_path = "scripts/gerflor_linoleum_scrape.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            "total": len(all_products),
            "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source": base_url,
            "products": all_products
        }, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*80)
    print("GOTOVO!")
    print("="*80)
    print(f"Ukupno proizvoda: {len(all_products)}")
    print(f"Proizvodi sa karakteristikama: {sum(1 for p in all_products if p.get('characteristics'))}")
    print(f"Proizvodi sa slikama: {sum(1 for p in all_products if p.get('images'))}")
    print(f"Sačuvano u: {output_path}")
    
    driver.quit()
    print("\n✓ Chrome zatvoren")
