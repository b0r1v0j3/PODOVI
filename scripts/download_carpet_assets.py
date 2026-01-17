import json
import os
import requests
from urllib.parse import urlparse

def download_file(url, dest_folder):
    if not url: return None
    os.makedirs(dest_folder, exist_ok=True)
    filename = os.path.basename(urlparse(url).path)
    if not filename: return None
    
    # Handle duplicate filenames or missing extensions
    if '.' not in filename:
        filename += '.pdf' if 'pdf' in url else '.jpg'
        
    filepath = os.path.join(dest_folder, filename)
    
    if os.path.exists(filepath):
        return filename
        
    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return filename
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return None

def translate_desc(desc, collection):
    # Basic translation for Armonia series
    if "ARMONIA 400" in collection.upper():
        return "Armonia 400 je ulaznica u svet Armonia tekstilnih ploča. Pažljivo izrađene u Evropskoj uniji, ove ploče sa 'loop' teksturom donose udobnost i harmoniju u prostore sa umerenom frekvencijom saobraćaja. Karakteristike: format ploča 50x50cm, 100% bojen polipropilen, težina vlakna: 400 g/m²."
    elif "ARMONIA 540" in collection.upper():
        return "Armonia 540 tekstilne ploče su specijalno dizajnirane da se uklapaju sa našim LVT kolekcijama (Creation Loose Lay i Saga). Format: ploče 50x50cm. 100% bojen najlon (Solution Dyed). Težina vlakna: 540 g/m². Klasa 33 za intenzivnu komercijalnu upotrebu."
    elif "ARMONIA 620" in collection.upper():
        return "Armonia 620 su strukturirane tekstilne ploče premium kvaliteta. Izrađene od 100% recikliranog i reciklabilnog najlonskog vlakna: Econyl®. Težina vlakna: 620 g/m². Dizajnirane za maksimalnu izdržljivost i estetski sklad u komercijalnim prostorima."
    return desc

def main():
    with open('carpet_consolidated.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    new_colors = []
    
    for item in data:
        collection = item.get('collection', '')
        name = item.get('productName', item.get('product_name', ''))
        code = item.get('colorCode', item.get('color_code', ''))
        
        # Determine slug
        slug = f"{collection.lower().replace(' ', '-')}-{name.lower().replace(' ', '-')}".replace('--', '-')
        
        # Download images
        img_name = download_file(item.get('mainImage', item.get('main_image')), 'public/images/products/carpet/')
        item['localImage'] = f"/images/products/carpet/{img_name}" if img_name else None
        
        # Download docs
        local_docs = []
        for doc in item.get('documentLinks', item.get('docs', [])):
            if isinstance(doc, str):
                doc_url = doc
                doc_title = "Technical Datasheet"
            else:
                doc_url = doc.get('url', doc.get('link'))
                doc_title = doc.get('title', 'Document')
                
            d_name = download_file(doc_url, 'public/documents/carpet/')
            if d_name:
                local_docs.append({
                    "title": doc_title,
                    "url": f"/documents/carpet/{d_name}"
                })
        
        # Map specs to Serbian
        spec_mapping = {
            "Overall thickness": "Ukupna debljina",
            "Surface yarn": "Sastav vlakna",
            "Format details": "Format",
            "Length": "Dužina",
            "Width": "Širina",
            "Unit/box": "Komada u kutiji",
            "LRV": "LRV",
            "NCS": "NCS",
            "Classification (BS EN 1307)": "Klasa upotrebe"
        }
        
        serbian_specs = {}
        for k, v in item.get('specifications', {}).items():
            label = spec_mapping.get(k, k)
            serbian_specs[label] = v

        # Create final object
        color_obj = {
            "name": name,
            "code": code,
            "collection": collection.lower().replace(' ', '-'),
            "slug": slug,
            "description": translate_desc(item.get('description', ''), collection),
            "image": item['localImage'],
            "characteristics": serbian_specs,
            "documents": local_docs,
            "specs": {
                "NCS": item.get('specifications', {}).get('NCS'),
                "LRV": item.get('specifications', {}).get('LRV'),
                "packaging": f"{item.get('specifications', {}).get('Unit/box', '24')} ploča u kutiji (6m²)"
            }
        }
        new_colors.append(color_obj)
        
    final_output = {"colors": new_colors}
    with open('public/data/carpet_tiles_complete.json', 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully processed {len(new_colors)} colors.")

if __name__ == "__main__":
    main()
