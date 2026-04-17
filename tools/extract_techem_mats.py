from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import re
import time
from collections import Counter, defaultdict
from copy import deepcopy
from datetime import datetime, timezone
from html import unescape
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, quote, urlencode, urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup, NavigableString, Tag
from PIL import Image, ImageOps, UnidentifiedImageError


REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_JSON = REPO_ROOT / "public" / "data" / "techem_mats.json"
SUPABASE_BUCKET_NAME = "product-images"
DEFAULT_SUPABASE_PROJECT_NAME = "podovi"

SITE_ROOT = "https://www.techem-wycieraczki.com.pl"
SITEMAP_URL = f"{SITE_ROOT}/page-sitemap.xml"
PAGES_API_URL = f"{SITE_ROOT}/wp-json/wp/v2/pages"
TECH_SHEETS_URL = f"{SITE_ROOT}/en/for-professionals/technical-data-sheets/"
MEDIA_API_URL = f"{SITE_ROOT}/wp-json/wp/v2/media"

USER_AGENT = "Mozilla/5.0 (compatible; PodoviBot/1.0; +https://www.podovi.online)"
GENERIC_PAGE_SUFFIXES = {
    "/en/no-access/",
    "/en/start-english/",
    "/en/products/",
    "/en/about-company/",
    "/en/projects/",
    "/en/contact/",
    "/en/privacy-policy/",
    "/en/seo-texts-on-the-home-page/",
    "/en/for-professionals/",
    "/en/for-professionals/order-a-free-sample/",
    "/en/for-professionals/installation-and-maintenance/",
    "/en/for-professionals/technical-data-sheets/",
    "/en/for-professionals/designing/",
    "/en/projects/projects-advertising-doormats/",
    "/en/projects/projects-aluminum-doormats/",
}

MANUAL_DUPLICATE_PREFERENCES = {
    "clean rubber premium": f"{SITE_ROOT}/en/products/aluminum-doormats/clean-rubber-premium-wklad-gumowy/",
    "clean scrub premium": f"{SITE_ROOT}/en/products/aluminum-doormats/wycieraczki-clean-system-premium/clean-scrub-premium-wklad-szczotkowy-2-2/",
    "clean ryps outdoor": f"{SITE_ROOT}/en/products/aluminum-doormats/wycieraczki-clean-system-standard-2/clean-ryps-outdoor-2/",
    "clean ryps outdoor outdoor": f"{SITE_ROOT}/en/products/aluminum-doormats/wycieraczki-clean-system-standard-2/clean-ryps-outdoor-2/",
}

EXACT_DUPLICATE_KEEP_SEPARATE = {
    "clean scrub premium",
}

TECH_SHEET_MANUAL_TARGETS = {
    "clean system ryps outdoor": ["clean ryps outdoor"],
    "clean ryps rubber edge": ["clean ryps edge", "clean rubber edge"],
    "clean ryps rubber scrub anoda": ["anodized aluminum design"],
    "steel grating": ["steel grids"],
}

LEGACY_ALIAS_TARGETS = {
    f"{SITE_ROOT}/en/clean-rubber-wide/": f"{SITE_ROOT}/en/products/external-wipers/wycieraczki-clean-system-wide-2-2/clean-rubber-wide-rubber-insert/",
}

MANUAL_CANONICAL_ALIASES = {
    f"{SITE_ROOT}/en/products/external-wipers/advertising-doormats/": f"{SITE_ROOT}/en/products/advertising-doormats/outdoor-advertising-doormats/",
    f"{SITE_ROOT}/en/products/external-wipers/wycieraczki-clean-system-standard-2-2/clean-rubber-rubber-liner/": f"{SITE_ROOT}/en/products/aluminum-doormats/wycieraczki-clean-system-standard-2/clean-rubber/",
    f"{SITE_ROOT}/en/products/external-wipers/wycieraczki-clean-system-standard-2-2/clean-rubber-scrub-rubber-and-brush-insert/": f"{SITE_ROOT}/en/products/aluminum-doormats/wycieraczki-clean-system-standard-2/clean-rubber-scrub/",
    f"{SITE_ROOT}/en/products/external-wipers/wycieraczki-clean-system-standard-2-2/clean-scrub-brush-insert/": f"{SITE_ROOT}/en/products/aluminum-doormats/wycieraczki-clean-system-standard-2/clean-scrub/",
    f"{SITE_ROOT}/en/products/external-wipers/wycieraczki-clean-system-wide-2-2/clean-rubber-wide-rubber-insert/": f"{SITE_ROOT}/en/products/aluminum-doormats/wycieraczki-clean-system-wide-2/clean-rubber-wide-wklad-gumowy/",
    f"{SITE_ROOT}/en/products/external-wipers/wycieraczki-clean-system-wide-2-2/clean-scrub-wide-brush-insert/": f"{SITE_ROOT}/en/products/aluminum-doormats/wycieraczki-clean-system-wide-2/clean-scrub-wide/",
}

FEATURED_MEDIA_CACHE: dict[int, str | None] = {}
TECHEM_IMAGE_VARIANT_SPECS: dict[str, dict[str, int]] = {
    "thumb": {"width": 192, "height": 192, "quality": 82},
    "card": {"width": 960, "height": 720, "quality": 86},
    "hero": {"width": 1600, "height": 1600, "quality": 90},
    "og": {"width": 1200, "height": 630, "quality": 88},
}
RESAMPLING_LANCZOS = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.LANCZOS


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        if key in os.environ and os.environ[key]:
            continue

        cleaned = value.strip()
        if len(cleaned) >= 2 and cleaned[0] == cleaned[-1] and cleaned[0] in {"'", '"'}:
            cleaned = cleaned[1:-1]

        os.environ[key] = cleaned.strip()


def resolve_supabase_config() -> dict[str, str]:
    load_env_file(REPO_ROOT / ".env.local")

    explicit_url = (os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or "").strip().rstrip("/")
    explicit_key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        or ""
    ).strip()

    if explicit_url and explicit_key:
        return {
            "url": explicit_url,
            "key": explicit_key,
            "ref": explicit_url.replace("https://", "").split(".supabase.co")[0],
        }

    access_token = (os.environ.get("SUPABASE_ACCESS_TOKEN") or "").strip()
    if not access_token:
        raise RuntimeError(
            "Missing NEXT_PUBLIC_SUPABASE_URL + SUPABASE key, and SUPABASE_ACCESS_TOKEN is not available."
        )

    preferred_ref = (os.environ.get("SUPABASE_PROJECT_REF") or "").strip()
    preferred_name = (os.environ.get("SUPABASE_PROJECT_NAME") or DEFAULT_SUPABASE_PROJECT_NAME).strip()
    management_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }

    projects_response = requests.get(
        "https://api.supabase.com/v1/projects",
        headers=management_headers,
        timeout=60,
    )
    projects_response.raise_for_status()
    projects = projects_response.json()

    target_project = next(
        (
            project
            for project in projects
            if (
                preferred_ref
                and (project.get("ref") == preferred_ref or project.get("id") == preferred_ref)
            )
            or (not preferred_ref and project.get("name") == preferred_name)
        ),
        None,
    )

    if not target_project:
        raise RuntimeError(f"Supabase project not found ({preferred_ref or preferred_name}).")

    project_ref = target_project.get("ref") or target_project.get("id")
    keys_response = requests.get(
        f"https://api.supabase.com/v1/projects/{project_ref}/api-keys",
        headers=management_headers,
        timeout=60,
    )
    keys_response.raise_for_status()
    keys = keys_response.json()
    service_role_key = next(
        (
            entry.get("api_key")
            for entry in keys
            if entry.get("name") == "service_role" and entry.get("api_key")
        ),
        None,
    )

    if not service_role_key:
        raise RuntimeError(f"No usable service_role key found for Supabase project {project_ref}.")

    return {
        "url": f"https://{project_ref}.supabase.co",
        "key": service_role_key,
        "ref": project_ref,
    }


def build_cache_bust_version(content: bytes) -> str:
    return hashlib.sha1(content).hexdigest()[:12]


def append_cache_bust(url: str, version: str | None = None) -> str:
    if not url:
        return url

    parsed = urlparse(url)
    query_items = [(key, value) for key, value in parse_qsl(parsed.query, keep_blank_values=True) if key != "v"]
    if version:
        query_items.append(("v", version))
    return urlunparse(parsed._replace(query=urlencode(query_items)))


def is_supabase_public_url(value: str, supabase_url: str) -> bool:
    return str(value or "").startswith(
        f"{str(supabase_url or '').rstrip('/')}/storage/v1/object/public/{SUPABASE_BUCKET_NAME}/"
    )


def infer_image_extension(image_url: str, content_type: str) -> str:
    suffix = Path(urlparse(image_url).path).suffix.lower()
    if suffix in {".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"}:
        return suffix

    content_type_map = {
        "image/avif": ".avif",
        "image/gif": ".gif",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/svg+xml": ".svg",
        "image/webp": ".webp",
    }
    return content_type_map.get((content_type or "").split(";")[0].strip().lower(), ".jpg")


def fetch_binary(image_url: str) -> tuple[bytes, str]:
    response = requests.get(
        image_url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
        timeout=120,
    )
    response.raise_for_status()
    return response.content, response.headers.get("Content-Type", "image/jpeg")


def upload_binary_to_supabase(
    supabase_config: dict[str, str],
    object_path: str,
    content: bytes,
    content_type: str,
) -> str:
    upload_url = (
        f"{supabase_config['url']}/storage/v1/object/"
        f"{SUPABASE_BUCKET_NAME}/{quote(object_path, safe='/')}"
    )
    headers = {
        "Authorization": f"Bearer {supabase_config['key']}",
        "apikey": supabase_config["key"],
        "x-upsert": "true",
        "Content-Type": content_type or "image/jpeg",
    }

    last_error: str | None = None
    for attempt in range(1, 5):
        response = requests.post(upload_url, headers=headers, data=content, timeout=120)
        if response.ok:
            return (
                f"{supabase_config['url']}/storage/v1/object/public/"
                f"{SUPABASE_BUCKET_NAME}/{quote(object_path, safe='/')}"
            )

        last_error = response.text[:500] or response.reason
        if attempt < 4:
            time.sleep(attempt * 1.5)

    raise RuntimeError(f"Supabase upload failed for {object_path}: {last_error or 'unknown error'}")

TECHEM_TOP_CATEGORY_TRANSLATIONS_SR = {
    "Advertising mats": "Reklamni otirači",
    "Aluminum mats": "Aluminijumski otirači",
    "Anodized aluminum mats – Design": "Anodizovani aluminijumski otirači – Design",
    "Anti-fatigue mats": "Antifatig podloge",
    "Indoor mats": "Unutrašnji otirači",
    "Outdoor mats": "Spoljašnji otirači",
    "Special mats": "Specijalne podloge",
    "Steel grids": "Čelične rešetke",
    "Trend Mats": "Trend Mats",
}

TECHEM_FAMILY_TRANSLATIONS_SR = {
    "Clean System Edge": "Clean System Edge",
    "Clean System Plus": "Clean System Plus",
    "Clean System Premium Doormats": "Clean System Premium otirači",
    "Clean System Standard Doormats": "Clean System Standard otirači",
    "Clean System Wide Doormats": "Clean System Wide otirači",
}

TECHEM_NAME_OVERRIDES_SR = {
    "logo-mats": "Logo Mats - reklamni otirači sa logotipom",
    "outdoor-advertising-doormats": "Spoljašnji reklamni otirači",
    "photo-mats": "Photo Mats - foto otirači",
    "clean-rubber-premium-wklad-gumowy": "Clean Rubber Premium",
    "clean-scrub-premium-wklad-szczotkowy-2": "Clean Scrub Premium",
    "clean-rubber-edge": "Clean Rubber Edge (Y profil)",
    "clean-ryps-edge": "Clean Ryps Edge (Y profil)",
    "clean-rubber-plus": "Clean Rubber Plus (EPDM)",
    "clean-ryps-plus": "Clean Ryps Plus (poliamidni umetak)",
    "clean-ryps-premium-wklad-tekstylny-2": "Clean Ryps Premium",
    "clean-scrub-premium-wklad-szczotkowy-2-2": "Clean Scrub Premium",
    "clean-eco-ryps": "Clean Eco Ryps (reciklirani poliamid)",
    "clean-rubber": "Clean Rubber (gumeni umetak)",
    "clean-rubber-scrub": "Clean Rubber-Scrub (gumeni i četkasti umetak)",
    "clean-ryps": "Clean Ryps (tekstilni umetak)",
    "clean-ryps-outdoor-2": "Clean Ryps Outdoor (spoljašnji tekstilni umetak)",
    "clean-ryps-rubber": "Clean Ryps-Rubber (tekstilni i gumeni umetak)",
    "clean-ryps-scrub": "Clean Ryps-Scrub (tekstilni i četkasti umetak)",
    "clean-scrub": "Clean Scrub (četkasti umetak)",
    "clean-system-strong": 'Clean System Strong (profil 2,5 mm)',
    "clean-rubber-wide-wklad-gumowy": "Clean Rubber Wide (gumeni umetak)",
    "clean-ryps-wide": "Clean Ryps Wide (tekstilni umetak)",
    "clean-scrub-wide": "Clean Scrub Wide (četkasti umetak)",
    "anodized-aluminum-mats-design": "Anodizovani aluminijumski otirači - Design",
    "komfort-soft-anti-fatigue-mats": "Antifatig podloga Komfort Soft",
    "anti-fatigue-mats-standard": "Antifatig podloga Standard",
    "comfort-design-anti-fatigue-mats": "Antifatig podloga - Komfort Design",
    "komfort-office-anti-fatigue-mats": "Antifatig podloga - Komfort Office",
    "komfort-safety-anti-fatigue-mats": "Antifatig podloga - Komfort Safety",
    "anti-fatigue-mats-standard-2": "Antifatig podloga - Komfort Standard",
    "clean-grosgrain-textile-insert": "Clean Ryps (tekstilni umetak)",
    "clean-ryps-wide-textile-insert": "Clean Ryps Wide (tekstilni umetak)",
    "clean-ryps-rubber-textile-and-rubber-insert": "Clean Ryps-Rubber (tekstilni i gumeni umetak)",
    "clean-ryps-scrub-textile-and-brush-insert": "Clean Ryps-Scrub (tekstilni i četkasti umetak)",
    "dirt-scraper": "Dirt Scraper otirač",
    "dualtone-mat": "DualTone otirač",
    "dualtone-strong": "DualTone Strong otirač",
    "onetone-mat": "OneTone otirač",
    "mesh-pattern": "Rešetkasti otirač",
    "antibacterial-sticky-mat": "Antibakterijska dekontaminaciona lepljiva podloga",
    "disinfection-mats": "Dezinfekcione podloge",
    "industrial-warning-mat-clean-high-visibility-mats": "Industrijske signalne podloge Clean High Visibility",
    "clean-wave-anti-slip-mat-rolls": "Protivklizne Clean Wave rolne",
    "clean-tile-modular-anti-slip-mat": "Modularna protivklizna Clean Tile podloga",
    "steel-gratings": "Čelične rešetke",
    "trend-mats": "Trend Mats",
}

