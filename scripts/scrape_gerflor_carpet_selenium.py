#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skripta za scrapovanje Armonia tepih ploča sa Gerflor sajta koristeći Selenium
za zaobilaznje bot zaštite i simulaciju klikova.
"""

import os
import json
import time
import requests
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Konfiguracija
base_url = "https://www.gerflor-cee.com"
collections = [
    {"name": "Armonia 400", "url": "https://www.gerflor-cee.com/products/armonia-400", "slug": "gerflor-armonia-400"},
    {"name": "Armonia 540", "url": "https://www.gerflor-cee.com/products/armonia-540", "slug": "gerflor-armonia-540"},
    {"name": "Armonia 620", "url": "https://www.gerflor-cee.com/products/armonia-620", "slug": "gerflor-armonia-620"}
]

# Direktorijumi za čuvanje
data_dir = Path("public/data")
images_dir = Path("public/images/products/carpet")
docs_dir = Path("public/documents/carpet")

data_dir.mkdir(parents=True, exist_ok=True)
images_dir.mkdir(parents=True, exist_ok=True)
docs_dir.mkdir(parents=True, exist_ok=True)

# Inicijalizacija drivera
options = Options()
# options.add_argument("--headless") # Pokreni bez GUI-ja (zakomentarisano da vidiš šta radi ako želiš)
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("--window-size=1920,1080")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

all_carpet_data = {
    "total": 0,
    "collections": 3,
    "colors": []
}

def download_file(url, folder, filename):
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            file_path = folder / filename
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return str(file_path).replace("\\", "/")
    except Exception as e:
        print(f"❌ Greška pri preuzimanju {url}: {e}")
    return None

def scrape_collection(collection):
    print(f"\n📦 Obrađujem kolekciju: {collection['name']}")
    driver.get(collection['url'])
    time.sleep(5) # Čekamo da se učita i prođe bot check

    # 1. Nađi sve boje (swatches)
    try:
        # Prilagodi selektor prema stvarnom sajtu - tražimo elemente koji liče na swatch-eve
        # Na osnovu screenshot-a, to su verovatno div-ovi unutar nekog grid-a
        # Često imaju klasu 'swatch' ili 'color-item' ili slično.
        # Ovde koristim generički pristup traženja linkova ili divova sa slikama u delu za boje
        
        # Pokušaj da nađeš kontejner za boje
        colors_container = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".product-ranges .range-item, .swatches-container .swatch, .color-list .color-item")) 
        )
        # Ovo je placeholder selektor, moraćemo možda da prilagodimo ako pukne
        # Ali hajde da probamo da nađemo sve linkove ka bojama unutar sekcije "X colors"
        
        # Alternativno: nađi linkove koji vode ka /products/armonia-XXX-...
        links = driver.find_elements(By.CSS_SELECTOR, f"a[href*='/products/{collection['slug'].replace('gerflor-', '')}-']")
        
        print(f"   Pronađeno {len(links)} potencijalnih boja.")
        
        color_urls = [link.get_attribute('href') for link in links]
        # Ukloni duplikate
        color_urls = list(set(color_urls))
        
        print(f"   Jedinstvenih URL-ova boja: {len(color_urls)}")

        for color_url in color_urls:
            print(f"   🎨 Obrađujem boju: {color_url}")
            driver.get(color_url)
            time.sleep(3)
            
            # Ekstrakcija podataka
            try:
                # Ime i Kod
                title_elem = driver.find_element(By.CSS_SELECTOR, "h1")
                full_title = title_elem.text.strip() # Npr. "9503 ANTRACITE"
                
                # Pretpostavka formata "KOD IME"
                parts = full_title.split(' ', 1)
                code = parts[0]
                name = parts[1] if len(parts) > 1 else full_title
                
                print(f"      Kod: {code}, Ime: {name}")
                
                # Opis
                desc_elem = driver.find_element(By.CSS_SELECTOR, ".product-description, .description")
                description = desc_elem.text.strip()
                
                # Karakteristike (Specs)
                specs = {}
                try:
                    # Tražimo tabelu karakteristika ili listu
                    spec_rows = driver.find_elements(By.CSS_SELECTOR, ".characteristics-table tr, .specs-list li")
                    for row in spec_rows:
                        text = row.text
                        if ':' in text:
                            key, val = text.split(':', 1)
                            specs[key.strip()] = val.strip()
                        elif '\n' in text: # Ako je u tabeli pa je key\nvalue
                             parts = text.split('\n', 1)
                             if len(parts) == 2:
                                 specs[parts[0].strip()] = parts[1].strip()
                except:
                    print("      ⚠️ Nema specifikacija ili greška pri čitanju.")

                # SLIKA
                # Klik na dugme za preuzimanje (ikonica u gornjem desnom uglu slike)
                image_url = ""
                try:
                    # Tražimo ikonicu za download na slici
                    download_icon = driver.find_element(By.CSS_SELECTOR, ".product-visual .download-btn, .visual-container .icon-download") 
                    download_icon.click()
                    time.sleep(1)
                    
                    # Tražimo .JPG dugme
                    jpg_btn = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '.JPG')] | //a[contains(text(), '.JPG')]"))
                    )
                    jpg_url = jpg_btn.get_attribute('href')
                    
                    if jpg_url:
                        img_filename = f"{collection['slug']}-{code}.jpg"
                        saved_path = download_file(jpg_url, images_dir, img_filename)
                        if saved_path:
                            image_url = f"/images/products/carpet/{img_filename}"
                            print(f"      ✅ Slika preuzeta: {image_url}")
                except Exception as e:
                    print(f"      ❌ Greška pri preuzimanju slike: {e}")
                    # Fallback: nađi src glavne slike
                    try:
                        main_img = driver.find_element(By.CSS_SELECTOR, ".product-visual img")
                        src = main_img.get_attribute('src')
                        if src:
                            img_filename = f"{collection['slug']}-{code}-fallback.jpg"
                            saved_path = download_file(src, images_dir, img_filename)
                            if saved_path:
                                image_url = f"/images/products/carpet/{img_filename}"
                                print(f"      ✅ Slika (fallback) preuzeta: {image_url}")
                    except:
                        pass

                # DOKUMENTI
                documents = []
                try:
                    # Klik na "Download all documents" ili traženje linkova
                    # Ovde je jednostavnije naći linkove ka PDF-ovima u sekciji dokumenata
                    doc_links = driver.find_elements(By.CSS_SELECTOR, "a[href$='.pdf']")
                    for link in doc_links:
                        doc_url = link.get_attribute('href')
                        doc_name = link.text.strip() or Path(doc_url).name
                        
                        if 'technical' in doc_name.lower() or 'datasheet' in doc_name.lower():
                            doc_filename = f"{collection['slug']}-{code}-technical.pdf"
                            saved_doc = download_file(doc_url, docs_dir, doc_filename)
                            if saved_doc:
                                documents.append({
                                    "title": "Technical Datasheet",
                                    "url": f"/documents/carpet/{doc_filename}"
                                })
                except Exception as e:
                    print(f"      ❌ Greška pri preuzimanju dokumenata: {e}")

                # Dodaj u listu
                color_data = {
                    "collection": collection['slug'],
                    "collection_name": collection['name'],
                    "code": code,
                    "name": name,
                    "slug": f"{collection['slug']}-{code}",
                    "description": description,
                    "specs": specs,
                    "image_url": image_url,
                    "documents": documents
                }
                
                all_carpet_data['colors'].append(color_data)
                all_carpet_data['total'] += 1
                
            except Exception as e:
                print(f"      ❌ Greška pri obradi boje: {e}")

    except Exception as e:
        print(f"   ❌ Greška pri obradi kolekcije (možda selektori nisu dobri): {e}")

# Save JSON
with open(data_dir / "carpet_tiles_complete.json", 'w', encoding='utf-8') as f:
    json.dump(all_carpet_data, f, indent=2, ensure_ascii=False)

print(f"\n✅ SKRIPTA ZAVRŠENA. Ukupno boja: {all_carpet_data['total']}")
driver.quit()
