from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import re
import shutil
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any

import fitz
import numpy as np
from PIL import Image, ImageChops, ImageFilter
from rapidocr_onnxruntime import RapidOCR


REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_JSON = REPO_ROOT / 'public' / 'data' / 'wolflor_vinyl_colors.json'
OUTPUT_IMAGE_DIR = REPO_ROOT / 'public' / 'images' / 'wolflor'
OUTPUT_DOC_DIR = REPO_ROOT / 'public' / 'documents' / 'wolflor'

WC_CATEGORIES_URL = 'https://wolflor.cn/wp-json/wc/store/v1/products/categories?per_page=100'
WC_PRODUCTS_URL = 'https://wolflor.cn/wp-json/wc/store/v1/products'
SUPABASE_BUCKET_NAME = 'product-images'
DEFAULT_SUPABASE_PROJECT_NAME = 'podovi'
PDF_OCR_RENDER_SCALE = 1.9
PDF_CROP_RENDER_SCALE = 2.5
PDF_WHITE_THRESHOLD = 248
UPLOAD_CACHE_BUST_VERSION = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')

MAIN_CATEGORY_CONFIG = {
    23: {
        'type': 'Homogeni',
        'label': 'homogeneous',
        'description_prefix': 'homogena vinil kolekcija u rolnama',
        'extra_characteristics': {},
    },
    22: {
        'type': 'Heterogeni',
        'label': 'heterogeneous',
        'description_prefix': 'heterogena vinil kolekcija u rolnama',
        'extra_characteristics': {},
    },
    44: {
        'type': 'Heterogeni',
        'label': 'wood',
        'description_prefix': 'heterogena vinil kolekcija u rolnama sa dekorom drveta',
        'extra_characteristics': {
            'Dizajn': 'Drveni dekor',
        },
    },
}

PDF_EXPECTED_FILENAMES = [
    'ANDES-Wolflor.pdf',
    'ATLAS-WOLFLOR.pdf',
    'AURORA-Wolflor.pdf',
    'BAIKAL-Wolflor.pdf',
    'BERMUDA-Wolflor.pdf',
    'EVEREST-WOLFLOR.pdf',
    'ROCKIES-Wolflor.pdf',
]

PDF_SEARCH_DIRS = [
    Path.home() / 'Desktop',
    REPO_ROOT / 'input' / 'wolflor',
    REPO_ROOT / 'tmp' / 'wolflor',
]

ATTRIBUTE_LABEL_MAP = {
    'Type': 'Tip',
    'Format': 'Format',
    'Size': 'Dimenzije rolne',
    'Thickness': 'Ukupna debljina',
    'Wear': 'Otpornost na habanje',
    'Application': 'Namena',
    'Installation': 'Ugradnja',
    'Samples': 'Uzorci',
    'Certificate': 'Sertifikati',
}

PDF_ROW_LABEL_MAP = {
    'Type of flooring': 'Tip poda',
    'Material': 'Materijal',
    'Cover': 'Površinski sloj',
    'Flammability': 'Reakcija na vatru',
    'Sound': 'Zvučna izolacija',
    'Slip resistance': 'Protivkliznost',
    'Dynamic coefficient of friction': 'Dinamički koeficijent trenja',
    'Sheet width': 'Širina rolne',
    'Sheet length': 'Dužina rolne',
    'Overall thickness': 'Ukupna debljina',
    'Total weight': 'Ukupna masa',
    'Wear resistance': 'Otpornost na habanje',
    'Residual indentation': 'Ostatna deformacija',
    'Dimensional stability': 'Dimenzionalna stabilnost',
    'Color fastness': 'Postojanost boje',
    'Resistance to staining': 'Otpornost na fleke',
    'Electrical resistance': 'Električni otpor',
    'Antibacterial': 'Antibakterijska zaštita',
    'Domestic': 'Klasa upotrebe - stambeni',
    'Commercial': 'Klasa upotrebe - komercijalni',
    'Industrial': 'Klasa upotrebe - industrijski',
    'Castor Chair': 'Otpornost na točkiće stolica',
    'Underfloor Heating': 'Podno grejanje',
    'Chemical Resistance': 'Otpornost na hemikalije',
    'PHTHALATE FREE': 'Bez ftalata',
    'Optimal Indoor Air Quality': 'Kvalitet vazduha u enterijeru',
}


def fetch_json(url: str, extra_headers: dict[str, str] | None = None) -> Any:
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; PodoviBot/1.0; +https://www.podovi.online)',
        'Accept': 'application/json,text/plain,*/*',
    }
    if extra_headers:
        headers.update(extra_headers)

    request = urllib.request.Request(
        url,
        headers=headers,
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode('utf-8'))


