# PLAN ZA SKREJPOVANJE VINIL PODOVA (Homogeni/Heterogeni)

## 📋 ANALIZA STRUKTURE

### 1. Category Stranice (Glavni linkovi)
- **Homogeneous**: `https://www.gerflor-cee.com/category/homogeneous-rolls-and-tiles`
  - 41 kolekcija
  - "Show more" paginacija
  
- **Heterogeneous**: `https://www.gerflor-cee.com/category/heterogeneous-rolls`
  - 43 kolekcije
  - "Show more" paginacija

### 2. Product Stranice (Kolekcije)
- Svaka kolekcija ima listu boja sa linkovima
- Linkovi formata: `/products/collection-name-color-code-number`
- Primeri:
  - `mipolam-accord-0301-louise-85860301` (homogeneous)
  - `nerok-55-0476-noma-miel-28130476` (heterogeneous)

### 3. Color Stranice (Individualne boje)
Svaka boja ima:
- **Osnovni podaci**: Name, Code, Slug, Collection
- **Slike**: Main image (CDN URL)
- **Opis**: Structured text sa sekcijama
- **Specifikacije**: 12+ characteristics (NCS, LRV, Dimension, Thickness, etc.)

## 🎯 PODACI KOJE TREBA IZVUĆI

### Za svaku boju:
```json
{
  "collection": "mipolam-accord",
  "collection_name": "MIPOLAM ACCORD",
  "type": "homogeneous", // ili "heterogeneous" - ZAPAMTI IZ KOJE URL skrejpujem!
  "code": "0301",
  "name": "LOUISE",
  "full_name": "0301 LOUISE",
  "slug": "mipolam-accord-0301-louise",
  "image_url": "...",
  "texture_url": null,
  "description": "...", // Full description sa sekcijama
  "dimension": "2 m X 20.0 m",
  "format": "2m roll",
  "overall_thickness": "2.00 mm",
  "characteristics": {
    "Dimenzije": "2 m X 20.0 m", // MUST BE FIRST
    "Ukupna debljina": "2.00 mm", // MUST BE SECOND
    "NCS": "1005-Y30R",
    "LRV": "64.4",
    "Format": "2m roll",
    "Tip instalacije": "Lepljenje",
    "Površinska obrada": "Evercare™",
    "Debljina sloja habanja": "2.00 mm",
    // ... ostale karakteristike
  }
}
```

## 🔍 STRATEGIJA SKREJPOVANJA

### Faza 1: Sakupljanje svih linkova
1. Otvori category stranicu (homogeneous/heterogeneous)
2. Klik "Show more" dok ima
3. Ekstraktuj sve `/products/` linkove (kolekcije)
4. Za svaku kolekciju, ekstraktuj sve color linkove sa stranice kolekcije

### Faza 2: Skrejpovanje svake boje
1. Otvori color stranicu
2. Ekstraktuj sve podatke (name, code, images, description, characteristics)
3. Dodaj `type: "homogeneous"` ili `type: "heterogeneous"` na osnovu izvornog URL-a
4. Snimi u JSON format

### Faza 3: Validacija i čišćenje
1. Proveri da li su svi obavezni podaci prisutni
2. Normalizuj characteristics (Dimenzije prvo, debljina drugo)
3. Validiraj slug format

## ⚠️ PAŽNJA
- **Dva linka sa 900+ boja**: Verovatno master liste sa svim bojama. Proveriti kako su organizovane.
- **Filter za type**: Dodati u frontend komponente za filtriranje po "homogeni" / "heterogeni"
