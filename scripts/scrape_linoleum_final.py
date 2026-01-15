#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FINALNA skripta - Kompletan scraping Gerflor LINOLEUM
- 15 kolekcija sa karakteristikama + slike
- 203 boje sa slikama + podaci
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import time
import json
import re
from pathlib import Path

print("="*80)
print("FINALNA SKRIPTA - GERFLOR LINOLEUM - 15 KOLEKCIJA + 203 BOJA")
print("="*80)
print()

# Setup download folder
download_folder = Path("downloads/linoleum_final")
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
actions = ActionChains(driver)

base_url = "https://www.gerflor-cee.com/category/linoleum"

collections_data = []
colors_data = []

def download_image_jpg(driver, actions, product_name):
    """Hover + Download options + .JPG klik"""
    try:
        # 1. Pronađi glavnu sliku
        main_image = driver.find_element(By.XPATH, "//img[contains(@src, 'gerflor') and not(contains(@src, 'logo'))]")
        
        # 2. Hover preko slike
        actions.move_to_element(main_image).perform()
        time.sleep(1)
        
        # 3. Klikni "Download options" dugme
        download_btn = driver.find_element(By.XPATH, "//button[contains(@class, 'download-button--trigger')]")
        driver.execute_script("arguments[0].click();", download_btn)
        time.sleep(1)
        
        # 4. Klikni ".JPG" opciju
        jpg_btn = driver.find_element(By.XPATH, "//button[contains(text(), '.jpg') or contains(text(), 'JPG') or contains(@class, 'download-button--images')]")
        driver.execute_script("arguments[0].click();", jpg_btn)
        time.sleep(2)
        
        print(f"    📦 Preuzeta slika")
        return True
    except Exception as e:
        print(f"    ⚠️  Greška pri preuzimanju: {e}")
        return False

def extract_specs_from_popup(driver):
    """Klikni 'See full description' i izvuci sve specs"""
    specs = {}
    
    try:
        # 1. Klikni na "See full description"
        see_full_desc = driver.find_element(By.XPATH, "//a[contains(text(), 'See full description')] | //button[contains(text(), 'See full description')]")
        driver.execute_script("arguments[0].scrollIntoView(true);", see_full_desc)
        time.sleep(0.5)
        driver.execute_script("arguments[0].click();", see_full_desc)
        time.sleep(2)
        
        # 2. Izvuci specs po keywords
        keywords = ["FORMAT", "OVERALL THICKNESS", "DIMENSION", "WELDING ROD"]
        
        for keyword in keywords:
            try:
                elements = driver.find_elements(By.XPATH, f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{keyword.lower()}')]")
                
                for elem in elements:
                    if elem.is_displayed() and elem.get_attribute('class') == 'category-label':
                        parent = elem.find_element(By.XPATH, "..")
                        parent_lines = parent.text.strip().split("\n")
                        if len(parent_lines) >= 2:
                            label = parent_lines[0].strip()
                            value = parent_lines[1].strip()
                            specs[label] = value
                        break
            except:
                pass
        
        # 3. Izvuci intro opis
        try:
            intro_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'natural ingredients') or contains(text(), 'flooring solution') or contains(text(), 'performance flooring')]")
            for elem in intro_elements:
                if elem.is_displayed() and elem.tag_name in ['p', 'div', 'strong']:
                    intro_text = elem.text.strip()
                    if len(intro_text) > 20 and len(intro_text) < 500:
                        specs['intro_description'] = intro_text
                        break
        except:
            pass
        
        # 4. Izvuci bullets po sekcijama
        sections = ["Product & Design", "Installation & Maintenance", "Market Application", "Sustainability"]
        
        for section_name in sections:
            try:
                section_heading = driver.find_elements(By.XPATH, f"//*[contains(text(), '{section_name}')]")
                
                for heading in section_heading:
                    if heading.is_displayed() and heading.tag_name in ['h2', 'h3', 'strong']:
                        parent = heading.find_element(By.XPATH, "../..")
                        bullets = parent.find_elements(By.XPATH, ".//li")
                        
                        section_bullets = []
                        for bullet in bullets:
                            text = bullet.text.strip()
                            if text and text not in ["Products", "Segments", "Gerflor group", "Sustainability", "Contact", "Design by Gerflor", "EcoVadis Gold"]:
                                if len(text) < 200:  # Razumna dužina
                                    section_bullets.append(text)
                        
                        if section_bullets:
                            specs[section_name] = section_bullets[:10]  # Max 10 bullets
                        break
            except:
                pass
        
        # 5. Zatvori popup
        try:
            # Pošalji ESC da zatvoriš popup
            driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
            time.sleep(0.5)
        except:
            pass
        
        return specs
    
    except Exception as e:
        print(f"    ⚠️  Greška pri izvlačenju specs: {e}")
        return specs