def fetch_text(url: str, extra_headers: dict[str, str] | None = None) -> str:
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; PodoviBot/1.0; +https://www.podovi.online)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    if extra_headers:
        headers.update(extra_headers)

    request = urllib.request.Request(
        url,
        headers=headers,
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read().decode('utf-8', errors='ignore')


def fetch_binary(url: str, extra_headers: dict[str, str] | None = None) -> bytes:
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; PodoviBot/1.0; +https://www.podovi.online)',
        'Accept': 'image/jpeg,image/*,*/*;q=0.8',
    }
    if extra_headers:
        headers.update(extra_headers)

    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def strip_html(value: Any) -> str:
    text = unescape(str(value or ''))
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def slugify(value: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', String(value := value or '').lower())
    return re.sub(r'(^-|-$)', '', re.sub(r'-+', '-', slug))


def String(value: Any) -> str:
    return str(value or '')


def title_from_filename(path: Path) -> str:
    first = re.split(r'[-_]', path.stem)[0]
    return first.title()


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue

        key, value = line.split('=', 1)
        key = key.strip()
        if key in os.environ:
            continue

        cleaned = value.strip()
        if len(cleaned) >= 2 and cleaned[0] == cleaned[-1] and cleaned[0] in {"'", '"'}:
            cleaned = cleaned[1:-1]

        os.environ[key] = cleaned


def trim_white(image: Image.Image) -> Image.Image:
    background = Image.new(image.mode, image.size, 'white')
    diff = ImageChops.difference(image, background)
    bbox = diff.getbbox()
    if not bbox:
        return image
    return image.crop(bbox)


def save_image(image: Image.Image, output_path: Path) -> str:
    ensure_dir(output_path.parent)
    image.save(output_path, quality=92)
    return '/' + output_path.relative_to(REPO_ROOT / 'public').as_posix()


def run_ocr(ocr: RapidOCR, image: Image.Image):
    return ocr(np.array(image))


def extract_pdf_links(html: str) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    seen: set[str] = set()

    for href in re.findall(r'href="([^"]+\.pdf[^"]*)"', html, flags=re.I):
        clean_href = href.strip()
        if not clean_href or clean_href in seen:
            continue

        seen.add(clean_href)
        file_name = urllib.parse.unquote(clean_href.split('/')[-1]).split('?')[0]
        title = re.sub(r'[-_]+', ' ', re.sub(r'\.pdf$', '', file_name, flags=re.I)).strip().title()
        links.append({
            'title': title or 'PDF dokument',
            'url': clean_href,
        })

    return links


def normalize_code(raw_text: str) -> str | None:
    compact = re.sub(r'[^A-Za-z0-9]', '', raw_text or '').upper()
    if compact.startswith('WL') and compact[2:].isdigit() and len(compact) >= 7:
        return compact
    return None


def parse_size_to_dimensions(value: str) -> tuple[str | None, str | None]:
    text = strip_html(value)
    text = text.replace('MM', 'mm').replace('ML', 'm').replace(' mL', ' m')

    thickness_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:/|\|)?\s*(\d+(?:\.\d+)?)?\s*mm', text, flags=re.I)
    thickness = None
    if thickness_match:
        primary = thickness_match.group(1)
        secondary = thickness_match.group(2)
        thickness = f'{primary} mm' if not secondary else f'{primary} / {secondary} mm'

    width_match = re.search(r'(\d+(?:\.\d+)?)\s*m\s*x\s*(\d+(?:\.\d+)?)\s*m', text, flags=re.I)
    dimensions = None
    if width_match:
        dimensions = f"{width_match.group(1)} m x {width_match.group(2)} m"

    return thickness, dimensions


def translate_attribute_value(label: str, value: str) -> str:
    cleaned = strip_html(value)
    replacements = {
        'Glue Down': 'Lepljenje',
        'Free': 'Na upit',
        'Polyvinyl chloride': 'Polivinil-hlorid',
        'Non-Directional Homogeneous': 'Neusmereni homogeni vinil',
        'Directional Homogeneous': 'Usmereni homogeni vinil',
        'Homogeneous Floor': 'Homogeni vinil',
        'Heterogeneous': 'Heterogeni vinil',
        'Strengthen PUR': 'Ojačani PUR zaštitni sloj',
        'No stain': 'Bez trajnih fleka',
        'Level 1': 'Nivo 1',
        'Rolls': 'Rolna',
        'Roll': 'Rolna',
        'Group T': 'Group T',
    }
    return replacements.get(cleaned, cleaned)