TECHEM_SHORT_DESCRIPTION_OVERRIDES_SR = {
    "logo-mats": "Reklamni otirači sa logotipom za ulazne i prodajne zone.",
    "outdoor-advertising-doormats": "Spoljašnji reklamni otirači za brendiranje ulazne zone objekta.",
    "photo-mats": "Foto otirači visoke rezolucije za promotivne kampanje i brendiranje.",
    "anodized-aluminum-mats-design": "Anodizovani aluminijumski otirači za reprezentativne ulazne prostore.",
    "clean-eco-ryps": "Ekološki aluminijumski otirač sa ECONYL® tekstilnim umetkom.",
    "komfort-soft-anti-fatigue-mats": "Mekana antifatig podloga za radna mesta sa dugim stajanjem.",
    "anti-fatigue-mats-standard": "Standardna antifatig podloga za proizvodne i radne zone.",
    "comfort-design-anti-fatigue-mats": "Antifatig podloga sa personalizovanom štampom na površini.",
    "komfort-office-anti-fatigue-mats": "Antifatig podloga za kancelarijska i recepcijska radna mesta.",
    "komfort-safety-anti-fatigue-mats": "Industrijska antifatig podloga sa bezbednosnim fokusom.",
    "anti-fatigue-mats-standard-2": "Industrijska antifatig podloga za stojeća radna mesta.",
    "dirt-scraper": "Unutrašnji otirač za intenzivno uklanjanje prljavštine sa obuće.",
    "dualtone-mat": "Dvobojni najlonski otirač sa neklizajućom gumenom podlogom.",
    "dualtone-strong": "Otporniji dvobojni otirač za zone sa vrlo intenzivnim saobraćajem.",
    "onetone-mat": "Monohromatski najlonski otirač za zadržavanje prljavštine i vlage.",
    "mesh-pattern": "Spoljašnji rešetkasti otirač od prirodne gume sa prirodnom drenažom.",
    "antibacterial-sticky-mat": "Lepljiva dekontaminaciona podloga za kontrolisane i sterilne zone.",
    "disinfection-mats": "Dezinfekcione podloge za ulaze u objekte sa povišenim higijenskim zahtevima.",
    "industrial-warning-mat-clean-high-visibility-mats": "Signalne protivklizne podloge visoke vidljivosti za industrijske zone.",
    "clean-wave-anti-slip-mat-rolls": "Protivklizne rolne za mokre zone poput bazena i tuševa.",
    "clean-tile-modular-anti-slip-mat": "Modularna protivklizna podloga za bazene, tuševe i svlačionice.",
    "steel-gratings": "Vruće pocinkovane čelične rešetke za ulaze, fabrike i skladišta.",
    "trend-mats": "Dekorativni Trend Mats otirači razvijeni u saradnji sa grafičkim dizajnerima.",
}

TECHEM_DESCRIPTION_OVERRIDES_SR = {
    "logo-mats": "Logo Mats su reklamni otirači sa logotipom namenjeni kao trajni deo enterijera prodajnih, poslovnih i recepcijskih prostora. Pored promotivne funkcije, pomažu u održavanju čistoće zahvaljujući dobroj apsorpciji nečistoće i izdržljivoj konstrukciji od najlonskog vlakna i nitrilne gume. Pogodni su za objekte u kojima su vizuelni identitet brenda i svakodnevna funkcionalnost jednako važni.",
    "outdoor-advertising-doormats": "Spoljašnji reklamni otirači namenjeni su brendiranju ulaznih zona ispred objekta. Izrađeni su od veštačke trave na bazi poliamidne smole, otporni su na vremenske uslove i UV zračenje, a grafika se izrađuje Jet-Print postupkom u više standardnih boja. Pogodni su za objekte u kojima je važna vidljiva spoljašnja reklama uz osnovno zadržavanje prljavštine.",
    "photo-mats": "Photo Mats su foto otirači visoke rezolucije namenjeni kratkotrajnim promotivnim kampanjama, lansiranju proizvoda i brendiranju pultova, polica i podnih zona. Fokus je na vernoj reprodukciji fotografije ili vektorske grafike, dok funkcija čišćenja obuće nije primarna. Izrađuju se od poliesterskog netkanog sloja na podlozi od nitrilne gume.",
    "anodized-aluminum-mats-design": "Anodizovani aluminijumski otirači kombinuju savremen izgled i visoku otpornost na habanje, koroziju i intenzivnu upotrebu. Zahvaljujući anodizaciji, aluminijum dobija izraženiju dubinu tona i reprezentativnu završnu obradu, pa su ovi otirači odličan izbor za moderne enterijere, kancelarije, javne objekte i komercijalne prostore. Pored funkcionalnosti u ulaznoj zoni, mogu da budu i važan dekorativni akcenat celog prostora.",
    "clean-eco-ryps": "Clean Eco Ryps je aluminijumski otirač sa ekološkim tekstilnim umetkom od ECONYL® vlakna, materijala dobijenog reciklažom najlonskog otpada poput ostataka tekstila, starih tepiha i ribarskih mreža. Pored manjeg uticaja na životnu sredinu, sistem nudi dobru otpornost na habanje, upijanje vlage i dug vek trajanja u unutrašnjim ulaznim zonama sa većom frekvencijom pešaka. Podloge umetaka zasnovane su na CLARO formuli i projektovane su da budu dugotrajnije i fleksibilnije od klasičnih PVC rešenja.",
    "komfort-soft-anti-fatigue-mats": "Komfort Soft je meka antifatig podloga namenjena radnim mestima na kojima zaposleni dugo stoje. Površina pruža prijatan osećaj pod nogama i doprinosi rasterećenju mišića i zglobova tokom rada. Pogodna je za proizvodne, servisne i druge radne stanice gde je komfor prioritet.",
    "anti-fatigue-mats-standard": "Standard antifatig podloga smanjuje zamor koji nastaje pri dugotrajnom radu u stojećem položaju. Pomaže da se rasterete stopala, noge i leđa, a zahvaljujući izdržljivoj gumenoj konstrukciji pogodna je za svakodnevnu upotrebu u radnim zonama. Preporučuje se za proizvodne hale, radionice i druga mesta gde je potreban stabilan i dugotrajan oslonac.",
    "comfort-design-anti-fatigue-mats": "Komfort Design je antifatig podloga sa personalizovanom štampom na površini. Donosi rasterećenje mišića i zglobova, a istovremeno omogućava da radna zona ili prodajni prostor dobiju prepoznatljiv vizuelni identitet. Pogodna je za stojeća radna mesta na kojima su važni i komfor i brending.",
    "komfort-office-anti-fatigue-mats": "Komfort Office je antifatig podloga namenjena kancelarijskim, recepcijskim i pultnim radnim mestima. Povećava udobnost rada pri dužem stajanju i doprinosi rasterećenju kičme i zglobova. Dobar je izbor za savremena radna mesta sa fokusom na ergonomiju.",
    "komfort-safety-anti-fatigue-mats": "Komfort Safety je industrijska antifatig podloga namenjena radnim mestima na kojima se dugo stoji. Dizajnirana je da smanji opterećenje kičme i zglobova, a po potrebi može da se dopuni signalnom trakom radi bolje uočljivosti. Pogodna je za proizvodne i skladišne zone gde su komfor i bezbednost podjednako važni.",
    "anti-fatigue-mats-standard-2": "Komfort Standard je industrijska antifatig podloga za stojeća radna mesta. Pomaže da se smanji zamor tokom rada i pruža stabilan oslonac u zahtevnim radnim uslovima. Pogodna je za proizvodne linije, servisne zone i druga mesta sa dugotrajnim opterećenjem.",
    "dirt-scraper": "Dirt Scraper je univerzalni unutrašnji otirač namenjen intenzivnom uklanjanju prljavštine sa obuće. Struktura vlakana i reljefna površina efikasno zadržavaju suvu i vlažnu nečistoću, pa je pogodan za ulaze sa pojačanim saobraćajem. Dobar je izbor za poslovne, komercijalne i javne objekte.",
    "dualtone-mat": "DualTone je izdržljiv dvobojni otirač od kvalitetnog najlonskog vlakna sa neklizajućom gumenom podlogom. Specijalna struktura vlakna efikasno uklanja prašinu, pesak, prljavštinu i vlagu sa obuće, a termički stabilizovana vlakna doprinose dugotrajnom izgledu i dobroj apsorpciji. Pogodan je za unutrašnje ulazne zone sa redovnim pešačkim saobraćajem.",
    "dualtone-strong": "DualTone Strong je ojačana verzija DualTone otirača, namenjena zahtevnijim objektima i zonama sa intenzivnim saobraćajem. Kombinacija čvršćih i mekših vlakana omogućava efikasno uklanjanje grubih čestica i istovremeno zadržavanje vlage. Zahvaljujući robusnoj konstrukciji i gumenoj podlozi, dobar je izbor za veoma opterećene ulazne prostore.",
    "onetone-mat": "OneTone je univerzalni monohromatski otirač od kvalitetnog najlonskog vlakna sa neklizajućom gumenom podlogom. Efikasno zadržava pesak, prašinu, vlagu i druge nečistoće sa obuće, a otporna vlakna pomažu da otirač dugo zadrži dobar izgled. Namenjen je unutrašnjim ulaznim zonama u poslovnim i komercijalnim objektima.",
    "mesh-pattern": "Rešetkasti otirač od prirodne gume odlikuje se visokom trajnošću, otpornošću na habanje i dobrim radom u spoljašnjim uslovima. Otvorena struktura omogućava prirodnu drenažu i efikasno uklanjanje prljavštine sa obuće. Po potrebi se može dopuniti četkicama za još agresivnije čišćenje.",
    "antibacterial-sticky-mat": "Antibakterijska dekontaminaciona lepljiva podloga maksimalno smanjuje unošenje spoljne kontaminacije u kontrolisane prostore. Namenjena je sterilnim sobama, laboratorijama, bolničkim odeljenjima i drugim zonama sa visokim higijenskim zahtevima. Višeslojna lepljiva konstrukcija omogućava jednostavno obnavljanje radne površine uklanjanjem potrošenog sloja.",
    "disinfection-mats": "Dezinfekcione podloge namenjene su ulazima u kancelarije, proizvodne hale, prehrambene pogone i druge objekte u kojima je važna kontrola higijene. Koriste se sa odgovarajućim dezinfekcionim sredstvom i pomažu da se smanji unošenje patogena, bakterija, virusa i gljivica preko obuće ili prolaza vozila. Za efikasan rad potrebno je redovno održavanje, obnavljanje vlažnosti podloge i pravilno pozicioniranje na ulazu.",
    "industrial-warning-mat-clean-high-visibility-mats": "Clean High Visibility su signalne industrijske podloge visoke vidljivosti namenjene opasnim zonama, radnim mestima, stepeništima, skladištima i izlazima u nuždi. Otporne su na svetlost, habanje i klizanje, antistatične su i ne sadrže PVC. Individualizovana, visoko vidljiva štampa dodatno poboljšava bezbednost korisnika u zahtevnim prostorima.",
    "clean-wave-anti-slip-mat-rolls": "Clean Wave su protivklizne rolne namenjene mokrim zonama, kao što su bazeni, tuševi, svlačionice i druge vlažne površine. Izrađene su od 100% reciklabilne PET plastike i projektovane tako da omoguće dobro oticanje vode i sigurnije kretanje bosih stopala. Isporučuju se u rolni i pogodne su za pokrivanje većih površina.",
    "clean-tile-modular-anti-slip-mat": "Clean Tile je modularna protivklizna podloga otporna na UV zračenje, namenjena mokrim zonama poput bazena, tuševa i svlačionica. Smanjuje rizik od klizanja, prijatna je za bosa stopala i lako se prilagođava različitim oblicima i površinama. Ugrađeni spojni sistem omogućava brzo sklapanje bez dodatnih konektora.",
    "steel-gratings": "Vruće pocinkovane čelične rešetke usklađene su sa standardom DIN 50976 i namenjene su zahtevnim ulaznim zonama. Konstrukcija od nosećih i uvijenih šipki efikasno čisti obuću i točkove kolica, dok otvorena struktura zadržava veliku količinu peska i blata. Pogodne su za fabrike, skladišta, velike prodajne objekte i druge prostore sa intenzivnim saobraćajem.",
    "trend-mats": "Trend Mats kolekcija razvijena je u saradnji sa grafičkim umetnicima i namenjena je korisnicima koji žele dekorativan, savremen otirač za ulazni prostor. Pored atraktivnog vizuelnog identiteta, ovi otirači doprinose osnovnoj zaštiti enterijera od svakodnevne nečistoće. Pogodni su za stambene i poslovne prostore u kojima je važan izražen dizajnerski karakter.",
}

