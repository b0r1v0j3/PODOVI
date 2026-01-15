#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TEST - Klikni na "See full description" i izvuci sve podatke
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

print("="*80)
print("TEST - See full description popup")
print("="*80)

chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--start-maximized")

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=chrome_options
)
wait = WebDriverWait(driver, 15)

test_url = "https://www.gerflor-cee.com/products/dlw-colorette-0006-vivid-green-r8940006"

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
    
    # Pronađi "See full description" link
    print("\nTražim 'See full description' link...")
    try:
        see_full_desc = driver.find_element(By.XPATH, "//a[contains(text(), 'See full description')] | //button[contains(text(), 'See full description')]")
        print(f"✓ Pronađen: {see_full_desc.tag_name}")
        
        # Klikni na njega
        driver.execute_script("arguments[0].scrollIntoView(true);", see_full_desc)
        time.sleep(0.5)
        driver.execute_script("arguments[0].click();", see_full_desc)
        print("✓ Kliknuto!")
        time.sleep(2)
        
        # Popup bi sada trebalo da se otvori
        print("\nTražim popup sa informacijama...")
        
        # Čekaj da se popup učita
        time.sleep(1)
        
        # Pronađi sve vidljive divove koji su se tek pojavili
        print("Tražim nove vidljive elemente...")
        all_divs = driver.find_elements(By.XPATH, "//div")
        
        # Traži div koji ima h1 ili h2 sa naslovom proizvoda
        potential_popups = []
        for div in all_divs:
            try:
                if div.is_displayed():
                    headers = div.find_elements(By.XPATH, ".//h1 | .//h2")
                    for h in headers:
                        if "VIVID GREEN" in h.text or "COLORETTE" in h.text:
                            potential_popups.append(div)
                            break
            except:
                pass
        
        print(f"✓ Pronađeno {len(potential_popups)} potencijalnih popup-ova")
        
        if potential_popups:
            popup = potential_popups[0]
            print(f"Koristim prvi popup")
            
            # Ispiši klase popup-a
            print(f"Popup klase: {popup.get_attribute('class')}")
            
            # Ispiši prvih 1500 chars HTML-a
            popup_html = popup.get_attribute('outerHTML')
            print(f"\nHTML popup-a (prvih 1500 chars):\n{popup_html[:1500]}...\n")
        
        # Traži naslov popup-a
        try:
            popup_title = driver.find_element(By.XPATH, "//div[contains(@class, 'dialog') or contains(@class, 'modal') or contains(@role, 'dialog')]//h2 | //div[contains(@class, 'dialog') or contains(@class, 'modal')]//h1")
            print(f"✓ Popup naslov: {popup_title.text}")
        except:
            print("⚠️  Ne mogu da pronađem naslov popup-a")
        
        # Traži specifično tekstove iz popup-a
        print("\nIzvlačim podatke iz popup-a...")
        
        # Traži sve elemente koji sadrže ove keywords
        keywords = [
            "FORMAT", 
            "OVERALL THICKNESS", 
            "DIMENSION", 
            "WELDING ROD",
            "Surface treatment",
            "Overall thickness",
            "Thickness of the wearlayer",
            "Installation system covering",
            "Format details",
            "Width of sheet",
            "Length of sheet"
        ]
        specs = {}
        
        for keyword in keywords:
            try:
                # Traži element koji sadrži keyword (case insensitive)
                elements = driver.find_elements(By.XPATH, f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{keyword.lower()}')]")
                
                for elem in elements:
                    if elem.is_displayed():
                        # Ispiši element i njegov parent
                        print(f"\n  Keyword: {keyword}")
                        print(f"    Element tag: {elem.tag_name}")
                        print(f"    Element text: {elem.text[:80]}")
                        print(f"    Element class: {elem.get_attribute('class')}")
                        
                        # Pogledaj parent
                        try:
                            parent = elem.find_element(By.XPATH, "..")
                            print(f"    Parent tag: {parent.tag_name}")
                            print(f"    Parent text: {parent.text[:100]}")
                            print(f"    Parent class: {parent.get_attribute('class')}")
                            
                            # Parent ima label i value odvojene novom linijom
                            parent_lines = parent.text.strip().split("\n")
                            if len(parent_lines) >= 2:
                                label = parent_lines[0].strip()
                                value = parent_lines[1].strip()
                                specs[label] = value
                                print(f"    ✓ Extracted: {label} = {value}")
                        except:
                            pass
                        
                        break  # Našli smo prvi vidljiv, idemo dalje
            except:
                pass
        
        print(f"\n✓ Ukupno ekstrahovano: {len(specs)} specifikacija")
        for key, val in specs.items():
            print(f"  • {key}: {val}")
        
        # Izvuci glavni opis (introductory text)
        print("\nIzvlačim glavni opis...")
        try:
            # Traži paragraf koji sadrži "natural ingredients" ili "flooring solution"
            intro_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'natural ingredients') or contains(text(), 'flooring solution') or contains(text(), 'performance flooring')]")
            
            for elem in intro_elements:
                if elem.is_displayed() and elem.tag_name in ['p', 'div']:
                    intro_text = elem.text.strip()
                    if len(intro_text) > 20 and len(intro_text) < 500:
                        specs['intro_description'] = intro_text
                        print(f"  ✓ Intro: {intro_text[:100]}...")
                        break
        except:
            pass
        
        # Izvuci glavne features (bullet lista na vrhu)
        print("\nIzvlačim glavne features (top bullets)...")
        try:
            # Traži bullet listu koja je blizu naslova (FORMAT/DIMENSION sekcije)
            # To su obično prvi <ul> ili prvi bullets
            all_bullets = driver.find_elements(By.XPATH, "//li")
            
            main_features = []
            for bullet in all_bullets[:10]:  # Prvih 10
                if bullet.is_displayed():
                    text = bullet.text.strip()
                    # Filtruj navigacione elemente
                    if text and text not in ["Products", "Segments", "Gerflor group", "Sustainability", "Contact", "Design by Gerflor"]:
                        if len(text) < 100 and ("design" in text.lower() or "resistance" in text.lower() or "maintenance" in text.lower() or "natural" in text.lower()):
                            main_features.append(text)
            
            if main_features:
                specs['main_features'] = main_features[:5]  # Prvih 5
                print(f"  ✓ Main features: {len(main_features[:5])}")
                for i, feat in enumerate(main_features[:5], 1):
                    print(f"    {i}. {feat}")
        except:
            pass
        
        # Izvuci tekstualne informacije (bullets) po sekcijama
        print("\nIzvlačim tekstualne informacije (bullets)...")
        
        sections_to_extract = [
            "Product & Design",
            "Installation & Maintenance", 
            "Market Application",
            "Sustainability"
        ]
        
        bullets_by_section = {}
        
        for section_name in sections_to_extract:
            try:
                # Pronađi heading sa imenom sekcije
                section_heading = driver.find_elements(By.XPATH, f"//*[contains(text(), '{section_name}')]")
                
                for heading in section_heading:
                    if heading.is_displayed():
                        # Pronađi parent koji sadrži i heading i bullet listu
                        parent = heading.find_element(By.XPATH, "../..")
                        
                        # Pronađi sve <li> elemente unutar tog parent-a
                        bullets = parent.find_elements(By.XPATH, ".//li")
                        
                        section_bullets = []
                        for bullet in bullets:
                            text = bullet.text.strip()
                            if text and text not in ["Products", "Segments"]:  # Skip navigation
                                section_bullets.append(text)
                        
                        if section_bullets:
                            bullets_by_section[section_name] = section_bullets
                            print(f"\n  {section_name}: {len(section_bullets)} bullet(s)")
                            for i, b in enumerate(section_bullets[:5], 1):
                                print(f"    {i}. {b[:70]}{'...' if len(b) > 70 else ''}")
                        break
            except Exception as e:
                print(f"  ⚠️  {section_name}: ne mogu da izvučem - {e}")
        
        # Zatvori popup
        print("\nZatvaranje popup-a...")
        try:
            # Traži X dugme ili Close dugme
            close_btn = driver.find_element(By.XPATH, "//button[contains(@aria-label, 'Close') or contains(@class, 'close') or contains(text(), 'Close')] | //div[contains(@class, 'dialog')]//button[@aria-label]")
            driver.execute_script("arguments[0].click();", close_btn)
            print("✓ Popup zatvoren!")
            time.sleep(1)
        except Exception as e:
            print(f"⚠️  Ne mogu da zatvorim popup (možda ESC radi): {e}")
            # Probaj ESC
            from selenium.webdriver.common.keys import Keys
            driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
            print("✓ Poslat ESC")
            time.sleep(1)
    
    except Exception as e:
        print(f"✗ Greška: {e}")
        import traceback
        traceback.print_exc()
    
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
