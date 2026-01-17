import pdfplumber
import re

pdf_path = r"d:\PODOVI\SAJT\downloads\gerflor_documents\creation-40\creation 304050 - folleto.pdf"

try:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        
        # Check first 10 pages for now, or search for "NCS"
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text and ("NCS" in text or "LRV" in text):
                print(f"\n--- Page {i+1} ---")
                print(text[:1000]) # Print first 1000 chars
                
                # Try to find specific NCS patterns
                ncs_matches = re.findall(r'NCS\s+S\s+\d{4}-[A-Z]\d{2}[A-Z]', text)
                if ncs_matches:
                    print(f"Found NCS matches: {ncs_matches[:5]}...")
                
                # Check for table structure
                tables = page.extract_tables()
                if tables:
                    print(f"Found {len(tables)} tables on page {i+1}")
                    print("First row of first table:", tables[0][0])
                    
except Exception as e:
    print(f"Error: {e}")