TECHEM_SPEC_LABEL_TRANSLATIONS_SR = {
    "Application": "Namena",
    "Applications": "Namena",
    "Approvals and certification": "Sertifikati i odobrenja",
    "Atesty i aprobaty": "Sertifikati i odobrenja",
    "Available colors": "Dostupne boje",
    "Available colours": "Dostupne boje",
    "Aesthetic": "Estetika",
    "Antibacterial compound": "Antibakterijska komponenta",
    "Certification": "Sertifikati i odobrenja",
    "Certifications": "Sertifikati i odobrenja",
    "Certificates and approvals": "Sertifikati i odobrenja",
    "Cleaning": "Čišćenje i održavanje",
    "Cleaning shoes": "Uklanjanje prljavštine sa obuće",
    "Colors": "Boje",
    "Colours": "Boje",
    "Corrosion Resistance": "Otpornost na koroziju",
    "Dimensions": "Dimenzije",
    "Dirt removal from shoes": "Uklanjanje prljavštine sa obuće",
    "Dirt removal properties": "Uklanjanje prljavštine sa obuće",
    "Dust absorption capacity": "Kapacitet upijanja prašine",
    "Durability": "Trajnost",
    "Footwear Cleaning": "Uklanjanje prljavštine sa obuće",
    "Grid mesh": "Mreža rešetke",
    "Height": "Visina",
    "How to clean": "Čišćenje i održavanje",
    "Imprinting – graphics reproduction": "Kvalitet reprodukcije štampe",
    "Installation method": "Način ugradnje",
    "Material": "Materijal",
    "Module dimensions": "Dimenzije modula",
    "Moisture absorption capacity": "Kapacitet upijanja vlage",
    "Operation temperature": "Temperaturni opseg upotrebe",
    "Placing": "Način ugradnje",
    "Primer": "Podloga",
    "Profile Finishes": "Završna obrada profila",
    "Resistance to temperatures": "Otpornost na temperaturu",
    "Resolution of graphic images": "Rezolucija grafike",
    "Size": "Dimenzije",
    "Sizes": "Dimenzije",
    "Special lengths": "Specijalne dužine",
    "Standard lengths": "Standardne dužine",
    "Standard widths with borders": "Standardne širine sa ivicom",
    "Standard widths without borders": "Standardne širine bez ivice",
    "Strength": "Mehanička otpornost",
    "Suggested type of graphic": "Preporučeni tip grafike",
    "Suggested type of graphics": "Preporučeni tip grafike",
    "Total height": "Ukupna visina",
    "Total weight": "Ukupna težina",
    "Wear Resistance": "Otpornost na habanje",
    "Weight": "Težina",
}

TECHEM_TEXT_EXACT_TRANSLATIONS_SR = {
    "Machine washable /60°C/": "Mašinsko pranje do 60 °C",
    "good": "dobro",
    "high": "visoka",
    "very high": "veoma visoka",
    "yes": "da",
    "vectors (logos)": "vektorska grafika (logotipi)",
    "Pantone pallete": "Pantone paleta",
    "44 /visuals of samples/": "44 /prikaza uzoraka/",
    "gray | black | brown": "siva | crna | braon",
    "grey | black | brown": "siva | crna | braon",
    "Grey | Black | Brown": "siva | crna | braon",
    "Gray | Black | Brown": "siva | crna | braon",
    "grey | brown | black": "siva | braon | crna",
    "light gray | dark gray | brown": "svetlosiva | tamnosiva | braon",
    "light | graydark | graybrown": "svetlosiva | tamnosiva | braon",
    "White | Blue | Other colours available on request": "bela | plava | druge boje na upit",
    "Dark blue | Pastel blue | Grey": "tamnoplava | pastelno plava | siva",
    "yellow | green | red | blue | grey | black": "žuta | zelena | crvena | plava | siva | crna",
    "brown | blue | grey": "braon | plava | siva",
    "synthetic fibre printed using the Jet-Print process | backing made of 100% nitrile rubber": "sintetičko vlakno sa Jet-Print štampom | podloga od 100% nitrilne gume",
    "fixed component of interior décor": "stalan deo unutrašnjeg uređenja",
    "fixed element of the store décor": "stalan element uređenja prodajnog prostora",
    "short promotional campaigns": "kratkotrajne promotivne kampanje",
    "excellent": "odlično",
    "photos | images | vectors": "fotografije | ilustracije | vektorska grafika",
    "no": "ne",
    "average": "srednja",
    "Swimming pools | Showers | Changing rooms | Wet zones": "bazeni | tuševi | svlačionice | mokre zone",
    "Danger zones | Workplaces | Emergency exits | Staircases | Warehouses": "opasne zone | radna mesta | izlazi u nuždi | stepeništa | skladišta",
    "Sterile rooms | Hospital wards | Operating rooms | Laboratories | Intensive Care Wards | Industrial zones": "sterilne sobe | bolnička odeljenja | operacione sale | laboratorije | jedinice intenzivne nege | industrijske zone",
    "in a recess of appropriate depth | on the surface using a profiled aluminum frame": "u kanal odgovarajuće dubine | na površinu uz profilisani aluminijumski ram",
    "In a recess of appropriate depth | On the surface using a profiled aluminum frame": "u kanal odgovarajuće dubine | na površinu uz profilisani aluminijumski ram",
    "in the gully of the proper depth | on the substrate, in a profiled aluminium frame": "u kanal odgovarajuće dubine | na podlogu, u profilisanom aluminijumskom ramu",
    "indoorsabove + 5°C": "unutrašnja upotreba iznad +5 °C",
    "indoors | above + 5°C": "unutrašnja upotreba | iznad +5 °C",
    "indoor use above +5°C": "unutrašnja upotreba iznad +5 °C",
    "from -40 °C to +70 °C": "od -40 °C do +70 °C",
    "from -30 °C to +60 °C": "od -30 °C do +60 °C",
    "above 5 °C.": "iznad +5 °C",
    "above 5 °C": "iznad +5 °C",
    "above +5 °C.": "iznad +5 °C",
    "above +5 °C": "iznad +5 °C",
    "preferably in a gully of proper depth or on the ground in an aluminium frame.": "po mogućstvu u kanal odgovarajuće dubine ili na pod u aluminijumskom ramu.",
    "preferably in a gully of proper depth or on the ground in an aluminium frame": "po mogućstvu u kanal odgovarajuće dubine ili na pod u aluminijumskom ramu",
    "preferably in a gully of proper dubina or on the pod in an aluminium frame": "po mogućstvu u kanal odgovarajuće dubine ili na pod u aluminijumskom ramu",
    "preferably in a gully of proper dubina ili on the pod in an aluminijumski ram": "po mogućstvu u kanal odgovarajuće dubine ili na pod u aluminijumskom ramu",
    "preferably in a gully; if it is not possible – on the ground in a rubber frame.": "po mogućstvu u kanal; ako to nije moguće - na pod u gumenom ramu.",
    "custom-made": "po meri",
    "Custom-made": "po meri",
    "customised": "po meri",
    "Suitable for indoor and outdoor spaces with temperatures ranging from -40°C to 70°C.": "Pogodno za unutrašnje i spoljašnje prostore u temperaturnom opsegu od -40 °C do +70 °C.",
    "indoors and outdoors from -40°C to 70°C": "unutrašnja i spoljašnja upotreba od -40 °C do +70 °C",
    "Washing in temperatures of up to 60°C | Drying in the drier at 60˚C": "pranje na temperaturama do 60 °C | sušenje u sušari na 60 °C",
    "Steam cleaning | Rinsing with water": "parenje | ispiranje vodom",
    "Pressurized water | Steam cleaning | Shaking | Brushing": "voda pod pritiskom | parenje | otresanje | četkanje",
    "mass-dyed nylon fiber | thermally stabilized High-Twist hair twist | bottom of the mat made of nitrile rubber without memory material": "maseno obojeno najlonsko vlakno | termički stabilizovan High-Twist uvoj vlakna | dno otirača od nitrilne gume bez memorijskog efekta",
    "type 6 nylon fibre, bulk-dyed | High-Twist hair curl, thermally fixed | bottom made of 100% nitrile rubber (without material memory)": "najlonsko vlakno tipa 6, maseno obojeno | High-Twist uvoj vlakna, termički stabilizovan | podloga od 100% nitrilne gume bez memorijskog efekta",
    "high-quality polypropylene fabric with a rubber and PVC backing": "kvalitetna polipropilenska tkanina sa gumenom i PVC podlogom",
    "granite DF-647 | dark brown DF-000": "granit DF-647 | tamnobraon DF-000",
    "black DF-665 | dark grey DF-740": "crna DF-665 | tamnosiva DF-740",
    "steel and black DF-681 | granite DF-647 | brown and black DF-676 | dark brown DF-000 | red and black DF-652 | dark grey DF-648 | blue and black DF-711 | beige and black DF-675 | pearl and black DF-646": "steel i crna DF-681 | granit DF-647 | braon i crna DF-676 | tamnobraon DF-000 | crvena i crna DF-652 | tamnosiva DF-648 | plava i crna DF-711 | bež i crna DF-675 | biser i crna DF-646",
    "in drum washing machines | extraction | using a washing vacuum cleaner": "u bubanj mašinama za pranje | ekstrakcijom | uz usisivač za pranje",
    "the mats can be vacuum cleaned, rinsed with running water and washed in 40º C without whirling, | then they should be hung or laid down until they are dry | do not bleach or dry in a drum dryer": "otirači se mogu usisavati, ispirati tekućom vodom i prati na 40 ºC bez centrifuge | zatim ih treba okačiti ili položiti dok se ne osuše | ne izbeljivati i ne sušiti u bubanj sušari",
    "Width 58 cm | Length 100 cm | Supplied in rolls, with the length of up to 5m | Built-in connector system provides perfect coverage of large surfaces": "širina 58 cm | dužina 100 cm | isporuka u rolni do 5 m dužine | ugrađeni spojni sistem omogućava potpuno pokrivanje velikih površina",
    "60 cm, 75 cm, 85 cm, 115 cm, | 150 cm and 200 cm": "60 cm | 75 cm | 85 cm | 115 cm | 150 cm | 200 cm",
    "3 cm smaller than for mats with borders (e.g. 57cm)": "3 cm manje nego kod otirača sa ivicom (npr. 57 cm)",
    "13 x 33 mmother: custom-made": "13 x 33 mm | drugo: po meri",
    "100 % Vinyl": "100 % vinil",
    "100% recyclable PET plastic": "100% reciklabilna PET plastika",
    "44 standard colours": "44 standardne boje",
    "hovering, beating, steam cleaning": "usisavanje | istresanje | parenje",
    "vectors": "vektorska grafika",
    "custom size": "po meri",
}

TECHEM_SECTION_TITLE_TRANSLATIONS_SR = {
    "It is characterised by high absorption of water and solid pollutants:": "Odlikuje se visokom apsorpcijom vode i čvrstih nečistoća:",
    "Types of Anodized Entrance Mats": "Tipovi anodizovanih ulaznih otirača",
    "Highlights": "Izdvojene karakteristike",
}

TECHEM_DOCUMENT_TITLE_REPLACEMENTS_SR = {
    "Steel Grating": "Čelična rešetka",
    "Wycieraczka Clean Eco Ryps": "Clean Eco Ryps (tekstilni umetak sa ECONYL® vlaknom)",
}

TECHEM_MANUAL_CHARACTERISTICS_SR = {
    "komfort-soft-anti-fatigue-mats": {
        "Tip": "Mekana antifatig podloga",
        "Namena": "Radna mesta sa dugotrajnim stajanjem | proizvodne i servisne stanice",
    },
    "anti-fatigue-mats-standard": {
        "Tip": "Standardna antifatig podloga",
        "Namena": "Proizvodne hale | radionice | opšte radne zone",
    },
    "comfort-design-anti-fatigue-mats": {
        "Tip": "Antifatig podloga sa personalizovanom štampom",
        "Namena": "Stojeća radna mesta | prodajne i promotivne zone sa brendingom",
    },
    "komfort-office-anti-fatigue-mats": {
        "Tip": "Kancelarijska antifatig podloga",
        "Namena": "Kancelarije | recepcije | pultna radna mesta",
    },
    "komfort-safety-anti-fatigue-mats": {
        "Tip": "Industrijska antifatig podloga",
        "Namena": "Proizvodne i skladišne zone | stojeća radna mesta",
    },
    "anti-fatigue-mats-standard-2": {
        "Tip": "Industrijska antifatig podloga",
        "Namena": "Proizvodne linije | servisne zone | dugotrajno stajanje",
    },
    "trend-mats": {
        "Tip": "Dizajnerski otirač",
        "Namena": "Dekorativni ulazni otirači za stambene i poslovne prostore",
        "Karakter": "Kolekcija razvijena u saradnji sa grafičkim umetnicima",
    },
    "steel-gratings": {
        "Tip": "Vruće pocinkovana čelična rešetka",
        "Namena": "Ulazi | fabrike | skladišta | veliki prodajni objekti",
    },
}