def build_live_characteristics(parent_id: int, first_product: dict[str, Any]) -> dict[str, str]:
    attributes: dict[str, str] = {}

    for attribute in first_product.get('attributes', []):
        label = strip_html(attribute.get('name'))
        terms = ', '.join(
            strip_html(term.get('name'))
            for term in attribute.get('terms', [])
            if strip_html(term.get('name'))
        )
        if not label or not terms:
            continue

        mapped_label = ATTRIBUTE_LABEL_MAP.get(label, label)
        attributes[mapped_label] = translate_attribute_value(mapped_label, terms)

    type_value = MAIN_CATEGORY_CONFIG[parent_id]['type']
    attributes['Tip'] = type_value
    attributes['Format'] = attributes.get('Format') or 'Rolna'

    thickness, dimensions = parse_size_to_dimensions(attributes.get('Dimenzije rolne', ''))
    if thickness and 'Ukupna debljina' not in attributes:
        attributes['Ukupna debljina'] = thickness
    if dimensions:
        attributes['Dimenzije'] = dimensions

    for label, value in MAIN_CATEGORY_CONFIG[parent_id].get('extra_characteristics', {}).items():
        attributes[label] = value

    return attributes


def build_live_description(
    collection_name: str,
    parent_id: int,
    color_count: int,
    characteristics: dict[str, str],
) -> tuple[str, str]:
    prefix = MAIN_CATEGORY_CONFIG[parent_id]['description_prefix']
    application = characteristics.get('Namena', '').strip()
    application_text = f' za {application.lower()}' if application else ''
    short_description = f'{collection_name} je Wolflor {prefix} sa {color_count} dekora.'
    description = (
        f'{collection_name} je Wolflor {prefix}{application_text}. '
        f'Kolekcija sadrži {color_count} dekora i namenjena je prostorima gde su važni izdržljivost, lako održavanje i stabilne tehničke performanse.'
    )
    return short_description, description


def build_color_description(collection_name: str, code: str) -> str:
    return f'Dekor {code} iz kolekcije {collection_name}.'


def get_first_color_image(colors: list[dict[str, Any]]) -> str:
    for color in colors:
        image = String(color.get('image'))
        if image:
            return image
    return ''


def append_cache_bust(url: str) -> str:
    value = String(url)
    if not value:
        return value

    parsed = urllib.parse.urlsplit(value)
    query_items = [(key, current) for key, current in urllib.parse.parse_qsl(parsed.query, keep_blank_values=True) if key != 'v']
    query_items.append(('v', UPLOAD_CACHE_BUST_VERSION))
    return urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(query_items)))


def normalize_collection_image_to_color(
    collection: dict[str, Any],
    fallback_image: str | None = None,
) -> None:
    first_color_image = get_first_color_image(collection.get('colors', []))
    if first_color_image:
        collection['collection_image_url'] = first_color_image
    elif fallback_image:
        collection['collection_image_url'] = fallback_image


def normalize_collection_images_to_colors(collections: list[dict[str, Any]]) -> None:
    for collection in collections:
        normalize_collection_image_to_color(collection, String(collection.get('collection_image_url')))


def extract_product_code(product: dict[str, Any]) -> str:
    name = strip_html(product.get('name'))
    match = re.search(r'([A-Z]{1,4}\d{4,})\s*$', name.upper())
    if match:
        return match.group(1)

    slug = strip_html(product.get('slug'))
    slug_match = re.search(r'([a-z]{1,4}\d{4,})$', slug, flags=re.I)
    if slug_match:
        return slug_match.group(1).upper()

    words = name.split()
    return words[-1].upper() if words else name.upper()


def fetch_collection_products(category_id: int) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    page = 1

    while True:
        query = urllib.parse.urlencode({
            'category': str(category_id),
            'per_page': '100',
            'page': str(page),
        })
        batch = fetch_json(f'{WC_PRODUCTS_URL}?{query}')
        if not isinstance(batch, list) or not batch:
            break
        products.extend(batch)
        if len(batch) < 100:
            break
        page += 1

    return products


def build_live_collection(category: dict[str, Any]) -> dict[str, Any] | None:
    parent_id = int(category.get('parent') or 0)
    products = fetch_collection_products(int(category['id']))
    if not products:
        return None

    first_product = products[0]
    characteristics = build_live_characteristics(parent_id, first_product)
    short_description, description = build_live_description(
        strip_html(category['name']),
        parent_id,
        len(products),
        characteristics,
    )

    product_page_html = fetch_text(first_product['permalink'])
    documents = extract_pdf_links(product_page_html)
    collection_name = strip_html(category['name'])
    collection_slug = f"wolflor-{slugify(collection_name)}"
    fallback_collection_image_url = (
        category.get('image', {}).get('src')
        or (first_product.get('images') or [{}])[0].get('src')
        or ''
    )

    colors = []
    for product in products:
        code = extract_product_code(product)
        image_url = ((product.get('images') or [{}])[0]).get('src', '')
        colors.append({
            'code': code,
            'name': code,
            'slug': f'{collection_slug}-{slugify(code)}',
            'image': image_url,
            'description': build_color_description(collection_name, code),
            'documents': documents,
            'brandId': '11',
            'url': product.get('permalink'),
        })

    colors.sort(key=lambda item: item['code'])

    collection_image_url = get_first_color_image(colors) or fallback_collection_image_url

    return {
        'name': collection_name,
        'slug': collection_slug,
        'brandId': '11',
        'shortDescription': short_description,
        'description': description,
        'characteristics': characteristics,
        'collection_image_url': collection_image_url,
        'documents': documents,
        'url': category.get('permalink'),
        'colorCount': len(colors),
        'colors': colors,
    }


