from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

options = webdriver.ChromeOptions()
options.add_argument("--headless")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('useAutomationExtension', False)

print("Starting driver...")
try:
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    print("Driver started.")
    
    url = "https://www.gerflor-cee.com/products/creation-30-new-collection-0347-ballerina-41870347"
    print(f"Visiting {url}...")
    driver.get(url)
    
    print("Page title:", driver.title)
    
    # Try to find NCS
    page_source = driver.page_source
    if "NCS" in page_source:
        print("FOUND NCS in page source!")
    else:
        print("NCS NOT FOUND in page source.")
        
    driver.quit()
except Exception as e:
    print(f"Error: {e}")