def extract_characteristics_from_page(driver):
    """Izvuci karakteristike iz accordion sekcije 'Characteristics'"""
    characteristics = {}

    labels = [
        "Surface treatment",
        "Overall thickness",
        "Thickness of the wearlayer",
        "Installation system covering",
        "Format details",
        "Width of sheet",
        "Length of sheet",
        "NCS",
        "LRV",
        "Slip Resistance",
        "Fire rating",
    ]

    # Try to expand the Characteristics accordion
    try:
        buttons = driver.find_elements(By.XPATH, "//*[self::button or self::summary][contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'characteristics')]")
        for btn in buttons:
            if btn.is_displayed():
                try:
                    if btn.get_attribute('aria-expanded') == 'false':
                        driver.execute_script("arguments[0].click();", btn)
                        time.sleep(1)
                except Exception:
                    driver.execute_script("arguments[0].click();", btn)
                    time.sleep(1)
                break
    except Exception:
        pass

    for label in labels:
        try:
            candidates = driver.find_elements(By.XPATH, f"//*[normalize-space()='{label}']")
            if not candidates:
                candidates = driver.find_elements(By.XPATH, f"//*[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{label.lower()}')]")
            for elem in candidates:
                if not elem.is_displayed():
                    continue
                value = ''
                text = elem.text.strip()
                if '\n' in text:
                    parts = [p.strip() for p in text.split('\n') if p.strip()]
                    if len(parts) >= 2:
                        value = parts[-1]
                if not value:
                    try:
                        value = elem.find_element(By.XPATH, "./following-sibling::*[1]").text.strip()
                    except Exception:
                        value = ''
                if not value:
                    try:
                        value = elem.find_element(By.XPATH, "../*[last()]").text.strip()
                    except Exception:
                        value = ''
                if value and value != label:
                    characteristics[label] = value
                    break
        except Exception:
            pass

    return characteristics