def render_pdf_page(document: fitz.Document, page_index: int, scale: float = PDF_OCR_RENDER_SCALE) -> Image.Image:
    page = document.load_page(page_index)
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    return Image.frombytes('RGB', [pixmap.width, pixmap.height], pixmap.samples)


def extract_pdf_dimension(page2_results: list[tuple[float, float, str]]) -> tuple[str | None, str | None]:
    for _cy, _cx, text in page2_results:
        lowered = text.lower().replace(' ', '')
        if 'dimension:' not in lowered:
            continue

        raw = text.replace('Dimension:', '').replace('dimension:', '').strip()
        raw = raw.replace('(T)', '').replace('(W)', '').replace('(L)', '')
        match = re.search(r'(\d+(?:\.\d+)?)\s*mm.*?(\d+(?:\.\d+)?)\s*m\s*x\s*(\d+(?:\.\d+)?)\s*m', raw, flags=re.I)
        if match:
            return f'{match.group(1)} mm', f'{match.group(2)} m x {match.group(3)} m'

    return None, None


def normalize_pdf_row_label(label: str) -> str:
    cleaned = strip_html(label)
    replacements = {
        'Dynamiccoefficientoffriction': 'Dynamic coefficient of friction',
        'Overallthickness': 'Overall thickness',
        'Wearresistance': 'Wear resistance',
        'Colorfastness': 'Color fastness',
        'Resisitance to staining': 'Resistance to staining',
        'CastorChair': 'Castor Chair',
        'Charcteristics': 'Characteristics',
    }

    for source, target in replacements.items():
        cleaned = cleaned.replace(source, target)

    cleaned = cleaned.replace('BACHRIAL', '').strip()
    return cleaned


def normalize_pdf_value(label: str, value: str) -> str:
    cleaned = strip_html(value)
    replacements = {
        'Bur-s1': 'Bfl-s1',
        'Br-s1': 'Bfl-s1',
        'B, - $1': 'Bfl-s1',
        '<100g/m3': '<100 ug/m3',
        'NOWAX': 'No wax',
        'NOPOLISH': 'No polish',
        'FORLIFE': 'For life',
        '100%RECYCLABLE': '100% reciklabilno',
    }

    for source, target in replacements.items():
        cleaned = cleaned.replace(source, target)

    return translate_attribute_value(label, cleaned)


def extract_pdf_characteristics(page2_image: Image.Image, page3_image: Image.Image, ocr: RapidOCR) -> dict[str, str]:
    page2_raw, _ = run_ocr(ocr, page2_image)
    page3_raw, _ = run_ocr(ocr, page3_image)

    page2_results: list[tuple[float, float, str]] = []
    for box, text, _score in page2_raw or []:
        xs = [point[0] for point in box]
        ys = [point[1] for point in box]
        page2_results.append((sum(ys) / len(ys), sum(xs) / len(xs), text))

    characteristics: dict[str, str] = {
        'Tip': 'Homogeni',
        'Format': 'Rolna',
    }

    thickness, dimensions = extract_pdf_dimension(page2_results)
    if thickness:
        characteristics['Ukupna debljina'] = thickness
    if dimensions:
        characteristics['Dimenzije'] = dimensions

    rows: dict[int, list[tuple[float, str]]] = {}
    for box, text, _score in page3_raw or []:
        xs = [point[0] for point in box]
        ys = [point[1] for point in box]
        cx = sum(xs) / len(xs)
        cy = sum(ys) / len(ys)
        if cx < 2100:
            continue
        bucket = round(cy / 30) * 30
        rows.setdefault(bucket, []).append((cx, text))

    for bucket in sorted(rows):
        ordered = sorted(rows[bucket], key=lambda item: item[0])
        label_parts = [normalize_pdf_row_label(text) for cx, text in ordered if 2200 <= cx <= 2600]
        value_parts = [strip_html(text) for cx, text in ordered if cx >= 3500]
        if not label_parts or not value_parts:
            continue

        source_label = ' '.join(part for part in label_parts if part).strip()
        if not source_label:
            continue
        if source_label in {'Characteristics', 'Safety criteria', 'Performance behaviour', 'Classification', 'Additional property'}:
            continue

        final_label = PDF_ROW_LABEL_MAP.get(source_label, source_label)
        final_value = normalize_pdf_value(final_label, ' '.join(part for part in value_parts if part).strip())
        if final_label and final_value:
            characteristics[final_label] = final_value

    if 'Otpornost na habanje' not in characteristics:
        characteristics['Otpornost na habanje'] = 'Group T'

    return characteristics