TECHEM_TEXT_REPLACEMENTS_SR = [
    ("Advertising mats with a logo are an excellent choice as a fixed component of store décor.", "Reklamni otirači sa logotipom odličan su izbor kao stalan deo uređenja prodajnog prostora."),
    ("Aluminum doormats with durable rubber inserts embedded in aluminum profiles.", "Aluminijumski otirači sa izdržljivim gumenim umecima ugrađenim u aluminijumske profile."),
    ("Aluminum doormats with durable brush inserts embedded in aluminum profiles.", "Aluminijumski otirači sa izdržljivim četkastim umecima ugrađenim u aluminijumske profile."),
    ("Aluminum doormats with textile cleaning inserts embedded in aluminum profiles.", "Aluminijumski otirači sa tekstilnim umecima za čišćenje ugrađenim u aluminijumske profile."),
    ("A mat with rubber tread surfaces and drying filling fitted in aluminium frames, divided by a Y-shaped profile.", "Otirač sa gumenim gaznim površinama i ispunom za sušenje ugrađenim u aluminijumske profile, podeljen Y-profilom."),
    ("A mat with drying tread surfaces fitted in aluminium frames, divided by a Y-shaped profile.", "Otirač sa isušujućim gaznim površinama ugrađenim u aluminijumske profile, podeljen Y-profilom."),
    ("A mat with rubber tread surfaces and drying filling fitted in aluminium frames.", "Otirač sa gumenim gaznim površinama i ispunom za sušenje ugrađenim u aluminijumske profile."),
    ("A mat with rubber tread surfaces fitted in aluminium frames.", "Otirač sa gumenim gaznim površinama ugrađenim u aluminijumske profile."),
    ("A mat with drying tread surfaces fitted in aluminium frames.", "Otirač sa isušujućim gaznim površinama ugrađenim u aluminijumske profile."),
    ("A mat with rubber tread surfaces and scrubbing brushes fitted in aluminium frames.", "Otirač sa gumenim gaznim površinama i četkastim umecima ugrađenim u aluminijumske profile."),
    ("A mat with scrubbing brushes fitted in aluminium frames.", "Otirač sa četkastim umecima ugrađenim u aluminijumske profile."),
    ("A mat with scrubbing brushes and drying filling fitted in aluminium frames.", "Otirač sa četkastim umecima i ispunom za sušenje ugrađenim u aluminijumske profile."),
    ("Indoor mats with rubber cleaning inserts and drying inserts embedded in aluminium profiles.", "Unutrašnji otirači sa gumenim umecima za čišćenje i isušujućim umecima ugrađenim u aluminijumske profile."),
    ("System mats with rubber cleaning inserts and brushes embedded in aluminium profiles.", "Sistemski otirači sa gumenim umecima za čišćenje i četkama ugrađenim u aluminijumske profile."),
    ("System mats with brush cleaning elements and drying inserts embedded in aluminium profiles.", "Sistemski otirači sa četkastim elementima za čišćenje i isušujućim umecima ugrađenim u aluminijumske profile."),
    ("System doormats with cleaning inserts embedded in wider aluminum profiles with 2.5 mm width dimension.", "Sistemski otirači sa umecima za čišćenje ugrađenim u šire aluminijumske profile širine 2,5 mm."),
    ("Aluminum doormats connected by stainless steel cables.", "Aluminijumski otirači povezani kablovima od nerđajućeg čelika."),
    ("Designed for entrances with high pedestrian traffic and manual transport and shopping carts (height 22 mm and 27 mm).", "Namenjeni za ulaze sa velikom frekvencijom pešaka i ručnim transportnim i kupovnim kolicima (visina 22 mm i 27 mm)."),
    ("Object doormats are characterized by high mechanical strength, resistance to moisture, corrosion and temperature changes.", "Otirače za objekte odlikuju visoka mehanička otpornost, kao i otpornost na vlagu, koroziju i temperaturne promene."),
    ("Mats made of aluminium profiles with a rubber insert.", "Otirači od aluminijumskih profila sa gumenim umetkom."),
    ("Mats made of aluminium profiles with a rep insert.", "Otirači od aluminijumskih profila sa tekstilnim umetkom."),
    ("Mats made of aluminium profiles with a brush insert.", "Otirači od aluminijumskih profila sa četkastim umetkom."),
    ("Profiles are connected using a rubber connector, which also acts as a shock absorber between the mat and the surface of the floor or gully.", "Profili su povezani gumenim spojnim elementom koji istovremeno deluje kao amortizer između otirača i poda ili kanala."),
    ("The aluminium profile of the Clean System Wide mat is 7.7 mm high.", "Aluminijumski profil Clean System Wide otirača visok je 7,7 mm."),
    ("The height of the profile, together with a rubber insert, is 12 mm.", "Visina profila zajedno sa gumenim umetkom iznosi 12 mm."),
    ("The height of the profile, together with a rubber insert, is 11 mm.", "Visina profila zajedno sa umetkom iznosi 11 mm."),
    ("The height of the profile, together with a rubber insert, is 14 mm.", "Visina profila zajedno sa umetkom iznosi 14 mm."),
    ("Such a design allows you to roll the mat easily for cleaning and transport.", "Takva konstrukcija omogućava lako rolanje otirača radi čišćenja i transporta."),
    ("Joined using stainless steel ropes.", "Spojeno sajlama od nerđajućeg čelika."),
    ("The drying filling is resistant to abrasion, crushing and it absorbs moisture.", "Ispuna za sušenje otporna je na habanje i gnječenje i upija vlagu."),
    ("The drying inserts are resistant to abrasion, kneading and they absorb moisture well.", "Ispune za sušenje otporne su na habanje i gnječenje i dobro upijaju vlagu."),
    ("Thanks to the combination of these elements, the mat helps to remove mud and snow from shoe soles easily.", "Zahvaljujući kombinaciji ovih elemenata, otirač lako uklanja blato i sneg sa đonova obuće."),
    ("The combination of both these elements allows you to clean and dry your shoes from mud, snow and moisture.", "Kombinacija oba elementa omogućava efikasno čišćenje i sušenje obuće od blata, snega i vlage."),
    ("Thanks to the combination of these elements, the mat helps to remove mud and snow from shoe soles easily, and it also makes the shoes dry.", "Zahvaljujući kombinaciji ovih elemenata, otirač lako uklanja blato i sneg sa đonova obuće i istovremeno pomaže da obuća ostane suva."),
    ("The whole system is connected using stainless steel ropes.", "Ceo sistem povezan je sajlama od nerđajućeg čelika."),
    ("The rubber inserts are highly abrasion-resistant and flexible, ensuring long-lasting performance and efficiency.", "Gumeni umeci su veoma otporni na habanje i fleksibilni, što obezbeđuje dug vek trajanja i pouzdane performanse."),
    ("The brush inserts effectively clean footwear, ensuring cleanliness and order in the most demanding locations.", "Četkasti umeci efikasno čiste obuću i pomažu da i najzahtevnije ulazne zone ostanu uredne."),
    ("Thanks to their design, these doormats are highly resistant to mechanical damage and heavy use.", "Zahvaljujući svojoj konstrukciji, ovi otirači su veoma otporni na mehanička oštećenja i intenzivnu upotrebu."),
    ("They are recommended for high-traffic areas, such as shopping centers, industrial facilities, or commercial spaces.", "Preporučuju se za zone sa intenzivnim saobraćajem, kao što su tržni centri, industrijski objekti i komercijalni prostori."),
    ("These doormats are ideal for entrances with high foot traffic and transport carts, especially in areas exposed to challenging conditions.", "Ovi otirači idealni su za ulaze sa velikom frekvencijom pešaka i transportnim kolicima, posebno u zahtevnim uslovima."),
    ("Clean Rubber Premium is the perfect solution for removing heavy debris, such as mud, sand, and other solid contaminants.", "Clean Rubber Premium je odlično rešenje za uklanjanje težih nečistoća, kao što su blato, pesak i druge čvrste čestice."),
    ("Clean Scrub Premium is an excellent solution for removing stubborn dirt, such as mud, sand, and small stones.", "Clean Scrub Premium je odlično rešenje za uklanjanje tvrdokorne prljavštine, kao što su blato, pesak i sitno kamenje."),
    ("Clean Ryps Premium stands out for its exceptional durability, excellent abrasion resistance, and effective moisture absorption.", "Clean Ryps Premium se izdvaja izuzetnom trajnošću, veoma dobrom otpornošću na habanje i efikasnim upijanjem vlage."),
    ("The cleaning inserts are designed for areas with high foot traffic and heavy loads, including transport and shopping carts.", "Umetci za čišćenje namenjeni su zonama sa velikom frekvencijom pešaka i većim opterećenjem, uključujući transportna i kupovna kolica."),
    ("They are ideal for use in both commercial spaces and prestigious indoor locations.", "Pogodni su za komercijalne prostore, kao i za reprezentativne unutrašnje enterijere."),
    ("The Clean System Premium aluminum mat profile has a height of 22 mm.", "Profil Clean System Premium aluminijumskog otirača visok je 22 mm."),
    ("High mechanical strength, resistance to moisture, corrosion and temperature changes.", "Odlikuje ga visoka mehanička otpornost, kao i otpornost na vlagu, koroziju i temperaturne promene."),
    ("High mechanical performance, resistance to humidity, corrosion and changes in temperature.", "Odlikuje ga visoka mehanička otpornost, kao i otpornost na vlagu, koroziju i temperaturne promene."),
    ("Intended for entrances where there is a high pedestrian traffic volume and where hand transport carts and shopping carts are used frequently (22 or 27 mm high) – only for indoor use.", "Predviđeno za ulaze sa velikom frekvencijom pešaka, gde se često koriste ručna transportna i kupovna kolica (visina 22 ili 27 mm) - samo za unutrašnju upotrebu."),
    ("Intended for entrances where there is a high pedestrian traffic volume and where hand transport carts and shopping carts are used frequently (22 or 27 mm high).", "Predviđeno za ulaze sa velikom frekvencijom pešaka, gde se često koriste ručna transportna i kupovna kolica (visina 22 ili 27 mm)."),
    ("Intended for entrances where there is a high pedestrian traffic volume and where hand transport carts and shopping carts are used frequently (22 mm high) – only for indoor use.", "Predviđeno za ulaze sa velikom frekvencijom pešaka, gde se često koriste ručna transportna i kupovna kolica (visina 22 mm) - samo za unutrašnju upotrebu."),
    ("Intended for entrances of high pedestrian traffic volume and where hand transport carts and shopping carts are used frequently (22 or 27 mm high) – only for indoor use.", "Predviđeno za ulaze sa velikom frekvencijom pešaka, gde se često koriste ručna transportna i kupovna kolica (visina 22 ili 27 mm) - samo za unutrašnju upotrebu."),
    ("Intended for entrances of high pedestrian traffic volume and where hand transport carts and shopping carts are used frequently (22 mm high) – only for indoor use.", "Predviđeno za ulaze sa velikom frekvencijom pešaka, gde se često koriste ručna transportna i kupovna kolica (visina 22 mm) - samo za unutrašnju upotrebu."),
    ("Intended for entrances of high pedestrian traffic volume and where hand transport carts and shopping carts are used frequently (only 22 mm high) – only for indoor use.", "Predviđeno za ulaze sa velikom frekvencijom pešaka, gde se često koriste ručna transportna i kupovna kolica (samo visina 22 mm) - samo za unutrašnju upotrebu."),
    ("Intended for entrances where there is a high pedestrian traffic volume and where hand transport carts and shopping carts are used frequently (only 22 mm high)", "Predviđeno za ulaze sa velikom frekvencijom pešaka, gde se često koriste ručna transportna i kupovna kolica (samo visina 22 mm)"),
    ("Intended for entrances with high pedestrian traffic and manual transport and shopping trolleys (22 or 27 mm high) – only for indoor use.", "Predviđeno za ulaze sa velikom frekvencijom pešaka i ručnim transportnim i kupovnim kolicima (visina 22 ili 27 mm) - samo za unutrašnju upotrebu."),
    ("Application: Designed for indoor spaces or covered areas with heavy pedestrian traffic.", "Namena: za unutrašnje prostore ili natkrivene zone sa velikom frekvencijom pešaka."),
    ("Application: Ideal for both indoor and outdoor entrance areas, especially in locations with challenging environmental conditions.", "Namena: za unutrašnje i spoljašnje ulazne zone, posebno na lokacijama sa zahtevnim spoljašnjim uslovima."),
    ("For indoor and outdoor use.", "Za unutrašnju i spoljašnju upotrebu."),
    ("They are characterised by high mechanical strength, resistance to moisture, corrosion and temperature changes.", "Odlikuje ih visoka mehanička otpornost, kao i otpornost na vlagu, koroziju i temperaturne promene."),
    ("Workstation anti-fatigue mat with soft yarn.", "Antifatig podloga za radna mesta sa mekanom površinom."),
    ("Anti-fatigue mat with customised print on the surface.", "Antifatig podloga sa personalizovanom štampom na površini."),
    ("Anti-fatigue mat for office premises.", "Antifatig podloga za kancelarijske prostore."),
    ("Anti-fatigue mat for industrial premises.", "Antifatig podloga za industrijske prostore."),
    ("Dirt Scraper mat is a universal solution for indoor use.", "Dirt Scraper otirač je univerzalno rešenje za unutrašnju upotrebu."),
    ("DualTone mat is an especially durable two-colour mat made of high-quality nylon fibre, with a non-slip rubber backing.", "DualTone je posebno izdržljiv dvobojni otirač od kvalitetnog najlonskog vlakna sa neklizajućom gumenom podlogom."),
    ("DualTone Strong Mat has been designed for demanding customers who need a resistant and durable mat in locations that are especially exposed to intense traffic.", "DualTone Strong je namenjen zahtevnim korisnicima kojima je potreban otporan i dugotrajan otirač za zone sa posebno intenzivnim saobraćajem."),
    ("OneTone Mat is a universal monochromatic mat made of high-quality nylon fibre, with a non-slip rubber backing.", "OneTone je univerzalni monohromatski otirač od kvalitetnog najlonskog vlakna sa neklizajućom gumenom podlogom."),
    ("The openwork mat is characterised by unique durability and high susceptibility to abrasion and temperature changes.", "Rešetkasti otirač odlikuju izuzetna trajnost i dobra otpornost na habanje i temperaturne promene."),
    ("Hot-dip galvanized steel grids compliant with the norm DIN 50976.", "Vruće pocinkovane čelične rešetke usklađene sa standardom DIN 50976."),
    ("Discover the new collection of Trend doormats, designed in collaboration with a group of graphic artists.", "Otkrijte novu kolekciju Trend otirača, razvijenu u saradnji sa grupom grafičkih umetnika."),
    ("Textile Anodized Mats (Ryps): Anodized aluminum profiles filled with high-quality textile inserts—ideal for absorbing moisture and fine debris.", "Tekstilni anodizovani otirači (Ryps): anodizovani aluminijumski profili sa kvalitetnim tekstilnim umecima - idealni za upijanje vlage i sitnih nečistoća."),
    ("Rubber Anodized Mats (Rubber): Robust anodized aluminum profiles with rubber inserts—excellent at handling coarse dirt and heavy foot traffic.", "Gumeni anodizovani otirači (Rubber): robusni anodizovani aluminijumski profili sa gumenim umecima - odlični za zadržavanje grube prljavštine i zone sa velikom frekvencijom pešaka."),
    ("Check out our projects >>", ""),
]

