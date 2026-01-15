#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KOMPLETAN scraping Gerflor LINOLEUM proizvoda
- 15 kolekcija sa karakteristikama
- 203 boje sa ZIP fajlovima
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
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

print("="*80)
print("KOMPLETAN SCRAPING GERFLOR LINOLEUM - 15 KOLEKCIJA + 203 BOJA")
print("="*80)
print()

# Setup download folder
download_folder = Path("downloads/linoleum_complete")
download_folder.mkdir(parents=True, exist_ok=True)

# Chrome setup
chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--start-maximized")
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)

prefs = {
    "download.default_directory": str(download_folder.absolute()),
    "download.prompt_for_download": False,
}
chrome_options.add_experimental_option("prefs", prefs)

print("Pokrećem Chrome...")
driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=chrome_options
)
wait = WebDriverWait(driver, 15)

base_url = "https://www.gerflor-cee.com/category/linoleum"

collections_data = []
colors_data = []

try:
    # Accept cookies
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
    
    # Step 1: Collect ALL product URLs (both collections and individual colors)
    print("="*80)
    print("KORAK 1: Sakupljanje svih URL-ova")
    print("="*80)
    
    all_urls = []
    driver.get(f"{base_url}?page=1")
    time.sleep(2)
    
    product_links = driver.find_elements(By.XPATH, "//a[contains(@href, '/products/dlw-')]")
    for link in product_links:
        url = link.get_attribute('href')
        if url and url not in all_urls:
            all_urls.append(url)
    
    print(f"✓ Pronađeno {len(all_urls)} URL-ova\n")
    
    # Step 2: Identify which are collections (no code in URL) vs colors (have 4-digit code)
    print("="*80)
    print("KORAK 2: Razlikovanje Kolekcija od Pojedinačnih Boja")
    print("="*80)
    
    collection_urls = []
    color_urls = []
    
    for url in all_urls:
        slug = url.split('/')[-1]
        print(f"Proveravam: {slug}...", end=' ')
        
        # If URL contains 4-digit code (like -0001- or -r8940001), it's a color
        if re.search(r'-\d{4}-', slug) or re.search(r'r\d{7}', slug):
            color_urls.append(url)
            print("→ boja")
        else:
            collection_urls.append(url)
            print("✓ KOLEKCIJA")
    
    print(f"\n✓ Pronađeno:")
    print(f"  • Kolekcije: {len(collection_urls)}")
    print(f"  • Pojedinačne boje: {len(color_urls)}\n")
    
    # Step 3: Process each COLLECTION
    print("="*80)
    print("KORAK 3: Obrada Kolekcija")
    print("="*80)
    
    for coll_idx, collection_url in enumerate(collection_urls, 1):
        print(f"\n[{coll_idx}/{len(collection_urls)}] {collection_url}")
        
        try:
            driver.get(collection_url)
            time.sleep(2)
            
            collection_info = {
                'url': collection_url,
                'name': '',
                'characteristics': {},
                'downloads': [],
                'collection_images': [],
                'colors': []
            }
            
            # Get collection name
            try:
                heading = driver.find_element(By.TAG_NAME, "h1")
                collection_info['name'] = heading.text.strip()
                print(f"  Naziv: {collection_info['name']}")
            except:
                collection_info['name'] = collection_url.split('/')[-1]
            
            # Scroll down to find Characteristics section
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
            time.sleep(1)
            
            # Click on Characteristics
            try:
                characteristics_btn = driver.find_element(By.XPATH, "//button[contains(., 'Characteristics') or contains(., 'characteristics')]")
                driver.execute_script("arguments[0].scrollIntoView(true);", characteristics_btn)
                time.sleep(0.5)
                driver.execute_script("arguments[0].click();", characteristics_btn)
                print("  ✓ Kliknuto na Characteristics")
                time.sleep(1)
                
                # Extract characteristics using dt/dd pairs
                try:
                    char_items = driver.find_elements(By.XPATH, "//dt | //dd")
                    
                    i = 0
                    while i < len(char_items) - 1:
                        if char_items[i].tag_name == 'dt' and char_items[i+1].tag_name == 'dd':
                            label = char_items[i].text.strip()
                            value = char_items[i+1].text.strip()
                            if label and value:
                                collection_info['characteristics'][label] = value
                                print(f"    • {label}: {value}")
                            i += 2
                        else:
                            i += 1
                    
                    if not collection_info['characteristics']:
                        print("  ⚠️  Nema karakteristika u dt/dd formatu")
                
                except Exception as e:
                    print(f"  ⚠️  Greška pri čitanju karakteristika: {e}")
            
            except Exception as e:
                print(f"  ⚠️  Ne mogu da pronađem Characteristics: {e}")
            
            # Find and download collection images
            try:
                # Find download icon/button (in top-right corner of main image)
                download_icon = driver.find_element(By.XPATH, "//button[contains(@aria-label, 'download') or .//svg] | //a[contains(@class, 'download')]")
                
                driver.execute_script("arguments[0].scrollIntoView(true);", download_icon)
                time.sleep(0.3)
                
                # Click download icon
                driver.execute_script("arguments[0].click();", download_icon)
                time.sleep(0.5)
                
                # Click on ".jpg" option (for main collection image)
                try:
                    jpg_option = driver.find_element(By.XPATH, "//button[contains(text(), '.jpg') or contains(text(), 'JPG')] | //a[contains(text(), '.jpg') or contains(text(), 'JPG')]")
                    driver.execute_script("arguments[0].click();", jpg_option)
                    print(f"  📦 Preuzeta slika kolekcije")
                    time.sleep(1)
                except:
                    print(f"  ⚠️  Ne mogu da preuzmem .jpg")
            
            except:
                print("  ⚠️  Nema download ikonice za kolekciju")
            
            # Click "View all" to see all colors
            try:
                view_all_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'View all')]")
                driver.execute_script("arguments[0].click();", view_all_btn)
                print("  ✓ Otvoren 'View all' dialog")
                time.sleep(2)
                
                # Find all color links in dialog
                color_links = driver.find_elements(By.XPATH, "//a[contains(@href, '/products/dlw-')]")
                
                for link in color_links:
                    color_url = link.get_attribute('href')
                    if color_url and color_url != collection_url:
                        if color_url not in collection_info['colors']:
                            collection_info['colors'].append(color_url)
                
                print(f"  ✓ Pronađeno {len(collection_info['colors'])} boja u kolekciji")
            
            except Exception as e:
                print(f"  ⚠️  Ne mogu da otvorim View all: {e}")
            
            collections_data.append(collection_info)
            print(f"  ✓ Kolekcija sačuvana\n")
        
        except Exception as e:
            print(f"  ✗ Greška: {e}")
            import traceback
            traceback.print_exc()
    
    # Step 4: Process each COLOR
    print("\n" + "="*80)
    print("KORAK 4: Obrada Pojedinačnih Boja")
    print("="*80)
    
    # Collect all unique color URLs from collections + standalone colors
    all_color_urls = set(color_urls)
    for coll in collections_data:
        all_color_urls.update(coll['colors'])
    
    all_color_urls = list(all_color_urls)
    print(f"Ukupno boja za obradu: {len(all_color_urls)}\n")
    
    for color_idx, color_url in enumerate(all_color_urls, 1):
        print(f"[{color_idx}/{len(all_color_urls)}] {color_url.split('/')[-1][:50]}...", end=' ')
        
        try:
            driver.get(color_url)
            time.sleep(1.5)
            
            color_info = {
                'url': color_url,
                'collection': '',
                'code': '',
                'name': '',
                'dimension': '',
                'welding_rod': '',
                'color_image': '',
                'color_zip': ''
            }
            
            # Extract from H1
            try:
                heading = driver.find_element(By.TAG_NAME, "h1")
                full_text = heading.text.strip()
                
                # Format: "0001 BANANA YELLOW"
                match = re.search(r'(\d{4})\s+(.+)', full_text)
                if match:
                    color_info['code'] = match.group(1)
                    color_info['name'] = match.group(2).strip().upper()
                else:
                    color_info['name'] = full_text.upper()
            except:
                pass
            
            # Get collection from breadcrumb
            try:
                breadcrumb_link = driver.find_element(By.XPATH, "//nav[contains(@class, 'breadcrumb') or contains(@aria-label, 'Breadcrumb')]//a[contains(@href, '/products/dlw-')][1]")
                color_info['collection'] = breadcrumb_link.text.strip()
            except:
                # Extract from URL
                if 'dlw-' in color_url:
                    parts = color_url.split('dlw-')[1].split('-')
                    color_info['collection'] = 'DLW ' + ' '.join(parts[:2]).title()
            
            # Get dimension and welding rod from Product description
            try:
                dimension_elem = driver.find_element(By.XPATH, "//span[contains(text(), 'DIMENSION') or contains(text(), 'Dimension')]/following-sibling::span")
                color_info['dimension'] = dimension_elem.text.strip()
            except:
                pass
            
            try:
                welding_elem = driver.find_element(By.XPATH, "//span[contains(text(), 'WELDING ROD') or contains(text(), 'Welding rod')]/following-sibling::span")
                color_info['welding_rod'] = welding_elem.text.strip()
            except:
                pass
            
            # Find main image
            try:
                main_img = driver.find_element(By.XPATH, "//img[contains(@alt, 'product') or parent::div[contains(@class, 'image')]]")
                color_info['color_image'] = main_img.get_attribute('src')
            except:
                pass
            
            # Download image using the download icon in top-right corner
            try:
                # Step 1: Find download icon/button (usually in top-right corner of image)
                download_icon = driver.find_element(By.XPATH, "//button[contains(@aria-label, 'download') or .//svg[contains(@class, 'download')]] | //a[contains(@class, 'download')]")
                
                driver.execute_script("arguments[0].scrollIntoView(true);", download_icon)
                time.sleep(0.3)
                
                # Step 2: Click download icon
                driver.execute_script("arguments[0].click();", download_icon)
                time.sleep(0.5)
                
                # Step 3: Click on ".jpg" option in dropdown/menu
                try:
                    jpg_option = driver.find_element(By.XPATH, "//button[contains(text(), '.jpg') or contains(text(), 'JPG')] | //a[contains(text(), '.jpg') or contains(text(), 'JPG')]")
                    driver.execute_script("arguments[0].click();", jpg_option)
                    
                    color_info['color_zip'] = "downloaded"
                    print(f"📦 {color_info['code']} {color_info['name'][:20]}")
                    time.sleep(1)  # Wait for download to start
                except Exception as e:
                    print(f"⚠️ {color_info['code']} - Ne mogu da kliknem .jpg: {e}")
            
            except Exception as e:
                print(f"→ {color_info['code']} {color_info['name'][:20]} (bez preuzimanja)")
            
            colors_data.append(color_info)
        
        except Exception as e:
            print(f"✗ Greška: {e}")

except KeyboardInterrupt:
    print("\n\n⏹️  Prekinuto korisničkim zahtevom")

except Exception as e:
    print(f"\n\n❌ Kritična greška: {e}")
    import traceback
    traceback.print_exc()

finally:
    # Save results
    output_path = "scripts/gerflor_linoleum_complete.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source": base_url,
            "summary": {
                "total_collections": len(collections_data),
                "total_colors": len(colors_data),
                "collections_with_characteristics": sum(1 for c in collections_data if c.get('characteristics'))
            },
            "collections": collections_data,
            "colors": colors_data
        }, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*80)
    print("GOTOVO!")
    print("="*80)
    print(f"Kolekcija: {len(collections_data)}")
    print(f"Boja: {len(colors_data)}")
    print(f"Kolekcije sa karakteristikama: {sum(1 for c in collections_data if c.get('characteristics'))}")
    print(f"Download folder: {download_folder}")
    print(f"JSON sačuvan u: {output_path}")
    
    driver.quit()
    print("\n✓ Chrome zatvoren")