def extract_pdf_swatch_crop(page_image: Image.Image, label_bounds: tuple[int, int, int, int]) -> Image.Image:
    label_left, label_top, label_right, _label_bottom = label_bounds
    search_left = max(0, label_left - 220)
    search_top = max(0, label_top - 520)
    search_right = min(page_image.width, label_right + 420)
    search_bottom = max(1, label_top - 10)
    region = page_image.crop((search_left, search_top, search_right, search_bottom))

    region_array = np.array(region)
    non_white_mask = ((region_array < PDF_WHITE_THRESHOLD).any(axis=2)).astype('uint8') * 255
    mask_image = Image.fromarray(non_white_mask, mode='L')
    mask_image = mask_image.filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.MaxFilter(17))
    mask = np.array(mask_image) > 0

    seed_x = min(mask.shape[1] - 1, max(0, (label_right - search_left) - 10))
    seed_y = min(mask.shape[0] - 1, max(0, (label_top - search_top) - 120))

    if not mask[seed_y, seed_x]:
        found_seed: tuple[int, int] | None = None
        max_radius = min(max(mask.shape[0], mask.shape[1]), 260)
        for radius in range(1, max_radius + 1):
            for dy in range(-radius, radius + 1):
                for dx in range(-radius, radius + 1):
                    candidate_y = seed_y + dy
                    candidate_x = seed_x + dx
                    if (
                        0 <= candidate_x < mask.shape[1]
                        and 0 <= candidate_y < mask.shape[0]
                        and mask[candidate_y, candidate_x]
                    ):
                        found_seed = (candidate_x, candidate_y)
                        break
                if found_seed:
                    break
            if found_seed:
                seed_x, seed_y = found_seed
                break

    if not mask[seed_y, seed_x]:
        fallback_crop = trim_white(region)
        return fallback_crop

    queue = [(seed_x, seed_y)]
    seen = {(seed_x, seed_y)}
    component_xs: list[int] = []
    component_ys: list[int] = []

    while queue:
        current_x, current_y = queue.pop()
        component_xs.append(current_x)
        component_ys.append(current_y)

        for next_x, next_y in (
            (current_x + 1, current_y),
            (current_x - 1, current_y),
            (current_x, current_y + 1),
            (current_x, current_y - 1),
        ):
            if (
                0 <= next_x < mask.shape[1]
                and 0 <= next_y < mask.shape[0]
                and mask[next_y, next_x]
                and (next_x, next_y) not in seen
            ):
                seen.add((next_x, next_y))
                queue.append((next_x, next_y))

    component_left = max(0, min(component_xs) - 8)
    component_top = max(0, min(component_ys) - 8)
    component_right = min(region.width, max(component_xs) + 9)
    component_bottom = min(region.height, max(component_ys) + 9)
    smart_crop = region.crop((component_left, component_top, component_right, component_bottom))
    smart_crop = trim_white(smart_crop)

    if smart_crop.width < 160 or smart_crop.height < 160:
        fallback_crop = trim_white(region)
        return fallback_crop

    return smart_crop


def extract_pdf_colors(
    collection_slug: str,
    ocr_page_images: list[Image.Image],
    crop_page_images: list[Image.Image],
    ocr: RapidOCR,
) -> list[dict[str, Any]]:
    colors: list[dict[str, Any]] = []
    seen_codes: set[str] = set()
    color_output_dir = OUTPUT_IMAGE_DIR / 'colors' / collection_slug
    ensure_dir(color_output_dir)

    for ocr_page_image, crop_page_image in zip(ocr_page_images, crop_page_images):
        page_results, _ = run_ocr(ocr, ocr_page_image)
        scale_x = crop_page_image.width / max(1, ocr_page_image.width)
        scale_y = crop_page_image.height / max(1, ocr_page_image.height)
        for box, text, _score in page_results or []:
            code = normalize_code(text)
            if not code or code in seen_codes:
                continue

            xs = [point[0] for point in box]
            ys = [point[1] for point in box]
            scaled_bounds = (
                int(round(min(xs) * scale_x)),
                int(round(min(ys) * scale_y)),
                int(round(max(xs) * scale_x)),
                int(round(max(ys) * scale_y)),
            )
            crop = extract_pdf_swatch_crop(crop_page_image, scaled_bounds)
            if crop.width < 40 or crop.height < 40:
                continue

            image_url = save_image(crop, color_output_dir / f'{slugify(code)}.jpg')
            colors.append({
                'code': code,
                'name': code,
                'slug': f'{collection_slug}-{slugify(code)}',
                'image': image_url,
                'brandId': '11',
            })
            seen_codes.add(code)

    colors.sort(key=lambda item: item['code'])
    return colors