TECHEM_INLINE_REPLACEMENTS_SR = [
    (r"\bPhoto Matsare\b", "Photo Mats su"),
    (r"\bnitrite rubber\b", "nitrilna guma"),
    (r"\brep insert\b", "tekstilni umetak"),
    (r"\bECONYLU®\b", "ECONYL®"),
    (r"\bgrippers\b", "protivklizni oslonci"),
    (r"\bshopping carts\b", "kupovna kolica"),
    (r"\btransport carts\b", "transportna kolica"),
    (r"\bmanual transport carts\b", "ručna transportna kolica"),
    (r"\bshoe soles\b", "đonovi obuće"),
    (r"– only for indoor use\.", " - samo za unutrašnju upotrebu."),
    (r"\bindoor and outdoor entrance areas\b", "unutrašnje i spoljašnje ulazne zone"),
    (r"\bshopping centers\b", "tržni centri"),
    (r"\bindustrial facilities\b", "industrijski objekti"),
    (r"\bcommercial spaces\b", "komercijalni prostori"),
    (r"\bchallenging environmental conditions\b", "zahtevni spoljašnji uslovi"),
    (r"\bhigh foot traffic\b", "velika frekvencija pešaka"),
    (r"\bcovered areas\b", "natkriveni prostori"),
    (r"\bmud\b", "blato"),
    (r"\bsand\b", "pesak"),
    (r"\bstubborn dirt\b", "tvrdokorna prljavština"),
    (r"\bsmall stones\b", "sitno kamenje"),
    (r"\bmoist areas\b", "vlažne zone"),
    (r"\bwet zones\b", "mokre zone"),
    (r"\bswimming pools\b", "bazeni"),
    (r"\bshowers\b", "tuševi"),
    (r"\bchanging rooms\b", "svlačionice"),
    (r"\bunderfloor heating\b", "podno grejanje"),
    (r"\bdecontamination\b", "dekontaminaciona"),
    (r"\banti-slip\b", "protivklizna"),
    (r"\banti-fatigue\b", "antifatig"),
    (r"\banti-bacterial\b", "antibakterijska"),
    (r"\bPZH Certificate\b", "PZH sertifikat"),
    (r"\bITB Opinion\b", "ITB mišljenje"),
    (r"\bcertificate\b", "sertifikat"),
    (r"\bcertification\b", "sertifikat"),
    (r"\bopinion\b", "mišljenje"),
    (r"\baccording to\b", "prema"),
    (r"\bFire Resistance Class\b", "Klasa otpornosti na požar"),
    (r"\bAnti-slip Class\b", "Protivklizna klasa"),
    (r"\bslip resistance class\b", "protivklizna klasa"),
    (r"\bfire classification\b", "Klasa otpornosti na požar"),
    (r"\bflammability class\b", "Klasa zapaljivosti"),
    (r"\bmaterial test reports\b", "izveštaji o ispitivanju materijala"),
    (r"\bsystemic mats\b", "sistemski otirači"),
    (r"\bsystem mats\b", "sistemski otirači"),
    (r"\bSystem Doormats\b", "sistemski otirači"),
    (r"\bAluminum Doormats\b", "aluminijumski otirači"),
    (r"\baluminium mats\b", "aluminijumski otirači"),
    (r"\bclass\b", "klasa"),
    (r"\band\b", "i"),
    (r"\bor\b", "ili"),
    (r"\bsynthetic fibre\b", "sintetičko vlakno"),
    (r"\bprinted using the Jet-Print process\b", "sa Jet-Print štampom"),
    (r"\bbacking made of\b", "podloga od"),
    (r"\b100% nitrilna guma\b", "100% nitrilne gume"),
    (r"\baluminium frame\b", "aluminijumski ram"),
    (r"\baluminium matsFire Resistance Class\b", "aluminijumski otirači | Klasa otpornosti na požar"),
    (r"\bdeph\b", "dubina"),
    (r"\bgorund\b", "pod"),
    (r"\bmaks\.\b", "maksimalno"),
    (r"([0-9])°C", r"\1 °C"),
]

TECHEM_DOCUMENT_TEXT_REPLACEMENTS_SR = [
    ("(textile insert for outdoors)", "(tekstilni umetak za spoljašnju upotrebu)"),
    ("(textile insert with ECONYLU®)", "(tekstilni umetak sa ECONYL® vlaknom)"),
    ("(textile insert)", "(tekstilni umetak)"),
    ("(rubber insert)", "(gumeni umetak)"),
    ("(bristle insert)", "(četkasti umetak)"),
    ("(textile-rubber insert)", "(tekstilno-gumeni umetak)"),
    ("(textile and rubber insert)", "(tekstilni i gumeni umetak)"),
    ("(textile-bristle insert)", "(tekstilno-četkasti umetak)"),
    ("(rubber-bristle insert)", "(gumeno-četkasti umetak)"),
    ("(with Y profile)", "(sa Y-profilom)"),
]

TECHEM_UNLOCALIZED_PATTERNS = [
    r"\b is the perfect solution\b",
    r"\b is an excellent solution\b",
    r"\b stands out for its\b",
    r"\bThanks to their design\b",
    r"\bThey are characterised by high mechanical strength\b",
    r"\bThe brush inserts\b",
    r"\bThe rubber inserts\b",
    r"\bThese doormats\b",
    r"\bProfiles are connected\b",
    r"\bThe whole system is connected\b",
    r"\bA mat with\b",
    r"\bMats made of aluminium profiles\b",
    r"\bIntended for entrances\b",
    r"\bApplication:\b",
    r"\bpreferably in a gully\b",
    r"\bcustom-?made\b",
    r"\bCustom-made\b",
    r"\bcustomised\b",
    r"\bonly for indoor use\b",
]


def fetch_text(url: str, params: dict[str, Any] | None = None) -> str:
    response = requests.get(
        url,
        params=params,
        headers={"User-Agent": USER_AGENT},
        timeout=60,
    )
    response.raise_for_status()
    return response.text


def fetch_json(url: str, params: dict[str, Any] | None = None) -> Any:
    response = requests.get(
        url,
        params=params,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
        timeout=60,
    )
    response.raise_for_status()
    return response.json(), response.headers


