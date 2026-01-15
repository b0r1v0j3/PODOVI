#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analyze Gerflor website design and structure
Extract layout, sections, spacing, and content organization
"""

import sys
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import os
from datetime import datetime

# Fix encoding for Windows
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

def get_element_info(element):
    """Extract information about an element"""
    try:
        info = {
            'tag': element.tag_name,
            'text': element.text.strip()[:200] if element.text else '',
            'classes': element.get_attribute('class') or '',
            'id': element.get_attribute('id') or '',
            'visible': element.is_displayed(),
            'size': {
                'width': element.size['width'],
                'height': element.size['height']
            },
            'location': {
                'x': element.location['x'],
                'y': element.location['y']
            }
        }
        return info
    except:
        return None

def analyze_page_structure(driver, url, page_name):
    """Analyze the structure of a page"""
    print(f"\n{'='*80}")
    print(f"Analiziranje: {page_name}")
    print(f"URL: {url}")
    print(f"{'='*80}\n")
    
    driver.get(url)
    time.sleep(3)  # Wait for page load
    
    # Wait for main content
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
    except TimeoutException:
        print(f"  ⚠️  Timeout čekanja na učitavanje stranice")
        return None
    
    analysis = {
        'url': url,
        'page_name': page_name,
        'timestamp': datetime.now().isoformat(),
        'sections': [],
        'accordions': [],
        'tabs': [],
        'buttons': [],
        'images': [],
        'spacing_analysis': {},
        'layout_structure': {}
    }
    
    # Find all main sections
    print("  📋 Pronalaženje sekcija...")
    sections = driver.find_elements(By.XPATH, "//section | //div[contains(@class, 'section')] | //div[contains(@class, 'container')]")
    for i, section in enumerate(sections[:20]):  # Limit to first 20
        if section.is_displayed():
            info = get_element_info(section)
            if info and info['text']:
                analysis['sections'].append({
                    'index': i,
                    'info': info
                })
                print(f"    ✓ Sekcija {i}: {info['text'][:50]}...")
    
    # Find accordions/collapsible elements
    print("\n  📂 Pronalaženje padajućih menija...")
    accordion_selectors = [
        "//button[contains(@aria-expanded, 'true')] | //button[contains(@aria-expanded, 'false')]",
        "//div[contains(@class, 'accordion')]",
        "//div[contains(@class, 'collapse')]",
        "//details",
        "//div[contains(@class, 'expandable')]",
        "//button[contains(@class, 'toggle')]"
    ]
    
    clicked_buttons = set()
    for selector in accordion_selectors:
        try:
            elements = driver.find_elements(By.XPATH, selector)
            for elem in elements[:10]:  # Limit to first 10
                if elem.is_displayed() and elem.is_enabled():
                    try:
                        elem_id = elem.get_attribute('id') or elem.text[:50]
                        if elem_id not in clicked_buttons:
                            clicked_buttons.add(elem_id)
                            
                            # Click to expand
                            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elem)
                            time.sleep(0.5)
                            
                            try:
                                elem.click()
                                time.sleep(1)  # Wait for expansion
                                print(f"    ✓ Kliknuto: {elem.text[:50] if elem.text else elem_id}")
                                
                                # Get expanded content
                                info = get_element_info(elem)
                                if info:
                                    analysis['accordions'].append({
                                        'trigger': info,
                                        'expanded': True
                                    })
                            except:
                                pass
                    except:
                        pass
        except:
            pass
    
    # Find tabs
    print("\n  📑 Pronalaženje tabova...")
    tab_selectors = [
        "//div[contains(@class, 'tab')]//button",
        "//ul[contains(@class, 'tab')]//a",
        "//nav[contains(@class, 'tab')]//button"
    ]
    
    for selector in tab_selectors:
        try:
            tabs = driver.find_elements(By.XPATH, selector)
            for tab in tabs[:5]:  # Limit to first 5
                if tab.is_displayed() and tab.is_enabled():
                    try:
                        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", tab)
                        time.sleep(0.5)
                        tab.click()
                        time.sleep(1)
                        
                        info = get_element_info(tab)
                        if info:
                            analysis['tabs'].append({
                                'tab': info,
                                'clicked': True
                            })
                            print(f"    ✓ Tab kliknut: {info['text'][:50] if info['text'] else 'N/A'}")
                    except:
                        pass
        except:
            pass
    
    # Find all buttons
    print("\n  🔘 Pronalaženje dugmadi...")
    buttons = driver.find_elements(By.TAG_NAME, "button")
    for btn in buttons[:15]:  # Limit to first 15
        if btn.is_displayed():
            info = get_element_info(btn)
            if info and info['text']:
                analysis['buttons'].append(info)
    
    # Analyze spacing and layout
    print("\n  📐 Analiza spacing-a i layout-a...")
    try:
        main_content = driver.find_element(By.TAG_NAME, "main") or driver.find_element(By.TAG_NAME, "body")
        
        # Get computed styles for spacing
        sections_with_spacing = []
        sections = driver.find_elements(By.XPATH, "//section | //div[contains(@class, 'section')]")
        
        for section in sections[:10]:
            if section.is_displayed():
                try:
                    margin_top = driver.execute_script(
                        "return window.getComputedStyle(arguments[0]).marginTop;", section
                    )
                    margin_bottom = driver.execute_script(
                        "return window.getComputedStyle(arguments[0]).marginBottom;", section
                    )
                    padding = driver.execute_script(
                        "return window.getComputedStyle(arguments[0]).padding;", section
                    )
                    
                    sections_with_spacing.append({
                        'margin_top': margin_top,
                        'margin_bottom': margin_bottom,
                        'padding': padding,
                        'height': section.size['height']
                    })
                except:
                    pass
        
        analysis['spacing_analysis'] = {
            'sections': sections_with_spacing
        }
    except:
        pass
    
    # Take screenshot
    screenshot_path = f"downloads/gerflor_analysis/{page_name.replace(' ', '_').lower()}_screenshot.png"
    os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
    driver.save_screenshot(screenshot_path)
    analysis['screenshot'] = screenshot_path
    print(f"\n  📸 Screenshot sačuvan: {screenshot_path}")
    
    # Get page HTML structure (simplified)
    try:
        body = driver.find_element(By.TAG_NAME, "body")
        # Get main structure classes
        main_classes = body.get_attribute('class') or ''
        analysis['layout_structure'] = {
            'body_classes': main_classes,
            'main_container_classes': []
        }
        
        containers = driver.find_elements(By.XPATH, "//div[contains(@class, 'container')] | //main | //section")
        for container in containers[:5]:
            classes = container.get_attribute('class') or ''
            if classes:
                analysis['layout_structure']['main_container_classes'].append(classes)
    except:
        pass
    
    return analysis

def analyze_product_page(driver, product_url, product_name):
    """Analyze a specific product page in detail"""
    print(f"\n{'='*80}")
    print(f"Detaljna analiza proizvoda: {product_name}")
    print(f"{'='*80}\n")
    
    driver.get(product_url)
    time.sleep(4)
    
    analysis = {
        'product_name': product_name,
        'url': product_url,
        'sections': {},
        'certifications': [],
        'eco_features': [],
        'specifications': [],
        'details_sections': [],
        'layout': {}
    }
    
    # Find certifications section
    print("  🏆 Pronalaženje sertifikata...")
    cert_keywords = ['certif', 'certificate', 'sertifikat', 'quality', 'kvalitet']
    for keyword in cert_keywords:
        try:
            elements = driver.find_elements(By.XPATH, f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{keyword}')]")
            for elem in elements[:5]:
                if elem.is_displayed():
                    parent = elem.find_element(By.XPATH, "./ancestor::section | ./ancestor::div[contains(@class, 'section')]")
                    if parent:
                        cert_section = get_element_info(parent)
                        if cert_section:
                            analysis['certifications'].append({
                                'section': cert_section,
                                'text': elem.text[:200] if elem.text else ''
                            })
                            print(f"    ✓ Pronađen sertifikat: {elem.text[:50] if elem.text else 'N/A'}")
                            break
        except:
            pass
    
    # Find eco features
    print("\n  🌱 Pronalaženje ekoloških karakteristika...")
    eco_keywords = ['eco', 'ekolo', 'sustainable', 'održiv', 'recycl', 'recikl']
    for keyword in eco_keywords:
        try:
            elements = driver.find_elements(By.XPATH, f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{keyword}')]")
            for elem in elements[:5]:
                if elem.is_displayed():
                    parent = elem.find_element(By.XPATH, "./ancestor::section | ./ancestor::div[contains(@class, 'section')]")
                    if parent:
                        eco_section = get_element_info(parent)
                        if eco_section:
                            analysis['eco_features'].append({
                                'section': eco_section,
                                'text': elem.text[:200] if elem.text else ''
                            })
                            print(f"    ✓ Pronađena ekološka karakteristika: {elem.text[:50] if elem.text else 'N/A'}")
                            break
        except:
            pass
    
    # Find all expandable sections and click them
    print("\n  📖 Otvaranje svih sekcija...")
    expandable_selectors = [
        "//button[contains(@aria-expanded, 'false')]",
        "//details[not(@open)]",
        "//div[contains(@class, 'accordion')]//button",
        "//div[contains(@class, 'collapse')]//button"
    ]
    
    clicked = set()
    for selector in expandable_selectors:
        try:
            elements = driver.find_elements(By.XPATH, selector)
            for elem in elements:
                if elem.is_displayed() and elem.is_enabled():
                    try:
                        elem_id = id(elem)
                        if elem_id not in clicked:
                            clicked.add(elem_id)
                            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elem)
                            time.sleep(0.5)
                            elem.click()
                            time.sleep(1.5)
                            
                            # Get expanded content
                            try:
                                expanded_text = elem.find_element(By.XPATH, "./following-sibling::* | ./ancestor::div[contains(@class, 'content')]").text[:300]
                                analysis['details_sections'].append({
                                    'trigger': elem.text[:100] if elem.text else '',
                                    'content': expanded_text
                                })
                                print(f"    ✓ Otvoreno: {elem.text[:50] if elem.text else 'Sekcija'}")
                            except:
                                pass
                    except:
                        pass
        except:
            pass
    
    # Take full page screenshot
    screenshot_path = f"downloads/gerflor_analysis/{product_name.replace(' ', '_').lower()}_full.png"
    driver.save_screenshot(screenshot_path)
    analysis['screenshot'] = screenshot_path
    print(f"\n  📸 Screenshot sačuvan: {screenshot_path}")
    
    return analysis

def main():
    """Main analysis function"""
    print("="*80)
    print("GERFLOR DESIGN ANALIZA")
    print("="*80)
    
    driver = setup_driver()
    all_analyses = {}
    
    try:
        # Analyze main pages
        pages_to_analyze = [
            ("https://www.gerflor-cee.com/products/lvt", "LVT Kategorija"),
            ("https://www.gerflor-cee.com/products/linoleum", "Linoleum Kategorija"),
        ]
        
        for url, name in pages_to_analyze:
            try:
                analysis = analyze_page_structure(driver, url, name)
                if analysis:
                    all_analyses[name] = analysis
            except Exception as e:
                print(f"  ❌ Greška pri analizi {name}: {e}")
        
        # Analyze specific product pages
        product_pages = [
            ("https://www.gerflor-cee.com/products/creation-40-zen", "Creation 40 Zen (LVT)"),
            ("https://www.gerflor-cee.com/products/dlw-colorette", "DLW Colorette (Linoleum)"),
        ]
        
        for url, name in product_pages:
            try:
                analysis = analyze_product_page(driver, url, name)
                if analysis:
                    all_analyses[f"Product_{name}"] = analysis
            except Exception as e:
                print(f"  ❌ Greška pri analizi proizvoda {name}: {e}")
        
        # Save analysis results
        output_file = "downloads/gerflor_analysis/design_analysis.json"
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_analyses, f, ensure_ascii=False, indent=2)
        
        print(f"\n{'='*80}")
        print(f"✅ Analiza završena!")
        print(f"📄 Rezultati sačuvani: {output_file}")
        print(f"{'='*80}\n")
        
    except Exception as e:
        print(f"\n❌ Greška: {e}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()

if __name__ == '__main__':
    main()