def build_pdf_collection(pdf_path: Path, ocr: RapidOCR) -> dict[str, Any]:
    collection_name = title_from_filename(pdf_path)
    collection_slug = f"wolflor-{slugify(collection_name)}"
    collection_output_dir = OUTPUT_IMAGE_DIR / 'collections'
    ensure_dir(collection_output_dir)

    document = fitz.open(pdf_path)
    try:
        if document.page_count < 3:
            raise RuntimeError(f'PDF {pdf_path.name} nema očekivane 3 strane.')

        page1 = render_pdf_page(document, 0, scale=PDF_OCR_RENDER_SCALE)
        page2_ocr = render_pdf_page(document, 1, scale=PDF_OCR_RENDER_SCALE)
        page3_ocr = render_pdf_page(document, 2, scale=PDF_OCR_RENDER_SCALE)
        page2_crop = render_pdf_page(document, 1, scale=PDF_CROP_RENDER_SCALE)
        page3_crop = render_pdf_page(document, 2, scale=PDF_CROP_RENDER_SCALE)
    finally:
        document.close()

    hero_crop = trim_white(page1.crop((0, 0, min(page1.width, 1500), page1.height)))
    hero_url = save_image(hero_crop, collection_output_dir / f'{collection_slug}.jpg')

    copied_pdf_path = OUTPUT_DOC_DIR / pdf_path.name
    ensure_dir(copied_pdf_path.parent)
    shutil.copy2(pdf_path, copied_pdf_path)
    document_url = '/' + copied_pdf_path.relative_to(REPO_ROOT / 'public').as_posix()

    characteristics = extract_pdf_characteristics(page2_ocr, page3_ocr, ocr)
    colors = extract_pdf_colors(collection_slug, [page2_ocr, page3_ocr], [page2_crop, page3_crop], ocr)

    short_description = f'{collection_name} je Wolflor homogena vinil kolekcija sa {len(colors)} dekora.'
    description = (
        f'{collection_name} je Wolflor homogena vinil kolekcija u rolnama preuzeta iz najnovijeg PDF kataloga. '
        f'Kolekcija sadrži {len(colors)} dekora i namenjena je prostorima gde su važni izdržljivost, lako održavanje i stabilne tehničke performanse.'
    )

    for color in colors:
        color['description'] = build_color_description(collection_name, color['code'])
        color['documents'] = [{'title': f'{collection_name} katalog', 'url': document_url}]

    collection_image_url = get_first_color_image(colors) or hero_url

    return {
        'name': collection_name,
        'slug': collection_slug,
        'brandId': '11',
        'shortDescription': short_description,
        'description': description,
        'characteristics': characteristics,
        'collection_image_url': collection_image_url,
        'documents': [{'title': f'{collection_name} katalog', 'url': document_url}],
        'url': None,
        'colorCount': len(colors),
        'colors': colors,
    }


def discover_pdf_files(explicit_pdf_dir: Path | None) -> list[Path]:
    search_dirs = [explicit_pdf_dir] if explicit_pdf_dir else PDF_SEARCH_DIRS
    discovered: list[Path] = []

    for file_name in PDF_EXPECTED_FILENAMES:
        found = next(
            (directory / file_name for directory in search_dirs if directory and (directory / file_name).exists()),
            None,
        )
        if found:
            discovered.append(found)

    return discovered


def resolve_supabase_config() -> dict[str, str]:
    load_env_file(REPO_ROOT / '.env.local')

    explicit_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    explicit_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if explicit_url and explicit_key:
        return {
            'url': explicit_url.rstrip('/'),
            'key': explicit_key,
            'ref': explicit_url.replace('https://', '').split('.supabase.co')[0],
        }

    access_token = os.environ.get('SUPABASE_ACCESS_TOKEN')
    if not access_token:
        raise RuntimeError(
            'Missing NEXT_PUBLIC_SUPABASE_URL + SUPABASE key, and SUPABASE_ACCESS_TOKEN is not available.'
        )

    preferred_ref = os.environ.get('SUPABASE_PROJECT_REF')
    preferred_name = os.environ.get('SUPABASE_PROJECT_NAME') or DEFAULT_SUPABASE_PROJECT_NAME
    management_headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json',
    }

    projects = fetch_json('https://api.supabase.com/v1/projects', extra_headers=management_headers)
    target_project = next(
        (
            project for project in projects
            if (
                preferred_ref
                and (project.get('ref') == preferred_ref or project.get('id') == preferred_ref)
            ) or (
                not preferred_ref
                and project.get('name') == preferred_name
            )
        ),
        None,
    )

    if not target_project:
        raise RuntimeError(f'Supabase project not found ({preferred_ref or preferred_name}).')

    project_ref = target_project.get('ref') or target_project.get('id')
    keys = fetch_json(
        f'https://api.supabase.com/v1/projects/{project_ref}/api-keys',
        extra_headers=management_headers,
    )
    service_role_key = next(
        (
            entry.get('api_key') for entry in keys
            if entry.get('name') == 'service_role' and entry.get('api_key')
        ),
        None,
    )

    if not service_role_key:
        raise RuntimeError(f'No usable service_role key found for Supabase project {project_ref}.')

    return {
        'url': f'https://{project_ref}.supabase.co',
        'key': service_role_key,
        'ref': project_ref,
    }


