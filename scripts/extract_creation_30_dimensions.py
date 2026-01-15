#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skripta za ekstrakciju dimenzija za sve 43 boje iz Creation 30 kolekcije
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def setup_driver():
    """Setup Chrome driver"""
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )
    return driver

def accept_cookies(driver):
    """Accept cookies if present"""
    try:
        cookie_button = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.ID, "tarteaucitronPersonalize2"))
        )
        if cookie_button.is_displayed():
            cookie_button.click()
            time.sleep(1)
    except:
        pass

def get_product_specs(driver):
    """Extract product specifications from the page"""
    specs = {}
    try:
        spec_keywords = ['FORMAT', 'DIMENSION', 'OVERALL THICKNESS', 'WELDING ROD REF.', 'WELDING ROD']
        
        for keyword in spec_keywords:
            try:
                elements = driver.find_elements(By.XPATH, 
                    f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{keyword.lower()}')]"
                )
                
                for elem in elements:
                    if elem.is_displayed() and elem.get_attribute('class') == 'category-label':
                        try:
                            parent = elem.find_element(By.XPATH, "..")
                            parent_lines = parent.text.strip().split("\n")
                            if len(parent_lines) >= 2:
                                label = parent_lines[0].strip()
                                value = parent_lines[1].strip()
                                specs[label] = value
                            break
                        except:
                            pass
            except:
                pass
    except:
        pass
    
    return specs

def get_all_colors_from_collection(driver, collection_url):
    """Get all color URLs from a collection page"""
    print(f"📊 Sakupljam sve boje iz kolekcije...")
    
    driver.get(collection_url)
    time.sleep(3)
    accept_cookies(driver)
    
    color_urls = []
    
    try:
        # Try to find "View all" button and click it
        view_all_btn = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'View all')]"))
        )
        driver.execute_script("arguments[0].click();", view_all_btn)
        time.sleep(2)
        
        # Collect links from the modal
        modal_colors = driver.find_elements(By.XPATH, "//div[contains(@class, 'modal')]//a[contains(@href, '/products/')]")
        for link in modal_colors:
            href = link.get_attribute('href')
            if href and href not in color_urls and href != collection_url:
                color_urls.append(href)
        
        # Close modal
        driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
        time.sleep(1)
    except:
        # Fallback: collect colors directly from the page
        page_colors = driver.find_elements(By.XPATH, "//a[contains(@href, '/products/')]")
        for link in page_colors:
            href = link.get_attribute('href')
            if href and href not in color_urls and href != collection_url:
                import re
                if re.search(r'-\d{4}-', href) or re.search(r'r\d{7}', href):
                    color_urls.append(href)
    
    print(f"  ✓ Pronađeno {len(color_urls)} boja")
    return color_urls

def extract_creation_30_dimensions():
    """Extract dimensions for all 43 colors in Creation 30 collection"""
    collection_url = "https://www.gerflor-cee.com/products/creation-30-new-collection"
    
    driver = setup_driver()
    results = {}
    
    try:
        # Get all colors
        color_urls = get_all_colors_from_collection(driver, collection_url)
        
        if not color_urls:
            print("❌ Nisu pronađene boje!")
            return
        
        print(f"\n3️⃣  Obrada {len(color_urls)} boja...")
        for i, color_url in enumerate(color_urls, 1):
            color_slug = color_url.split('/')[-1]
            print(f"\n  [{i}/{len(color_urls)}] {color_slug}")
            
            try:
                driver.get(color_url)
                time.sleep(2)
                accept_cookies(driver)
                
                # Extract specs
                color_specs = get_product_specs(driver)
                
                if color_specs:
                    results[color_slug] = color_specs
                    print(f"    ✓ Specs ekstraktovani: {color_specs}")
                else:
                    print(f"    ⚠️  Nisu pronađeni specs")
                    
            except Exception as e:
                print(f"    ✗ Greška: {e}")
    
    finally:
        driver.quit()
    
    # Save results
    output_file = "downloads/creation_30_dimensions.json"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Gotovo!")
    print(f"  📊 Ekstraktovano {len(results)} boja sa specs")
    print(f"  📄 Sačuvano u: {output_file}")
    
    return results

if __name__ == '__main__':
    import os
    extract_creation_30_dimensions()
