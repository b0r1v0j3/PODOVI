#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TEST - Preuzimanje slike sa jednog proizvoda
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
from pathlib import Path

print("="*80)
print("TEST PREUZIMANJA SLIKE SA JEDNOG PROIZVODA")
print("="*80)
print()

# Setup download folder
download_folder = Path("downloads/linoleum_test")
download_folder.mkdir(parents=True, exist_ok=True)

# Chrome setup
chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--start-maximized")

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

# Test URL - BANANA YELLOW
test_url = "https://www.gerflor-cee.com/products/dlw-colorette-0001-banana-yellow-r8940001"

try:
    print(f"Otvaranje: {test_url}")
    driver.get(test_url)
    time.sleep(3)
    
    # Accept cookies
    try:
        accept_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Accept')]")
        driver.execute_script("arguments[0].click();", accept_btn)
        print("✓ Cookies accepted")
        time.sleep(1)
    except:
        print("- No cookies")
    
    print("\n" + "="*80)
    print("METOD 1: Pronalaženje download ikonice")
    print("="*80)
    
    # Try to find all possible download buttons
    print("\nTražim sve dugmiće i linkove sa 'download' u atributima...")
    
    # Method A: aria-label
    try:
        download_btns = driver.find_elements(By.XPATH, "//*[contains(@aria-label, 'download') or contains(@aria-label, 'Download')]")
        print(f"  Pronađeno sa aria-label: {len(download_btns)}")
        for i, btn in enumerate(download_btns[:5]):  # Show first 5
            href = btn.get_attribute('href') if btn.tag_name == 'a' else 'N/A'
            classes = btn.get_attribute('class')
            print(f"    [{i+1}] {btn.tag_name} - aria: {btn.get_attribute('aria-label')}")
            print(f"        href: {href[:70] if href else 'N/A'}...")
            print(f"        class: {classes}")
    except Exception as e:
        print(f"  ✗ Greška: {e}")
    
    # Method B: button/a sa SVG ikonama
    try:
        svg_buttons = driver.find_elements(By.XPATH, "//button[.//svg] | //a[.//svg]")
        print(f"\n  Pronađeno dugmića sa SVG ikonama: {len(svg_buttons)}")
        for i, btn in enumerate(svg_buttons[:10]):  # Limitujem na prvih 10
            classes = btn.get_attribute('class')
            aria = btn.get_attribute('aria-label')
            title = btn.get_attribute('title')
            onclick = btn.get_attribute('onclick')
            print(f"    [{i+1}] {btn.tag_name}")
            print(f"        class: {classes}")
            print(f"        aria: {aria}")
            print(f"        title: {title}")
            print(f"        onclick: {onclick[:50] if onclick else 'N/A'}...")
    except Exception as e:
        print(f"  ✗ Greška: {e}")
    
    # Method C: Traži download button/link BLIZU glavne slike
    print("\n" + "="*80)
    print("METOD 2: Traženje download dugmeta BLIZU glavne slike")
    print("="*80)
    
    try:
        # Pronađi glavni image kontejner
        main_image = driver.find_element(By.XPATH, "//img[contains(@src, 'gerflor') and not(contains(@src, 'logo'))]")
        print(f"✓ Pronađena glavna slika: {main_image.get_attribute('src')[:60]}...")
        
        # Pronađi parent kontejner slike
        parent = main_image.find_element(By.XPATH, "./ancestor::div[1]")
        print(f"✓ Pronađen parent kontejner: class={parent.get_attribute('class')}")
        
        # Hover preko slike da se pojavi download ikonica
        from selenium.webdriver.common.action_chains import ActionChains
        actions = ActionChains(driver)
        print("\n  Pomeram miš preko slike (hover)...")
        actions.move_to_element(main_image).perform()
        time.sleep(1)
        
        # Sada traži klikljive elemente nakon hover-a
        clickables = parent.find_elements(By.XPATH, ".//button | .//a")
        print(f"  Nakon hover-a: Pronađeno {len(clickables)} klikljivih elemenata")
        
        if clickables:
            for i, elem in enumerate(clickables):
                print(f"\n  [{i+1}] {elem.tag_name}")
                print(f"      class: {elem.get_attribute('class')}")
                print(f"      aria-label: {elem.get_attribute('aria-label')}")
                title = elem.get_attribute('title')
                if title:
                    print(f"      title: {title}")
                href = elem.get_attribute('href') if elem.tag_name == 'a' else None
                if href:
                    print(f"      href: {href[:60]}...")
                
                # Ako ima download u nečemu, klikni na to
                classes = elem.get_attribute('class') or ''
                aria = elem.get_attribute('aria-label') or ''
                if 'download' in classes.lower() or 'download' in aria.lower():
                    print(f"\n  ✓ OVO IZGLEDA KAO DOWNLOAD DUGME!")
                    print(f"    Klikćem na njega...")
                    driver.execute_script("arguments[0].click();", elem)
                    time.sleep(2)
                    
                    # Traži .jpg opciju
                    try:
                        jpg_btn = driver.find_element(By.XPATH, "//*[contains(text(), '.jpg') or contains(text(), 'JPG')]")
                        print(f"    ✓ Pronađen .jpg: {jpg_btn.text}")
                        driver.execute_script("arguments[0].click();", jpg_btn)
                        print(f"    ✓ Kliknuto na .jpg!")
                        time.sleep(3)
                        
                        # Check download
                        files = list(download_folder.glob("*"))
                        if files:
                            print(f"\n✓✓✓ USPEH! Preuzeto:")
                            for f in files:
                                print(f"      - {f.name}")
                    except:
                        print(f"    ⚠️  Nema .jpg opcije")
                    break
        else:
            print("  ⚠️  I dalje 0 elemenata nakon hover-a")
    
    except Exception as e:
        print(f"✗ Greška: {e}")
        import traceback
        traceback.print_exc()
    
    # Try clicking first download link
    print("\n" + "="*80)
    print("METOD 3: Klikni na prvi Download link (iz dokumenta)")
    print("="*80)
    
    try:
        download_btns = driver.find_elements(By.XPATH, "//*[contains(@aria-label, 'Download')]")
        if download_btns:
            first_download = download_btns[0]
            print(f"Klikćem na prvi download link...")
            print(f"  Tag: {first_download.tag_name}")
            print(f"  Href: {first_download.get_attribute('href')[:80] if first_download.tag_name == 'a' else 'N/A'}...")
            
            driver.execute_script("arguments[0].scrollIntoView(true);", first_download)
            time.sleep(0.5)
            driver.execute_script("arguments[0].click();", first_download)
            print("✓ Kliknuto!")
            time.sleep(2)
            
            # Check if dropdown appeared
            print("\nTražim dropdown sa opcijama...")
            try:
                # Look for menu or dropdown that appeared
                dropdown = driver.find_element(By.XPATH, "//*[contains(@class, 'dropdown') or contains(@class, 'menu') or contains(@role, 'menu')]")
                print(f"✓ Pronađen dropdown!")
                print(f"  HTML: {dropdown.get_attribute('outerHTML')[:300]}...")
                
                # Find .jpg option
                jpg_options = dropdown.find_elements(By.XPATH, ".//*[contains(text(), 'jpg') or contains(text(), 'JPG')]")
                if jpg_options:
                    print(f"\n✓ Pronađeno {len(jpg_options)} .jpg opcija")
                    for i, opt in enumerate(jpg_options):
                        print(f"  [{i+1}] {opt.tag_name}: {opt.text}")
                    
                    print(f"\nKlikćem na prvu .jpg opciju...")
                    driver.execute_script("arguments[0].click();", jpg_options[0])
                    print("✓ Kliknuto!")
                    time.sleep(3)
                    
                    # Check downloads
                    downloaded_files = list(download_folder.glob("*"))
                    if downloaded_files:
                        print(f"\n✓✓✓ USPEH! Preuzeto {len(downloaded_files)} fajlova:")
                        for f in downloaded_files:
                            print(f"  - {f.name}")
                    else:
                        print(f"\n⚠️  Fajl jos nije u folderu, možda se preuzima...")
                else:
                    print("\n✗ Nema .jpg opcije u dropdownu")
            except Exception as e:
                print(f"⚠️  Ne mogu da pronađem dropdown: {e}")
        
    except Exception as e:
        print(f"✗ Greška: {e}")
        import traceback
        traceback.print_exc()
    
    # Method C: Specifično traženje ikonice u gornjem desnom uglu glavne slike
    print("\n" + "="*80)
    print("METOD 3: Traženje ikonice u gornjem desnom uglu slike")
    print("="*80)
    
    try:
        # Pronađi kontejner glavne slike
        main_image_container = driver.find_element(By.XPATH, "//div[contains(@class, 'product') or contains(@class, 'image')]//img/ancestor::div[1]")
        print("✓ Pronađen kontejner glavne slike")
        
        # Unutar tog kontejnera, traži button ili a tag
        download_icon = main_image_container.find_element(By.XPATH, ".//button | .//a")
        print(f"✓ Pronađena ikonica: {download_icon.tag_name}")
        print(f"  Class: {download_icon.get_attribute('class')}")
        print(f"  Aria-label: {download_icon.get_attribute('aria-label')}")
        
        # Klikni na ikonicu
        driver.execute_script("arguments[0].scrollIntoView(true);", download_icon)
        time.sleep(0.5)
        print("\nKlikćem na download ikonicu...")
        driver.execute_script("arguments[0].click();", download_icon)
        time.sleep(1)
        print("✓ Kliknuto!")
        
        # Traži dropdown menu sa opcijama
        print("\nTražim .jpg opciju u dropdown meniju...")
        
        # Try different selectors for .jpg option
        jpg_found = False
        
        # Method 1: Button sa tekstom ".jpg"
        try:
            jpg_btn = driver.find_element(By.XPATH, "//button[contains(text(), '.jpg') or contains(text(), 'JPG')]")
            print(f"✓ Pronađen .jpg button: {jpg_btn.text}")
            driver.execute_script("arguments[0].click();", jpg_btn)
            jpg_found = True
            print("✓ Kliknuto na .jpg!")
        except:
            pass
        
        # Method 2: Link sa tekstom ".jpg"
        if not jpg_found:
            try:
                jpg_link = driver.find_element(By.XPATH, "//a[contains(text(), '.jpg') or contains(text(), 'JPG')]")
                print(f"✓ Pronađen .jpg link: {jpg_link.text}")
                driver.execute_script("arguments[0].click();", jpg_link)
                jpg_found = True
                print("✓ Kliknuto na .jpg!")
            except:
                pass
        
        # Method 3: Bilo koji element u dropdown meniju
        if not jpg_found:
            try:
                dropdown_options = driver.find_elements(By.XPATH, "//*[contains(@class, 'dropdown') or contains(@class, 'menu')]//*[contains(text(), 'jpg') or contains(text(), 'JPG')]")
                if dropdown_options:
                    print(f"✓ Pronađeno {len(dropdown_options)} opcija sa 'jpg'")
                    for opt in dropdown_options:
                        print(f"  - {opt.tag_name}: {opt.text}")
                    driver.execute_script("arguments[0].click();", dropdown_options[0])
                    jpg_found = True
                    print("✓ Kliknuto na prvu opciju!")
            except Exception as e:
                print(f"✗ Greška: {e}")
        
        if jpg_found:
            print("\n✓ Slika bi trebalo da se preuzima...")
            time.sleep(3)  # Čekaj da se preuzme
            
            # Proveri da li je fajl preuzet
            downloaded_files = list(download_folder.glob("*"))
            if downloaded_files:
                print(f"\n✓ USPEH! Preuzeto {len(downloaded_files)} fajlova:")
                for f in downloaded_files:
                    print(f"  - {f.name}")
            else:
                print("\n⚠️  Fajl nije pronađen u download folderu")
        else:
            print("\n✗ Ne mogu da pronađem .jpg opciju")
            
            # Isprintaj HTML dropdown-a ako postoji
            try:
                dropdown = driver.find_element(By.XPATH, "//*[contains(@class, 'dropdown') or contains(@class, 'menu') or contains(@role, 'menu')]")
                print(f"\nHTML dropdown-a:\n{dropdown.get_attribute('outerHTML')[:500]}")
            except:
                print("\n⚠️  Ne mogu da pronađem dropdown meni")
    
    except Exception as e:
        print(f"\n✗ Greška: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "="*80)
    print("Čekam 10 sekundi da možeš da vidiš stranicu...")
    print("="*80)
    time.sleep(10)

except Exception as e:
    print(f"\n❌ Kritična greška: {e}")
    import traceback
    traceback.print_exc()

finally:
    print("\nZatvaranje browsera...")
    driver.quit()
    print("✓ Gotovo")