def is_supabase_public_url(value: str, supabase_url: str) -> bool:
    return String(value).startswith(f'{supabase_url}/storage/v1/object/public/{SUPABASE_BUCKET_NAME}/')


def read_image_bytes(image_value: str) -> bytes:
    if image_value.startswith('/'):
        local_path = REPO_ROOT / 'public' / image_value.lstrip('/')
        return local_path.read_bytes()

    return fetch_binary(image_value)


def upload_to_supabase(supabase_config: dict[str, str], object_path: str, content: bytes) -> str:
    upload_url = (
        f"{supabase_config['url']}/storage/v1/object/"
        f"{SUPABASE_BUCKET_NAME}/{urllib.parse.quote(object_path, safe='/')}"
    )
    headers = {
        'Authorization': f"Bearer {supabase_config['key']}",
        'apikey': supabase_config['key'],
        'x-upsert': 'true',
        'Content-Type': 'image/jpeg',
    }

    last_error: Exception | None = None
    for attempt in range(1, 5):
        try:
            request = urllib.request.Request(upload_url, data=content, headers=headers, method='POST')
            with urllib.request.urlopen(request, timeout=120):
                return (
                    f"{supabase_config['url']}/storage/v1/object/public/"
                    f"{SUPABASE_BUCKET_NAME}/{urllib.parse.quote(object_path, safe='/')}"
                )
        except Exception as error:  # noqa: BLE001
            last_error = error
            if attempt < 4:
                time.sleep(attempt * 1.5)

    raise RuntimeError(f'Supabase upload failed for {object_path}: {last_error}')


def upload_wolflor_images_to_supabase(collections: list[dict[str, Any]]) -> None:
    supabase_config = resolve_supabase_config()
    print(f"Uploading Wolflor images to Supabase ({supabase_config['ref']}/{SUPABASE_BUCKET_NAME})...")

    normalize_collection_images_to_colors(collections)

    jobs: list[tuple[str, dict[str, Any], dict[str, Any] | None, str, str]] = []
    for collection in collections:
        for color in collection.get('colors', []):
            color_image = String(color.get('image'))
            if not color_image or is_supabase_public_url(color_image, supabase_config['url']):
                continue

            jobs.append((
                'color',
                collection,
                color,
                color_image,
                f"products/vinyl/{collection['slug']}/{slugify(color.get('code') or color.get('slug'))}.jpg",
            ))

    if not jobs:
        print('All Wolflor images already point to Supabase.')
        return

    failures: list[str] = []

    def worker(image_value: str, object_path: str) -> str:
        content = read_image_bytes(image_value)
        return upload_to_supabase(supabase_config, object_path, content)

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        future_map = {
            executor.submit(worker, image_value, object_path): (target_type, collection, color)
            for target_type, collection, color, image_value, object_path in jobs
        }

        completed = 0
        total = len(future_map)
        for future in concurrent.futures.as_completed(future_map):
            target_type, collection, color = future_map[future]
            completed += 1
            try:
                uploaded_url = future.result()
                if color is not None:
                    color['image'] = append_cache_bust(uploaded_url)
            except Exception as error:  # noqa: BLE001
                target_label = collection['slug'] if target_type == 'collection' else color.get('slug', collection['slug'])
                failures.append(f'{target_type}:{target_label}: {error}')

            if completed % 50 == 0 or completed == total:
                print(f'  Uploaded {completed}/{total} Wolflor images...')

    if failures:
        preview = '\n'.join(failures[:10])
        raise RuntimeError(f'Wolflor Supabase upload failed for {len(failures)} image(s):\n{preview}')

    normalize_collection_images_to_colors(collections)


def cleanup_local_wolflor_images() -> None:
    if OUTPUT_IMAGE_DIR.exists():
        shutil.rmtree(OUTPUT_IMAGE_DIR, ignore_errors=True)