def fetch_featured_media_image(media_id: int | None) -> str | None:
    if not media_id:
        return None

    if media_id in FEATURED_MEDIA_CACHE:
        return FEATURED_MEDIA_CACHE[media_id]

    try:
        response = requests.get(
            f"{MEDIA_API_URL}/{media_id}",
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()
    except Exception:
        FEATURED_MEDIA_CACHE[media_id] = None
        return None

    media_details = payload.get("media_details") or {}
    sizes = media_details.get("sizes") or {}
    candidates: list[tuple[int, str]] = []
    for size in sizes.values():
        source_url = size.get("source_url")
        width = int(size.get("width") or 0)
        if source_url:
            candidates.append((width, normalize_url(source_url)))

    source_url = payload.get("source_url")
    if source_url:
        candidates.append((int(media_details.get("width") or 0), normalize_url(source_url)))

    best = None
    if candidates:
        candidates.sort(key=lambda item: item[0], reverse=True)
        best = candidates[0][1]

    FEATURED_MEDIA_CACHE[media_id] = best
    return best


def clean_text(value: Any) -> str:
    text = unescape(str(value or ""))
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_url(url: str) -> str:
    joined = urljoin(SITE_ROOT, str(url or "").strip())
    parsed = urlparse(joined)
    path = re.sub(r"/{2,}", "/", parsed.path or "/")
    if re.search(r"/[^/]+\.[a-z0-9]{2,5}$", path, flags=re.I):
        normalized_path = path
    else:
        normalized_path = re.sub(r"/$", "", path) + "/"

    host = parsed.netloc or urlparse(SITE_ROOT).netloc
    host = re.sub(r"^www\.", "", host)
    if host == "techem-wycieraczki.com.pl":
        host = "www.techem-wycieraczki.com.pl"

    return parsed._replace(scheme="https", netloc=host, path=normalized_path, params="", query="", fragment="").geturl()


def slugify(value: str) -> str:
    slug = clean_text(value).lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug


def normalize_for_match(value: str) -> str:
    text = clean_text(value).lower()
    text = text.replace("–", "-").replace("—", "-")
    text = text.replace("&", " and ")
    text = text.replace("/", " ")
    text = re.sub(r"[\(\)\[\],.;:]", " ", text)
    text = re.sub(r"\b(doormats?|mats?)\b", " ", text)
    text = re.sub(r"\b(textile|insert|filling|liner|bristle|brush|with|construction|y|shaped|and)\b", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def choose_best_image_url(img: Tag) -> str | None:
    if img.parent and img.parent.name == "a" and img.parent.get("href"):
        href = img.parent.get("href", "")
        if re.search(r"\.(jpg|jpeg|png|webp|gif)(?:$|\?)", href, flags=re.I):
            return normalize_url(href)

    candidates: list[tuple[int, str]] = []
    srcset = img.get("srcset", "") or img.get("data-srcset", "")
    for part in srcset.split(","):
        piece = part.strip()
        if not piece:
            continue
        match = re.match(r"(.+?)\s+(\d+)w$", piece)
        if match:
            candidates.append((int(match.group(2)), normalize_url(match.group(1))))

    if candidates:
        candidates.sort(key=lambda item: item[0], reverse=True)
        return candidates[0][1]

    source = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
    if source:
        return normalize_url(source)

    return None


def truncate(value: str, limit: int = 240) -> str:
    if len(value) <= limit:
        return value
    cut = value[: limit - 1].rsplit(" ", 1)[0].rstrip(",.;:-")
    return (cut or value[: limit - 1]).rstrip() + "…"


def first_sentence(value: str) -> str:
    text = clean_text(value)
    if not text:
        return ""

    match = re.search(r"(.+?[.!?])(?:\s|$)", text)
    if match:
        return clean_text(match.group(1))

    return truncate(text, 240)


def localize_techem_category_name(value: str) -> str:
    text = clean_text(value)
    if not text:
        return ""

    return TECHEM_TOP_CATEGORY_TRANSLATIONS_SR.get(text, text)


def localize_techem_family_name(value: str) -> str:
    text = clean_text(value)
    if not text:
        return ""

    return TECHEM_FAMILY_TRANSLATIONS_SR.get(text, text)


def localize_techem_text(value: Any) -> str:
    text = clean_text(value)
    if not text:
        return ""

    if text in TECHEM_TEXT_EXACT_TRANSLATIONS_SR:
        return TECHEM_TEXT_EXACT_TRANSLATIONS_SR[text]

    localized = text
    for source, target in TECHEM_TEXT_REPLACEMENTS_SR:
        localized = localized.replace(source, target)

    for source, target in TECHEM_DOCUMENT_TEXT_REPLACEMENTS_SR:
        localized = localized.replace(source, target)

    for pattern, replacement in TECHEM_INLINE_REPLACEMENTS_SR:
        localized = re.sub(pattern, replacement, localized)

    if localized in TECHEM_TEXT_EXACT_TRANSLATIONS_SR:
        localized = TECHEM_TEXT_EXACT_TRANSLATIONS_SR[localized]

    localized = re.sub(r"\s+([,.;:])", r"\1", localized)
    localized = re.sub(r"\s{2,}", " ", localized)
    localized = localized.replace(" .", ".").replace(" ,", ",")
    localized = re.sub(r"\s+\|", " |", localized)
    return localized.strip()


def has_unlocalized_techem_copy(value: Any) -> bool:
    text = clean_text(value)
    if not text:
        return False

    return any(re.search(pattern, text, flags=re.I) for pattern in TECHEM_UNLOCALIZED_PATTERNS)


def localize_techem_characteristics(characteristics: dict[str, str]) -> dict[str, str]:
    localized: dict[str, str] = {}
    for label, value in characteristics.items():
        raw_label = clean_text(label)
        raw_value = clean_text(value)
        if not raw_label or not raw_value:
            continue

        localized_label = TECHEM_SPEC_LABEL_TRANSLATIONS_SR.get(raw_label, raw_label)
        localized_value = localize_techem_text(raw_value)
        if localized_label not in localized:
            localized[localized_label] = localized_value
        elif localized_value not in localized[localized_label]:
            localized[localized_label] = f"{localized[localized_label]} | {localized_value}"
    return localized


def localize_techem_details_sections(sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    localized_sections: list[dict[str, Any]] = []
    for section in sections:
        title = clean_text(section.get("title") or "")
        items = [localize_techem_text(item) for item in section.get("items", [])]
        items = [item for item in items if item]
        if not items:
            continue

        localized_sections.append(
            {
                "title": TECHEM_SECTION_TITLE_TRANSLATIONS_SR.get(title, localize_techem_text(title) or "Izdvojene karakteristike"),
                "items": items,
            }
        )
    return localized_sections


def localize_techem_documents(documents: list[dict[str, str]]) -> list[dict[str, str]]:
    localized_documents: list[dict[str, str]] = []
    for document in documents:
        title = clean_text(document.get("title") or "")
        localized_title = TECHEM_DOCUMENT_TITLE_REPLACEMENTS_SR.get(title, localize_techem_text(title) or "Dokument")
        localized_documents.append(
            {
                **document,
                "title": localized_title,
            }
        )
    return localized_documents


def localize_techem_product_name(product: dict[str, Any]) -> str:
    source_slug = clean_text(product.get("sourceSlug") or "")
    name = clean_text(product.get("name") or "")
    if source_slug in TECHEM_NAME_OVERRIDES_SR:
        return TECHEM_NAME_OVERRIDES_SR[source_slug]
    return localize_techem_text(name) or name


def localize_techem_product_copy(product: dict[str, Any]) -> dict[str, Any]:
    localized = deepcopy(product)
    source_slug = clean_text(localized.get("sourceSlug") or "")

    localized["name"] = localize_techem_product_name(localized)

    if localized.get("topCategory"):
        localized["topCategory"] = localize_techem_category_name(localized["topCategory"])

    if localized.get("family"):
        localized["family"] = localize_techem_family_name(localized["family"])

    if localized.get("catalogCategories"):
        localized["catalogCategories"] = sorted(
            {
                localize_techem_category_name(category)
                for category in localized.get("catalogCategories", [])
                if clean_text(category)
            }
        )

    description_override = TECHEM_DESCRIPTION_OVERRIDES_SR.get(source_slug)
    description = description_override or localize_techem_text(localized.get("description"))
    localized["description"] = description

    short_description = TECHEM_SHORT_DESCRIPTION_OVERRIDES_SR.get(source_slug)
    if not short_description:
        short_description = first_sentence(description)
    localized["shortDescription"] = truncate(short_description, 240)

    localized["featureBullets"] = [localize_techem_text(item) for item in localized.get("featureBullets", []) if localize_techem_text(item)]
    localized["detailsSections"] = localize_techem_details_sections(localized.get("detailsSections", []))
    localized["characteristics"] = localize_techem_characteristics(localized.get("characteristics", {}))
    for label, value in TECHEM_MANUAL_CHARACTERISTICS_SR.get(source_slug, {}).items():
        if label not in localized["characteristics"]:
            localized["characteristics"][label] = value
    localized["documents"] = localize_techem_documents(localized.get("documents", []))

    return localized


def is_cta_paragraph(tag: Tag, text: str) -> bool:
    classes = set(tag.get("class", []))
    parent_classes = set(tag.parent.get("class", [])) if isinstance(tag.parent, Tag) else set()
    if classes.intersection({"btn", "ask", "buy"}) or parent_classes.intersection({"btn", "ask", "buy"}):
        return True

    lowered = text.lower()
    if lowered in {"ask about the product", "buy in the store", "visit our e-shop", "download", "download the leaflet"}:
        return True

    if tag.find("a") and len(text.split()) <= 5 and ("shop" in lowered or "download" in lowered or "ask" in lowered):
        return True

    return False


def previous_context_title(tag: Tag) -> str | None:
    sibling = tag.previous_sibling
    while sibling is not None:
        if isinstance(sibling, NavigableString):
            sibling = sibling.previous_sibling
            continue

        if not isinstance(sibling, Tag):
            sibling = sibling.previous_sibling
            continue

        if sibling.name in {"h2", "h3", "h4", "h5", "h6"}:
            title = clean_text(sibling.get_text(" ", strip=True))
            return title or None

        if sibling.name == "p":
            title = clean_text(sibling.get_text(" ", strip=True))
            if 0 < len(title) <= 140:
                return title

        sibling = sibling.previous_sibling

    return None


def extract_paragraphs_and_bullets(soup: BeautifulSoup) -> tuple[list[str], list[str]]:
    paragraphs: list[str] = []
    bullets: list[str] = []

    for tag in soup.find_all(["blockquote", "p"]):
        text = clean_text(tag.get_text(" ", strip=True))
        if not text or is_cta_paragraph(tag, text):
            continue

        if "•" in text:
            parts = [clean_text(part) for part in text.split("•")]
            intro = parts[0] if parts and parts[0] else ""
            extra_bullets = [part for part in parts[1:] if part]
            if intro and intro != text:
                paragraphs.append(intro)
            bullets.extend(extra_bullets)
            continue

        paragraphs.append(text)

    deduped_paragraphs: list[str] = []
    seen_paragraphs: set[str] = set()
    for text in paragraphs:
        if text not in seen_paragraphs:
            seen_paragraphs.add(text)
            deduped_paragraphs.append(text)

    deduped_bullets: list[str] = []
    seen_bullets: set[str] = set()
    for text in bullets:
        if text not in seen_bullets:
            seen_bullets.add(text)
            deduped_bullets.append(text)

    return deduped_paragraphs, deduped_bullets


def extract_details_sections(soup: BeautifulSoup) -> list[dict[str, Any]]:
    sections: list[dict[str, Any]] = []
    seen: set[tuple[str | None, tuple[str, ...]]] = set()

    for list_tag in soup.find_all(["ul", "ol"]):
        if list_tag.find_parent("table"):
            continue

        items = [clean_text(li.get_text(" ", strip=True)) for li in list_tag.find_all("li", recursive=False)]
        items = [item for item in items if item]
        if not items:
            continue

        title = previous_context_title(list_tag)
        key = (title, tuple(items))
        if key in seen:
            continue

        seen.add(key)
        sections.append(
            {
                "title": title or "Highlights",
                "items": items,
            }
        )

    return sections


def extract_characteristics(soup: BeautifulSoup) -> dict[str, str]:
    characteristics: dict[str, str] = {}

    for table in soup.find_all("table"):
        for row in table.find_all("tr"):
            cells = row.find_all(["th", "td"], recursive=False)
            if len(cells) < 2:
                continue

            parts = [clean_text(cell.get_text(" | ", strip=True)) for cell in cells]
            parts = [part for part in parts if part]
            if len(parts) < 2:
                continue

            label = parts[0].strip(": ")
            value = " | ".join(parts[1:]).strip(": ")
            if not label or not value:
                continue

            if label.lower() in {"products", "for professionals"}:
                continue

            characteristics[label] = value

    return characteristics


def extract_images(soup: BeautifulSoup) -> list[str]:
    images: list[str] = []
    seen: set[str] = set()

    for img in soup.find_all("img"):
        best = choose_best_image_url(img)
        if not best:
            continue

        if "/polylang/" in best or "/themes/" in best:
            continue

        if best not in seen:
            seen.add(best)
            images.append(best)

    return images


def extract_page_documents_and_shop_url(soup: BeautifulSoup) -> tuple[list[dict[str, str]], str | None]:
    documents: list[dict[str, str]] = []
    shop_url: str | None = None
    seen_documents: set[str] = set()

    for anchor in soup.find_all("a", href=True):
        href = normalize_url(anchor["href"])
        text = clean_text(anchor.get_text(" ", strip=True))

        if ("/sklep/" in href or "/shop/" in href) and not shop_url:
            shop_url = href

        if ".pdf" not in href.lower():
            continue

        if href in seen_documents:
            continue

        seen_documents.add(href)
        title = text if text and text.lower() not in {"download", "download the leaflet"} else Path(urlparse(href).path).stem.replace("-", " ").replace("_", " ").title()
        documents.append(
            {
                "title": clean_text(title or "PDF document"),
                "url": href,
                "type": "pdf",
                "source": "product-page",
            }
        )

    return documents, shop_url


def load_all_pages() -> dict[str, dict[str, Any]]:
    page = 1
    pages: dict[str, dict[str, Any]] = {}

    while True:
        batch, headers = fetch_json(
            PAGES_API_URL,
            params={"per_page": 100, "page": page},
        )
        for item in batch:
            pages[normalize_url(item["link"])] = item

        total_pages = int(headers.get("X-WP-TotalPages", "1"))
        if page >= total_pages:
            break
        page += 1

    return pages


def load_sitemap_urls() -> list[str]:
    xml = fetch_text(SITEMAP_URL)
    soup = BeautifulSoup(xml, "xml")
    return [normalize_url(loc.get_text(strip=True)) for loc in soup.find_all("loc")]


def build_lineage(current_url: str, page_lookup: dict[str, dict[str, Any]]) -> dict[str, Any]:
    parsed = urlparse(current_url)
    path = parsed.path.strip("/").split("/")
    titles: list[str] = []
    urls: list[str] = []

    if len(path) >= 2 and path[0] == "en" and path[1] == "products":
        base = normalize_url(f"{SITE_ROOT}/en/products/")
        if base in page_lookup:
            titles.append(clean_text(BeautifulSoup(page_lookup[base]["title"]["rendered"], "html.parser").get_text(" ", strip=True)))
            urls.append(base)

        built = ["en", "products"]
        for segment in path[2:-1]:
            built.append(segment)
            ancestor = normalize_url(f"{SITE_ROOT}/{'/'.join(built)}/")
            item = page_lookup.get(ancestor)
            if not item:
                continue
            titles.append(clean_text(BeautifulSoup(item["title"]["rendered"], "html.parser").get_text(" ", strip=True)))
            urls.append(ancestor)

    return {
        "titles": titles,
        "urls": urls,
    }


def parse_product_page(url: str, page_lookup: dict[str, dict[str, Any]]) -> dict[str, Any]:
    item = page_lookup[url]
    title = clean_text(BeautifulSoup(item["title"]["rendered"], "html.parser").get_text(" ", strip=True))
    content_html = item["content"]["rendered"]
    soup = BeautifulSoup(content_html, "html.parser")

    paragraphs, bullets = extract_paragraphs_and_bullets(soup)
    details_sections = extract_details_sections(soup)
    characteristics = extract_characteristics(soup)
    images = extract_images(soup)
    if not images:
        featured_image = fetch_featured_media_image(item.get("featured_media"))
        if featured_image:
            images = [featured_image]
    documents, shop_url = extract_page_documents_and_shop_url(soup)
    lineage = build_lineage(url, page_lookup)

    description = " ".join(paragraphs).strip()
    short_description = truncate(paragraphs[0], 240) if paragraphs else ""
    content_fingerprint = clean_text(BeautifulSoup(content_html, "html.parser").get_text(" ", strip=True))
    path_parts = [part for part in urlparse(url).path.split("/") if part]
    is_direct_product = path_parts[:2] == ["en", "products"] and len(path_parts) == 3
    top_category = lineage["titles"][1] if len(lineage["titles"]) > 1 else (title if is_direct_product else None)
    family = lineage["titles"][2] if len(lineage["titles"]) > 2 else None

    return {
        "name": title,
        "url": url,
        "pageId": item["id"],
        "sourceSlug": urlparse(url).path.rstrip("/").split("/")[-1],
        "topCategory": top_category,
        "family": family,
        "lineage": lineage,
        "shortDescription": short_description,
        "description": description,
        "featureBullets": bullets,
        "detailsSections": details_sections,
        "characteristics": characteristics,
        "images": images,
        "heroImage": images[0] if images else None,
        "galleryImages": images,
        "documents": documents,
        "shopUrl": shop_url,
        "contentFingerprint": content_fingerprint,
    }


def canonical_preference_key(product: dict[str, Any]) -> tuple[int, int, int, int, str]:
    title_key = normalize_for_match(product["name"])
    preferred_url = MANUAL_DUPLICATE_PREFERENCES.get(title_key)
    url = product["url"]
    outdoor_bonus = 1 if "outdoor" in title_key and ("external-wipers" in url or "outdoor" in url) else 0
    interior_bonus = 1 if ("interior" in title_key or "indoor" in title_key) and "interior-wipers" in url else 0
    depth = len([segment for segment in urlparse(url).path.split("/") if segment])
    manual_bonus = 1 if preferred_url == url else 0
    return (manual_bonus, outdoor_bonus, interior_bonus, depth, url)


def build_product_slug(product: dict[str, Any]) -> str:
    source_slug = clean_text(product.get("sourceSlug") or "")
    if source_slug:
        return slugify(f"techem {source_slug}")

    path_parts = [part for part in urlparse(product["url"]).path.split("/") if part and part not in {"en", "products"}]
    return slugify("techem " + " ".join(path_parts))


def merge_documents(*document_lists: list[dict[str, str]]) -> list[dict[str, str]]:
    merged: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for docs in document_lists:
        for doc in docs:
            key = (doc["url"], doc.get("title", ""))
            if key in seen:
                continue
            seen.add(key)
            merged.append(doc)
    return merged


def merge_unique_strings(*values: list[str]) -> list[str]:
    merged: list[str] = []
    seen: set[str] = set()
    for items in values:
        for item in items:
            cleaned = clean_text(item)
            if not cleaned or cleaned in seen:
                continue
            seen.add(cleaned)
            merged.append(cleaned)
    return merged


def merge_detail_sections(
    primary_sections: list[dict[str, Any]],
    alias_sections: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    seen: set[tuple[str, tuple[str, ...]]] = set()

    for section in [*primary_sections, *alias_sections]:
        title = clean_text(section.get("title") or "Highlights")
        items = tuple(item for item in [clean_text(value) for value in section.get("items", [])] if item)
        if not items:
            continue

        key = (title, items)
        if key in seen:
            continue

        seen.add(key)
        merged.append(
            {
                "title": title,
                "items": list(items),
            }
        )

    return merged


def merge_characteristics(
    primary_characteristics: dict[str, str],
    alias_characteristics: dict[str, str],
) -> dict[str, str]:
    merged = dict(primary_characteristics)
    for label, value in alias_characteristics.items():
        clean_label = clean_text(label)
        clean_value = clean_text(value)
        if clean_label and clean_value and clean_label not in merged:
            merged[clean_label] = clean_value
    return merged


def lineage_key(lineage: dict[str, Any]) -> tuple[str, ...]:
    urls = lineage.get("urls") or []
    return tuple(clean_text(url) for url in urls if clean_text(url))


def merge_alias_product_into_canonical(
    canonical: dict[str, Any],
    alias: dict[str, Any],
) -> dict[str, Any]:
    alias_urls = [alias.get("url", ""), *(alias.get("alternateUrls") or [])]
    alias_titles = [alias.get("name", ""), *(alias.get("alternateTitles") or [])]

    canonical["alternateUrls"] = sorted(
        {
            url
            for url in [*(canonical.get("alternateUrls") or []), *alias_urls]
            if url and url != canonical.get("url")
        }
    )
    canonical["alternateTitles"] = sorted(
        {
            title
            for title in [*(canonical.get("alternateTitles") or []), *alias_titles]
            if title and title != canonical.get("name")
        }
    )

    canonical_source_ids = set(canonical.get("sourcePageIds") or [])
    alias_source_ids = set(alias.get("sourcePageIds") or [])
    if alias.get("pageId"):
        alias_source_ids.add(alias["pageId"])
    canonical["sourcePageIds"] = sorted(canonical_source_ids | alias_source_ids)

    lineages = list(canonical.get("lineages") or [])
    seen_lineages = {lineage_key(lineage) for lineage in lineages}
    for lineage in alias.get("lineages") or []:
        key = lineage_key(lineage)
        if key and key not in seen_lineages:
            seen_lineages.add(key)
            lineages.append(lineage)
    if alias.get("lineage"):
        key = lineage_key(alias["lineage"])
        if key and key not in seen_lineages:
            seen_lineages.add(key)
            lineages.append(alias["lineage"])
    canonical["lineages"] = lineages

    canonical["documents"] = merge_documents(canonical.get("documents", []), alias.get("documents", []))
    canonical["galleryImages"] = merge_unique_strings(canonical.get("galleryImages", []), alias.get("galleryImages", []))
    canonical["images"] = canonical["galleryImages"]
    if not canonical.get("heroImage") and alias.get("heroImage"):
        canonical["heroImage"] = alias["heroImage"]

    if len(clean_text(alias.get("description"))) > len(clean_text(canonical.get("description"))):
        canonical["description"] = alias["description"]
    if len(clean_text(alias.get("shortDescription"))) > len(clean_text(canonical.get("shortDescription"))):
        canonical["shortDescription"] = alias["shortDescription"]

    canonical["featureBullets"] = merge_unique_strings(canonical.get("featureBullets", []), alias.get("featureBullets", []))
    canonical["detailsSections"] = merge_detail_sections(canonical.get("detailsSections", []), alias.get("detailsSections", []))
    canonical["characteristics"] = merge_characteristics(
        canonical.get("characteristics", {}),
        alias.get("characteristics", {}),
    )

    return canonical


def collect_aliases(product: dict[str, Any]) -> set[str]:
    aliases = {normalize_for_match(product["name"])}
    aliases.add(normalize_for_match(product["name"].replace("–", "-")))
    aliases.add(normalize_for_match(re.sub(r"\([^)]*\)", " ", product["name"])))
    for lineage_title in product.get("lineage", {}).get("titles", []):
        aliases.add(normalize_for_match(lineage_title))
    return {alias for alias in aliases if alias}


def extract_technical_sheets() -> list[dict[str, str]]:
    html = fetch_text(TECH_SHEETS_URL)
    soup = BeautifulSoup(html, "html.parser")
    entries: list[dict[str, str]] = []
    seen_urls: set[str] = set()

    for anchor in soup.find_all("a", href=True):
        href = normalize_url(anchor["href"])
        text = clean_text(anchor.get_text(" ", strip=True))
        if ".pdf" not in href.lower():
            continue
        if text.lower() == "download":
            continue
        if href in seen_urls:
            continue
        seen_urls.add(href)
        entries.append(
            {
                "title": text,
                "url": href,
                "type": "pdf",
                "source": "technical-data-sheets",
            }
        )

    return entries


def attach_technical_sheets(products: list[dict[str, Any]], tech_sheets: list[dict[str, str]]) -> list[dict[str, str]]:
    alias_index: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    for product in products:
        for alias in collect_aliases(product):
            alias_index[alias].append(product)

    unmatched: list[dict[str, str]] = []
    for sheet in tech_sheets:
        normalized_title = normalize_for_match(sheet["title"])
        stripped_title = normalize_for_match(re.sub(r"\([^)]*\)", " ", sheet["title"]))
        targets = alias_index.get(normalized_title, [])

        if not targets and stripped_title != normalized_title:
            targets = alias_index.get(stripped_title, [])

        if not targets:
            manual_aliases = TECH_SHEET_MANUAL_TARGETS.get(normalized_title, [])
            if stripped_title != normalized_title:
                manual_aliases.extend(TECH_SHEET_MANUAL_TARGETS.get(stripped_title, []))
            for alias in manual_aliases:
                targets.extend(alias_index.get(alias, []))

        unique_targets = []
        seen_urls: set[str] = set()
        for target in targets:
            if target["url"] in seen_urls:
                continue
            seen_urls.add(target["url"])
            unique_targets.append(target)

        if not unique_targets:
            unmatched.append(sheet)
            continue

        for target in unique_targets:
            target["documents"] = merge_documents(target["documents"], [sheet])

    return unmatched


def normalize_techem_image_variants(raw_candidate: Any) -> dict[str, str]:
    if not isinstance(raw_candidate, dict):
        return {}

    variants: dict[str, str] = {}
    nested_variants = raw_candidate.get("variants")
    if isinstance(nested_variants, dict):
        for variant_name in TECHEM_IMAGE_VARIANT_SPECS:
            variant_url = clean_text(nested_variants.get(variant_name))
            if variant_url:
                variants[variant_name] = variant_url

    for variant_name in TECHEM_IMAGE_VARIANT_SPECS:
        variant_url = clean_text(raw_candidate.get(variant_name))
        if variant_url:
            variants[variant_name] = variant_url

    return variants


def normalize_techem_image_candidate(candidate: Any) -> dict[str, Any] | None:
    if isinstance(candidate, str):
        image_url = clean_text(candidate)
        return {"url": image_url, "variants": {}} if image_url else None

    if not isinstance(candidate, dict):
        return None

    image_url = clean_text(
        candidate.get("url")
        or candidate.get("src")
        or candidate.get("image")
        or candidate.get("image_url")
    )
    if not image_url:
        return None

    return {
        "url": image_url,
        "variants": normalize_techem_image_variants(candidate),
    }


def extract_techem_source_images(product: dict[str, Any]) -> list[dict[str, Any]]:
    raw_candidates = [
        product.get("heroImage"),
        *(product.get("galleryImages") or []),
        *(product.get("images") or []),
        product.get("image"),
        product.get("image_url"),
        product.get("thumbnail"),
        product.get("thumbnail_url"),
    ]

    unique_urls: list[str] = []
    normalized_images: list[dict[str, Any]] = []
    for candidate in raw_candidates:
        normalized_candidate = normalize_techem_image_candidate(candidate)
        image_url = normalized_candidate.get("url") if normalized_candidate else ""
        if image_url and image_url not in unique_urls:
            unique_urls.append(image_url)
            normalized_images.append(normalized_candidate)

    return normalized_images


def build_techem_image_object_path(
    product_slug: str,
    index: int,
    image_url: str,
    content_type: str,
    variant_name: str | None = None,
) -> str:
    parsed = urlparse(image_url)
    base_name = slugify(Path(parsed.path).stem) or f"image-{index + 1:02d}"
    extension = infer_image_extension(image_url, content_type)
    variant_prefix = f"{variant_name}-" if variant_name else ""
    return f"products/otiraci/{slugify(product_slug)}/{index + 1:02d}-{variant_prefix}{base_name}{extension}"


def build_techem_variant_binary(
    binary: bytes,
    variant_name: str,
    fallback_content_type: str,
) -> tuple[bytes, str]:
    spec = TECHEM_IMAGE_VARIANT_SPECS[variant_name]

    try:
        with Image.open(BytesIO(binary)) as source_image:
            prepared_image = ImageOps.exif_transpose(source_image)
            if prepared_image.mode != "RGB":
                prepared_image = prepared_image.convert("RGB")

            fitted_image = ImageOps.fit(
                prepared_image,
                (spec["width"], spec["height"]),
                method=RESAMPLING_LANCZOS,
                centering=(0.5, 0.5),
            )
            output_buffer = BytesIO()
            fitted_image.save(
                output_buffer,
                format="JPEG",
                quality=spec["quality"],
                optimize=True,
                progressive=True,
            )
            return output_buffer.getvalue(), "image/jpeg"
    except (UnidentifiedImageError, OSError, ValueError):
        return binary, fallback_content_type or "image/jpeg"


def upload_techem_images_to_supabase(products: list[dict[str, Any]], force_upload: bool = False) -> None:
    supabase_config = resolve_supabase_config()
    print(f"Uploading Techem images to Supabase ({supabase_config['ref']}/{SUPABASE_BUCKET_NAME})...")

    jobs: list[dict[str, Any]] = []
    normalized_sources_by_slug: dict[str, list[dict[str, Any]]] = {}

    for product in products:
        product_slug = str(product.get("slug") or "")
        source_images = extract_techem_source_images(product)
        normalized_sources_by_slug[product_slug] = source_images

        for index, image_entry in enumerate(source_images):
            image_url = str(image_entry.get("url") or "")
            existing_variants = image_entry.get("variants") or {}
            needs_original_upload = force_upload or not is_supabase_public_url(image_url, supabase_config["url"])
            variant_names = [
                variant_name
                for variant_name in TECHEM_IMAGE_VARIANT_SPECS
                if force_upload or not is_supabase_public_url(existing_variants.get(variant_name, ""), supabase_config["url"])
            ]

            if not needs_original_upload and not variant_names:
                continue

            jobs.append(
                {
                    "slug": product_slug,
                    "index": index,
                    "imageUrl": image_url,
                    "needsOriginalUpload": needs_original_upload,
                    "variantNames": variant_names,
                }
            )

    uploaded_assets: dict[tuple[str, int], dict[str, Any]] = {}
    if jobs:
        failures: list[str] = []

        def worker(job: dict[str, Any]) -> tuple[tuple[str, int], dict[str, Any]]:
            binary, content_type = fetch_binary(job["imageUrl"])
            uploaded_entry: dict[str, Any] = {"variants": {}}

            if job["needsOriginalUpload"]:
                object_path = build_techem_image_object_path(job["slug"], job["index"], job["imageUrl"], content_type)
                uploaded_url = upload_binary_to_supabase(supabase_config, object_path, binary, content_type)
                uploaded_entry["url"] = append_cache_bust(uploaded_url, build_cache_bust_version(binary))

            for variant_name in job["variantNames"]:
                variant_binary, variant_content_type = build_techem_variant_binary(binary, variant_name, content_type)
                object_path = build_techem_image_object_path(
                    job["slug"],
                    job["index"],
                    job["imageUrl"],
                    variant_content_type,
                    variant_name=variant_name,
                )
                uploaded_variant_url = upload_binary_to_supabase(
                    supabase_config,
                    object_path,
                    variant_binary,
                    variant_content_type,
                )
                uploaded_entry["variants"][variant_name] = append_cache_bust(
                    uploaded_variant_url,
                    build_cache_bust_version(variant_binary),
                )

            return (job["slug"], job["index"]), uploaded_entry

        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            future_map = {
                executor.submit(worker, job): job
                for job in jobs
            }

            completed = 0
            total = len(future_map)
            for future in concurrent.futures.as_completed(future_map):
                job = future_map[future]
                completed += 1
                try:
                    key, uploaded_entry = future.result()
                    uploaded_assets[key] = uploaded_entry
                except Exception as error:  # noqa: BLE001
                    failures.append(f"{job['slug']}[{job['index'] + 1}]: {error}")

                if completed % 25 == 0 or completed == total:
                    print(f"  Uploaded {completed}/{total} Techem images...")

        if failures:
            preview = "\n".join(failures[:10])
            raise RuntimeError(f"Techem Supabase upload failed for {len(failures)} image(s):\n{preview}")
    else:
        print("All Techem images already point to Supabase.")

    for product in products:
        product_slug = str(product.get("slug") or "")
        source_images = normalized_sources_by_slug.get(product_slug, [])
        mirrored_images: list[dict[str, Any]] = []

        for index, image_entry in enumerate(source_images):
            image_url = str(image_entry.get("url") or "")
            existing_variants = image_entry.get("variants") or {}
            uploaded_entry = uploaded_assets.get((product_slug, index), {})
            final_url = uploaded_entry.get("url") or (
                image_url
                if is_supabase_public_url(image_url, supabase_config["url"])
                else image_url
            )
            final_variants: dict[str, str] = {}

            for variant_name in TECHEM_IMAGE_VARIANT_SPECS:
                variant_url = uploaded_entry.get("variants", {}).get(variant_name) or existing_variants.get(variant_name)
                if not variant_url:
                    continue

                final_variants[variant_name] = (
                    variant_url
                    if is_supabase_public_url(variant_url, supabase_config["url"])
                    else variant_url
                )

            if not final_url:
                continue

            image_record: dict[str, Any] = {"url": final_url}
            if final_variants:
                image_record["variants"] = final_variants
            mirrored_images.append(image_record)

        product["images"] = mirrored_images
        product["galleryImages"] = mirrored_images
        if mirrored_images:
            product["heroImage"] = mirrored_images[0]


def build_dataset(upload_supabase: bool = False, force_upload: bool = False) -> dict[str, Any]:
    page_lookup = load_all_pages()
    sitemap_urls = load_sitemap_urls()
    english_urls = [url for url in sitemap_urls if "/en/" in url]
    product_tree_urls = [url for url in english_urls if "/en/products/" in url]
    product_tree_urls = sorted(set(url for url in product_tree_urls if url in page_lookup))

    terminal_candidates = [
        url
        for url in product_tree_urls
        if not any(other != url and other.startswith(url) for other in product_tree_urls)
    ]

    exclusions: list[dict[str, str]] = []
    raw_products: list[dict[str, Any]] = []
    for url in terminal_candidates:
        parsed = parse_product_page(url, page_lookup)
        if not parsed["description"] and not parsed["characteristics"] and not parsed["images"]:
            exclusions.append({"url": url, "reason": "empty-marketing-page"})
            continue

        if parsed["name"].lower() == "visit our e-shop":
            exclusions.append({"url": url, "reason": "marketing-shortcut"})
            continue

        raw_products.append(parsed)

    grouped: defaultdict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for product in raw_products:
        key = (normalize_for_match(product["name"]), hashlib.sha1(product["contentFingerprint"].encode("utf-8")).hexdigest())
        grouped[key].append(product)

    merged_products: list[dict[str, Any]] = []
    deduped_groups: list[dict[str, Any]] = []
    for (normalized_title, _fingerprint), group in grouped.items():
        if normalized_title in EXACT_DUPLICATE_KEEP_SEPARATE:
            for item in group:
                canonical = deepcopy(item)
                canonical["alternateUrls"] = []
                canonical["alternateTitles"] = []
                canonical["sourcePageIds"] = [canonical.pop("pageId")]
                canonical["lineages"] = [canonical.pop("lineage")]
                canonical.pop("contentFingerprint", None)
                canonical["slug"] = build_product_slug(canonical)
                merged_products.append(canonical)
            continue

        if len(group) == 1:
            canonical = deepcopy(group[0])
            canonical["alternateUrls"] = []
            canonical["alternateTitles"] = []
            canonical["sourcePageIds"] = [canonical.pop("pageId")]
            canonical["lineages"] = [canonical.pop("lineage")]
            canonical.pop("contentFingerprint", None)
            canonical["slug"] = build_product_slug(canonical)
            merged_products.append(canonical)
            continue

        canonical = deepcopy(sorted(group, key=canonical_preference_key, reverse=True)[0])
        alternates = [item for item in group if item["url"] != canonical["url"]]

        canonical["alternateUrls"] = sorted(item["url"] for item in alternates)
        canonical["alternateTitles"] = sorted({item["name"] for item in alternates if item["name"] != canonical["name"]})
        canonical["sourcePageIds"] = sorted({item["pageId"] for item in group})
        canonical["lineages"] = [canonical.pop("lineage")] + [item["lineage"] for item in alternates]
        canonical.pop("pageId", None)
        canonical.pop("contentFingerprint", None)
        canonical["slug"] = build_product_slug(canonical)
        merged_products.append(canonical)

        deduped_groups.append(
            {
                "reason": "exact-title-and-body-duplicate",
                "normalizedTitle": normalized_title,
                "canonicalUrl": canonical["url"],
                "mergedUrls": sorted(item["url"] for item in group if item["url"] != canonical["url"]),
            }
        )

    fingerprint_index: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    for product in raw_products:
        fingerprint = hashlib.sha1(product["contentFingerprint"].encode("utf-8")).hexdigest()
        fingerprint_index[fingerprint].append(product)

    merged_by_url = {product["url"]: product for product in merged_products}
    extra_aliases: list[dict[str, Any]] = []
    for url in english_urls:
        if url in product_tree_urls or url in GENERIC_PAGE_SUFFIXES or url not in page_lookup:
            continue

        normalized_url = normalize_url(url)
        manual_target_url = normalize_url(LEGACY_ALIAS_TARGETS.get(normalized_url, "")) if LEGACY_ALIAS_TARGETS.get(normalized_url) else None
        if manual_target_url and manual_target_url in merged_by_url:
            merged_target = merged_by_url[manual_target_url]
            if normalized_url not in merged_target["alternateUrls"]:
                merged_target["alternateUrls"].append(normalized_url)
                merged_target["alternateUrls"] = sorted(set(merged_target["alternateUrls"]))

            title = clean_text(BeautifulSoup(page_lookup[normalized_url]["title"]["rendered"], "html.parser").get_text(" ", strip=True))
            if title != merged_target["name"] and title not in merged_target["alternateTitles"]:
                merged_target["alternateTitles"].append(title)
                merged_target["alternateTitles"] = sorted(set(merged_target["alternateTitles"]))

            extra_aliases.append(
                {
                    "reason": "legacy-manual-alias",
                    "canonicalUrl": merged_target["url"],
                    "aliasUrl": normalized_url,
                }
            )
            continue

        item = page_lookup[normalized_url]
        title = clean_text(BeautifulSoup(item["title"]["rendered"], "html.parser").get_text(" ", strip=True))
        content_fingerprint = clean_text(BeautifulSoup(item["content"]["rendered"], "html.parser").get_text(" ", strip=True))
        if not title or not content_fingerprint:
            continue

        fingerprint_key = hashlib.sha1(content_fingerprint.encode("utf-8")).hexdigest()
        matches = fingerprint_index.get(fingerprint_key, [])
        if not matches:
            normalized_title = normalize_for_match(title)
            for candidate in raw_products:
                if normalize_for_match(candidate["name"]) != normalized_title:
                    continue
                if candidate["contentFingerprint"] == content_fingerprint:
                    matches.append(candidate)
        if not matches:
            continue

        best_match = sorted(matches, key=canonical_preference_key, reverse=True)[0]
        merged_target = merged_by_url.get(best_match["url"])
        if not merged_target:
            continue

        if normalized_url not in merged_target["alternateUrls"]:
            merged_target["alternateUrls"].append(normalized_url)
            merged_target["alternateUrls"] = sorted(set(merged_target["alternateUrls"]))

        if title != merged_target["name"] and title not in merged_target["alternateTitles"]:
            merged_target["alternateTitles"].append(title)
            merged_target["alternateTitles"] = sorted(set(merged_target["alternateTitles"]))

        extra_aliases.append(
            {
                "reason": "legacy-exact-content-alias",
                "canonicalUrl": merged_target["url"],
                "aliasUrl": normalized_url,
            }
        )

    merged_by_url = {product["url"]: product for product in merged_products}
    manual_alias_merges: list[dict[str, str]] = []
    merged_alias_urls: set[str] = set()
    for alias_url, canonical_url in MANUAL_CANONICAL_ALIASES.items():
        normalized_alias_url = normalize_url(alias_url)
        normalized_canonical_url = normalize_url(canonical_url)

        canonical_product = merged_by_url.get(normalized_canonical_url)
        alias_product = merged_by_url.get(normalized_alias_url)
        if not canonical_product or not alias_product:
            continue

        merge_alias_product_into_canonical(canonical_product, alias_product)
        manual_alias_merges.append(
            {
                "reason": "secondary-navigation-alias",
                "canonicalUrl": normalized_canonical_url,
                "aliasUrl": normalized_alias_url,
            }
        )
        merged_alias_urls.add(normalized_alias_url)

    if merged_alias_urls:
        merged_products = [product for product in merged_products if product["url"] not in merged_alias_urls]
        merged_by_url = {product["url"]: product for product in merged_products}

    tech_sheets = extract_technical_sheets()
    unmatched_tech_sheets = attach_technical_sheets(merged_products, tech_sheets)

    for product in merged_products:
        product["documents"] = sorted(product["documents"], key=lambda item: (item["source"], item["title"], item["url"]))
        product["galleryImages"] = product["galleryImages"]
        product["canonicalUrl"] = product["url"]
        catalog_categories = {lineage["titles"][1] for lineage in product["lineages"] if len(lineage["titles"]) > 1}
        if product.get("topCategory"):
            catalog_categories.add(product["topCategory"])
        product["catalogCategories"] = sorted(catalog_categories)

    merged_products = [localize_techem_product_copy(product) for product in merged_products]

    if upload_supabase:
        upload_techem_images_to_supabase(merged_products, force_upload=force_upload)

    merged_products.sort(key=lambda item: (item.get("topCategory") or "", item.get("family") or "", item["name"], item["url"]))

    category_counts = Counter((product.get("topCategory") or "Uncategorized") for product in merged_products)

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "site": "BP TECHEM MATS",
            "baseUrl": SITE_ROOT,
            "sitemap": SITEMAP_URL,
            "pagesApi": PAGES_API_URL,
            "technicalDataSheetsPage": TECH_SHEETS_URL,
        },
        "scrapeRules": [
            "Start from the public English page sitemap and keep published URLs under /en/products/ as the primary product tree.",
            "Treat terminal product-tree URLs as candidate products, then exclude empty marketing shortcuts such as Visit our e-shop.",
            "Merge only exact English duplicates where the normalized title and full rendered body match 1:1; keep alternate URLs and lineage paths on the canonical record.",
            "Collapse selected secondary-navigation aliases from /external-wipers/ onto the family-first canonical product when the supplier exposes the same system through two browse paths.",
            "Attach legacy English aliases outside /en/products/ only when their rendered body matches an existing product exactly.",
            "Extract descriptions from rendered body paragraphs and blockquotes, tables into characteristics, lists into detail sections, and content images into the gallery.",
            "Enrich products with technical data sheet PDFs only on high-confidence title matches or explicit manual mappings; leave lower-confidence sheets unmatched instead of forcing a wrong association.",
        ],
        "stats": {
            "englishUrlsInSitemap": len(english_urls),
            "productTreeUrls": len(product_tree_urls),
            "terminalProductCandidates": len(terminal_candidates),
            "excludedCandidates": len(exclusions),
            "exactDuplicateGroupsMerged": len(deduped_groups),
            "manualCanonicalAliasMerges": len(manual_alias_merges),
            "legacyAliasUrlsAttached": len(extra_aliases),
            "products": len(merged_products),
            "productsByTopCategory": dict(sorted(category_counts.items())),
        },
        "exclusions": exclusions,
        "dedupedGroups": deduped_groups,
        "manualCanonicalAliases": manual_alias_merges,
        "legacyAliases": extra_aliases,
        "unmatchedTechnicalDataSheets": unmatched_tech_sheets,
        "products": merged_products,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract the Techem English mats catalog into canonical JSON.")
    parser.add_argument("--output", type=Path, default=OUTPUT_JSON, help="Output JSON path.")
    parser.add_argument(
        "--upload-supabase",
        action="store_true",
        help="Upload mirrored Techem product images to the Supabase product-images bucket.",
    )
    parser.add_argument(
        "--force-upload",
        action="store_true",
        help="Re-upload all Techem product images even if they already point to Supabase.",
    )
    args = parser.parse_args()

    dataset = build_dataset(upload_supabase=args.upload_supabase, force_upload=args.force_upload)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "output": str(args.output),
                "products": dataset["stats"]["products"],
                "excludedCandidates": dataset["stats"]["excludedCandidates"],
                "exactDuplicateGroupsMerged": dataset["stats"]["exactDuplicateGroupsMerged"],
                "manualCanonicalAliasMerges": dataset["stats"]["manualCanonicalAliasMerges"],
                "legacyAliasUrlsAttached": dataset["stats"]["legacyAliasUrlsAttached"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
