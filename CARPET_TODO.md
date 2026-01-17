# 📋 TEKSTILNE PLOČE (CARPET) - PLAN ZA DODAVANJE

**Datum:** 2026-01-18  
**Status:** Odloženo za sledeću iteraciju

---

## 🎯 ŠTA TREBA URADITI

### 1. Scraping podataka
- **Izvor:** https://www.gerflor-cee.com/category/carpet
- **Problem:** Gerflor koristi Akamai bot protection
- **Rešenje:** 
  - Koristiti browser automation (Selenium/Playwright)
  - Ili ručno eksportovati podatke
  - Ili koristiti Gerflor API ako postoji

### 2. Podaci koji trebaju:
Za svaki carpet proizvod:
- ✅ Naziv kolekcije
- ✅ Slug
- ✅ Opis (struktuiran sa sekcijama)
- ✅ Karakteristike:
  - Format
  - Dimenzije pločice
  - Debljina
  - Materijal
  - Tip instalacije
  - Klasa upotrebe
  - Protivpožarna klasifikacija
  - Zvučna izolacija (dB)
  - Težina (g/m²)
- ✅ Boje (sve boje u kolekciji)
- ✅ Slike (za svaku boju)
- ✅ Dokumenta (technical datasheet, installation guide, itd.)

### 3. Trenutno stanje:
Imamo 3 Armonia proizvoda u mock-data.ts:
- Gerflor Armonia 400
- Gerflor Armonia 540
- Gerflor Armonia 620

Ali nemaju:
- Detaljne opise
- Boje
- Kompletne karakteristike
- Slike

### 4. Sledeći koraci:
1. ✅ Kreirati scraper sa browser automation
2. ✅ Ekstraktovati sve carpet kolekcije
3. ✅ Ekstraktovati sve boje za svaku kolekciju
4. ✅ Preuzeti slike
5. ✅ Parsirati dokumenta (PDF-ove)
6. ✅ Kreirati carpet_colors_complete.json
7. ✅ Integrisati u sajt
8. ✅ Testirati

---

## 📝 NAPOMENA

**Za sada:** Fokusiram se na finalizaciju LVT i Linoleum proizvoda (99% gotovo).

**Sledeća iteracija:** Dodavanje carpet proizvoda sa svim detaljima kao što Gerflor ima.

**Prioritet:** LVT i Linoleum su gotovi i funkcionalni. Carpet će biti dodaće kasnije.

---

**Status:** TODO  
**Estimacija:** 4-6 sati rada (scraping + integracija + testiranje)