def build_live_collections() -> list[dict[str, Any]]:
    categories = fetch_json(WC_CATEGORIES_URL)
    collections = []

    for category in categories:
        parent_id = int(category.get('parent') or 0)
        if parent_id not in MAIN_CATEGORY_CONFIG:
            continue

        collection = build_live_collection(category)
        if collection:
            collections.append(collection)

    return sorted(collections, key=lambda item: item['name'].lower())


def merge_pdf_supplement(
    collections: list[dict[str, Any]],
    pdf_files: list[Path],
    ocr: RapidOCR,
) -> list[dict[str, Any]]:
    if not pdf_files:
        return collections

    existing_by_slug = {collection['slug']: collection for collection in collections}

    for pdf_path in pdf_files:
        pdf_collection = build_pdf_collection(pdf_path, ocr)
        existing = existing_by_slug.get(pdf_collection['slug'])
        if existing:
            existing_by_codes = {color['code']: color for color in existing.get('colors', [])}
            for color in pdf_collection['colors']:
                existing_by_codes[color['code']] = color

            existing['colors'] = sorted(existing_by_codes.values(), key=lambda item: item['code'])
            existing['colorCount'] = len(existing['colors'])
            existing['collection_image_url'] = pdf_collection['collection_image_url']
            existing['documents'] = pdf_collection['documents']
            existing['shortDescription'] = pdf_collection['shortDescription']
            existing['description'] = pdf_collection['description']
            existing['characteristics'] = {
                **existing.get('characteristics', {}),
                **pdf_collection.get('characteristics', {}),
            }
        else:
            collections.append(pdf_collection)
            existing_by_slug[pdf_collection['slug']] = pdf_collection

    return sorted(collections, key=lambda item: item['name'].lower())


def serialize_output(collections: list[dict[str, Any]]) -> None:
    ensure_dir(OUTPUT_JSON.parent)
    payload = {
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'source': 'Wolflor live catalog + PDF supplement',
        'collections': collections,
    }
    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')


def load_previous_output() -> list[dict[str, Any]]:
    if not OUTPUT_JSON.exists():
        return []

    try:
        payload = json.loads(OUTPUT_JSON.read_text(encoding='utf-8'))
    except Exception:  # noqa: BLE001
        return []

    collections = payload.get('collections')
    return collections if isinstance(collections, list) else []


def reuse_existing_supabase_urls(
    collections: list[dict[str, Any]],
    previous_collections: list[dict[str, Any]],
) -> None:
    previous_by_slug = {
        String(collection.get('slug')): collection
        for collection in previous_collections
        if String(collection.get('slug'))
    }

    for collection in collections:
        previous_collection = previous_by_slug.get(String(collection.get('slug')))
        if not previous_collection:
            continue

        previous_colors_by_code = {
            String(color.get('code')): color
            for color in previous_collection.get('colors', [])
            if String(color.get('code'))
        }

        for color in collection.get('colors', []):
            previous_color = previous_colors_by_code.get(String(color.get('code')))
            if not previous_color:
                continue

            previous_color_image = String(previous_color.get('image'))
            if previous_color_image and 'supabase.co/storage/v1/object/public/product-images/' in previous_color_image:
                color['image'] = previous_color_image

    normalize_collection_images_to_colors(collections)


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Extract Wolflor vinyl collections from the live catalog and supplement them with local PDFs.'
    )
    parser.add_argument('--pdf-dir', type=Path, default=None, help='Optional directory with Wolflor supplement PDFs.')
    parser.add_argument(
        '--upload-supabase',
        action='store_true',
        help='Upload Wolflor collection and color images to the Supabase product-images bucket.',
    )
    parser.add_argument(
        '--force-upload',
        action='store_true',
        help='Ignore previously generated Supabase image URLs and upload all Wolflor images again.',
    )
    args = parser.parse_args()

    print('Fetching live Wolflor collections...')
    collections = build_live_collections()
    print(f'Fetched {len(collections)} live collections.')

    pdf_files = discover_pdf_files(args.pdf_dir)
    if pdf_files:
        print(f'Found {len(pdf_files)} PDF supplements.')
        ocr = RapidOCR()
        collections = merge_pdf_supplement(collections, pdf_files, ocr)
    else:
        print('No PDF supplement files found. Continuing with live catalog only.')

    normalize_collection_images_to_colors(collections)

    if args.upload_supabase:
        if not args.force_upload:
            reuse_existing_supabase_urls(collections, load_previous_output())
        upload_wolflor_images_to_supabase(collections)
        cleanup_local_wolflor_images()

    serialize_output(collections)
    total_colors = sum(len(collection.get('colors', [])) for collection in collections)
    print(f'Wrote {len(collections)} collections and {total_colors} colors to {OUTPUT_JSON}')


if __name__ == '__main__':
    main()