try:
    # Accept cookies
    print("Otvaranje linoleum kategorije...")
    driver.get(f"{base_url}?page=1")
    time.sleep(3)
    
    try:
        accept_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Accept')]")
        driver.execute_script("arguments[0].click();", accept_btn)
        print("✓ Cookies accepted\n")
        time.sleep(1)
    except:
        print("- No cookies\n")
    
    # KORAK 1: Sakupi sve URL-ove
    print("="*80)
    print("KORAK 1: Sakupljanje URL-ova")
    print("="*80)
    
    all_urls = []
    product_links = driver.find_elements(By.XPATH, "//a[contains(@href, '/products/dlw-')]")
    for link in product_links:
        url = link.get_attribute('href')
        if url and url not in all_urls:
            all_urls.append(url)
    
    print(f"✓ Pronađeno {len(all_urls)} URL-ova\n")
    
    # KORAK 2: Razdvoj kolekcije od boja (po URL strukturi)
    print("="*80)
    print("KORAK 2: Razdvajanje Kolekcija od Boja")
    print("="*80)
    
    collection_urls = []
    color_urls = []
    
    for url in all_urls:
        slug = url.split('/')[-1]
        # Ako URL sadrži 4-cifreni kod (npr. -0001- ili r8940001), to je boja
        if re.search(r'-\d{4}-', slug) or re.search(r'r\d{7}', slug):
            color_urls.append(url)
        else:
            collection_urls.append(url)
    
    print(f"✓ Kolekcije: {len(collection_urls)}")
    print(f"✓ Boje: {len(color_urls)}\n")
    
    # KORAK 3: Obradi kolekcije
    print("="*80)
    print("KORAK 3: Obrada Kolekcija")
    print("="*80)
    
    for coll_idx, collection_url in enumerate(collection_urls, 1):
        print(f"\n[{coll_idx}/{len(collection_urls)}] {collection_url.split('/')[-1]}")
        
        try:
            driver.get(collection_url)
            time.sleep(2)
            
            collection_info = {
                'url': collection_url,
                'slug': collection_url.split('/')[-1],
                'name': '',
                'specs': {},
                'colors': []
            }
            
            # Ime kolekcije
            try:
                heading = driver.find_element(By.TAG_NAME, "h1")
                collection_info['name'] = heading.text.strip()
                print(f"  Naziv: {collection_info['name']}")
            except:
                collection_info['name'] = collection_url.split('/')[-1]
            
            # Preuzmi sliku kolekcije
            print(f"  Preuzimanje slike kolekcije...")
            download_image_jpg(driver, actions, collection_info['name'])
            
            # Izvuci specs iz popup-a
            print(f"  Izvlačim specifikacije...")
            collection_info['specs'] = extract_specs_from_popup(driver)
            print(f"    ✓ Izvučeno {len(collection_info['specs'])} polja")
            
            # Klikni "View all" da vidiš sve boje
            print(f"  Sakupljam boje...")
            try:
                view_all_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'View all')]")
                driver.execute_script("arguments[0].click();", view_all_btn)
                time.sleep(2)
                
                # Sakupi linkove boja
                color_links = driver.find_elements(By.XPATH, "//a[contains(@href, '/products/dlw-')]")
                for link in color_links:
                    color_url = link.get_attribute('href')
                    if color_url and color_url != collection_url and color_url not in collection_info['colors']:
                        collection_info['colors'].append(color_url)
                
                print(f"    ✓ Pronađeno {len(collection_info['colors'])} boja")
                
                # Zatvori dialog
                driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
                time.sleep(0.5)
            except Exception as e:
                print(f"    ⚠️  Ne mogu da sakupim boje: {e}")
            
            collections_data.append(collection_info)
        
        except Exception as e:
            print(f"  ✗ Greška: {e}")
    
    # KORAK 4: Obradi boje
    print("\n" + "="*80)
    print("KORAK 4: Obrada Boja")
    print("="*80)
    
    # Sakupi sve boje (i standalone i iz kolekcija)
    all_color_urls = set(color_urls)
    for coll in collections_data:
        all_color_urls.update(coll['colors'])
    
    all_color_urls = list(all_color_urls)
    print(f"Ukupno boja: {len(all_color_urls)}\n")
    
    for color_idx, color_url in enumerate(all_color_urls, 1):
        slug = color_url.split('/')[-1]
        print(f"[{color_idx}/{len(all_color_urls)}] {slug[:40]}...", end=' ')
        
        try:
            driver.get(color_url)
            time.sleep(1.5)
            
            color_info = {
                'url': color_url,
                'slug': slug,
                'collection': '',
                'code': '',
                'name': '',
                'specs': {},
                'characteristics': {}
            }
            
            # Ime i kod iz H1
            try:
                heading = driver.find_element(By.TAG_NAME, "h1")
                full_text = heading.text.strip()
                
                # Format: "0001 BANANA YELLOW"
                match = re.search(r'(\d{4})\s+(.+)', full_text)
                if match:
                    color_info['code'] = match.group(1)
                    color_info['name'] = match.group(2).strip()
                else:
                    color_info['name'] = full_text
            except:
                pass
            
            # Kolekcija iz breadcrumb
            try:
                breadcrumb_link = driver.find_element(By.XPATH, "//nav//a[contains(@href, '/products/dlw-')][last()]")
                color_info['collection'] = breadcrumb_link.text.strip()
            except:
                pass
            
            # Preuzmi sliku boje
            download_image_jpg(driver, actions, color_info['name'])
            
            # Izvuci specs
            color_info['specs'] = extract_specs_from_popup(driver)

            # Izvuci karakteristike iz accordion
            color_info['characteristics'] = extract_characteristics_from_page(driver)
            
            colors_data.append(color_info)
            print(f"✓ {color_info['code']} {color_info['name'][:20]}")
        
        except Exception as e:
            print(f"✗ {e}")

except KeyboardInterrupt:
    print("\n\n⏹️  Prekinuto")

except Exception as e:
    print(f"\n\n❌ Greška: {e}")
    import traceback
    traceback.print_exc()

finally:
    # Save JSON
    output_path = "scripts/gerflor_linoleum_final.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source": base_url,
            "summary": {
                "total_collections": len(collections_data),
                "total_colors": len(colors_data),
                "download_folder": str(download_folder)
            },
            "collections": collections_data,
            "colors": colors_data
        }, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*80)
    print("GOTOVO!")
    print("="*80)
    print(f"Kolekcija: {len(collections_data)}")
    print(f"Boja: {len(colors_data)}")
    print(f"Slike u: {download_folder}")
    print(f"JSON: {output_path}")
    
    driver.quit()
    print("\n✓ Browser zatvoren")
