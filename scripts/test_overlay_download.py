#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TEST - Pronalaženje overlay download ikonice
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
import time
from pathlib import Path

print("="*80)
print("TEST - Pronalaženje OVERLAY download ikonice")
print("="*80)

download_folder = Path("downloads/linoleum_test")
download_folder.mkdir(parents=True, exist_ok=True)

chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--start-maximized")

prefs = {
    "download.default_directory": str(download_folder.absolute()),
    "download.prompt_for_download": False,
}
chrome_options.add_experimental_option("prefs", prefs)

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=chrome_options
)
wait = WebDriverWait(driver, 15)

test_url = "https://www.gerflor-cee.com/products/dlw-colorette-0001-banana-yellow-r8940001"

try:
    print(f"Otvaranje: {test_url}")
    driver.get(test_url)
    time.sleep(3)
    
    # Accept cookies
    try:
        accept_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Accept')]")
        driver.execute_script("arguments[0].click();", accept_btn)
        time.sleep(1)
    except:
        pass
    
    # Pronađi glavnu sliku
    main_image = driver.find_element(By.XPATH, "//img[contains(@src, 'gerflor') and not(contains(@src, 'logo'))]")
    print(f"✓ Pronađena glavna slika")
    
    # Hover preko slike da se pojavi overlay
    actions = ActionChains(driver)
    print("\nPomeram miš preko slike (hover)...")
    actions.move_to_element(main_image).perform()
    time.sleep(2)
    
    print("\nTražim SVE elemente koji se pojavljuju preko slike...")
    
    # Traži sve vidljive elemente na strani
    all_visible = driver.find_elements(By.XPATH, "//*[not(contains(@style, 'display: none')) and not(contains(@style, 'visibility: hidden'))]")
    
    # Filtriraj one koji imaju nešto sa download ili jpg u sebi
    candidates = []
    for elem in all_visible:
        text = elem.text.strip().lower()
        classes = (elem.get_attribute('class') or '').lower()
        aria = (elem.get_attribute('aria-label') or '').lower()
        
        if 'jpg' in text or 'download' in classes or 'download' in aria:
            candidates.append(elem)
    
    print(f"\n✓ Pronađeno {len(candidates)} kandidata sa 'jpg' ili 'download'")
    
    for i, elem in enumerate(candidates[:10]):
        print(f"\n[{i+1}] {elem.tag_name}")
        text = elem.text if elem.text else ''
        classes = elem.get_attribute('class') or ''
        print(f"    text: {text[:50] if text else 'N/A'}...")
        print(f"    class: {classes}")
        print(f"    aria-label: {elem.get_attribute('aria-label')}")
        
        # Proveri da li je element u vidljivoj oblasti (viewport)
        is_displayed = elem.is_displayed()
        print(f"    is_displayed: {is_displayed}")
        
        # Ako ima 'download-button--trigger' u klasi, to je naša ikonica!
        if 'download-button--trigger' in classes and is_displayed:
            print(f"\n✓✓✓ OVO JE VEROVATNO DOWNLOAD IKONICA!")
            print(f"    Pokušavam da kliknem...")
            
            try:
                # Skrolujem do elementa
                driver.execute_script("arguments[0].scrollIntoView(true);", elem)
                time.sleep(0.5)
                
                # Hover ponovo preko slike da bi ikonica ostala vidljiva
                actions.move_to_element(main_image).perform()
                time.sleep(0.5)
                
                # Klikni na ikonicu
                driver.execute_script("arguments[0].click();", elem)
                print(f"    ✓ Kliknuto na 'Download options'!")
                time.sleep(1.5)  # Čekaj da se dropdown pojavi
                
                # Sada traži .jpg opciju u dropdown meniju koji se pojavio
                print(f"\n    Tražim .jpg dugme ispod 'Download options'...")
                try:
                    # Čekaj malo duže da se meni prikaže
                    time.sleep(0.5)
                    
                    # Traži button ili a tagove koji su vidljivi i imaju ".jpg" u tekstu
                    jpg_buttons = driver.find_elements(By.XPATH, "//button[contains(., '.jpg') or contains(., 'JPG')] | //a[contains(., '.jpg') or contains(., 'JPG')] | //*[contains(@class, 'download') and contains(., 'jpg')]")
                    
                    visible_jpg_buttons = [b for b in jpg_buttons if b.is_displayed()]
                    
                    print(f"    Pronađeno {len(visible_jpg_buttons)} vidljivih button/a tagova sa '.jpg'")
                    
                    for j, opt in enumerate(visible_jpg_buttons):
                        print(f"      [{j+1}] {opt.tag_name}: '{opt.text}' - class: {opt.get_attribute('class')}")
                    
                    # Klikni na prvi vidljiv
                    if visible_jpg_buttons:
                        first_jpg = visible_jpg_buttons[0]
                        print(f"\n    Klikćem na .jpg opciju: {first_jpg.text}")
                        driver.execute_script("arguments[0].click();", first_jpg)
                        print(f"    ✓ Kliknuto!")
                        time.sleep(3)
                        
                        # Proveri download
                        files = list(download_folder.glob("*"))
                        if files:
                            print(f"\n✓✓✓ USPEH! Preuzeto {len(files)} fajlova:")
                            for f in files:
                                print(f"      - {f.name} ({f.stat().st_size} bytes)")
                        else:
                            print(f"\n⚠️  Fajl jos nije u folderu")
                    else:
                        print(f"\n    ⚠️  Nema vidljivih .jpg dugmića")
                    
                except Exception as e:
                    print(f"    ✗ Greška pri traženju .jpg opcije: {e}")
                    import traceback
                    traceback.print_exc()
                
                break  # Pronašli smo ikonicu, ne treba dalje
                
            except Exception as e:
                print(f"    ✗ Greška pri klikanju: {e}")
    
    print("\n" + "="*80)
    print("Čekam 5 sekundi...")
    print("="*80)
    time.sleep(5)

except Exception as e:
    print(f"\n❌ Greška: {e}")
    import traceback
    traceback.print_exc()

finally:
    driver.quit()
    print("\n✓ Browser zatvoren")
