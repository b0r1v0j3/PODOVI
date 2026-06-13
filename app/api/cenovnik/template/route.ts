import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { isValidSessionToken, CENOVNIK_COOKIE } from '@/lib/cenovnik/auth';
import { getColorsForCategory } from '@/lib/colors/get-colors';
import { categories, brands } from '@/lib/data/mock-data';
import { VAT_RATE } from '@/lib/cenovnik/vat';

export const runtime = 'nodejs';

interface TemplateRow {
  brand: string;
  category: string;
  collection: string;
  colorCode: string;
  colorName: string;
}

function brandName(brandId: string | undefined): string {
  if (!brandId) return '';
  return brands.find((b) => b.id === String(brandId))?.name || '';
}

async function buildRows(): Promise<TemplateRow[]> {
  const perCategory = await Promise.all(
    categories.map(async (category) => {
      const { status, body } = await getColorsForCategory(category.slug);
      if (status !== 200 || !body) return [] as TemplateRow[];

      const rows: TemplateRow[] = [];

      if (Array.isArray(body.collections)) {
        for (const collection of body.collections as any[]) {
          // Nested kolekcije uvek imaju bar jednu boju (get-colors filtrira colorCount > 0).
          const colors = (collection.colors || []) as any[];
          for (const color of colors) {
            rows.push({
              brand: brandName(color.brandId || collection.colors?.[0]?.brandId),
              category: category.name,
              collection: collection.name || collection.slug,
              colorCode: String(color.code || ''),
              colorName: String(color.name || ''),
            });
          }
        }
      } else if (Array.isArray(body.colors)) {
        for (const color of body.colors as any[]) {
          rows.push({
            brand: brandName(color.brandId),
            category: category.name,
            collection: String(color.collection_name || color.collection || ''),
            colorCode: String(color.code || ''),
            colorName: String(color.name || ''),
          });
        }
      }

      return rows;
    })
  );

  return perCategory.flat();
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(CENOVNIK_COOKIE)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ error: 'Neautorizovano' }, { status: 401 });
  }

  const rows = await buildRows();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Podovi';
  const sheet = workbook.addWorksheet('Cenovnik');

  sheet.columns = [
    { header: 'Brend', key: 'brand', width: 18 },
    { header: 'Kategorija', key: 'category', width: 18 },
    { header: 'Kolekcija', key: 'collection', width: 34 },
    { header: 'Boja - šifra', key: 'colorCode', width: 16 },
    { header: 'Boja - naziv', key: 'colorName', width: 28 },
    { header: 'Cena bez PDV-a', key: 'base', width: 16 },
    { header: 'Cena sa PDV-om', key: 'withVat', width: 16 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle' };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const multiplier = 1 + VAT_RATE;

  for (const row of rows) {
    const added = sheet.addRow({
      brand: row.brand,
      category: row.category,
      collection: row.collection,
      colorCode: row.colorCode,
      colorName: row.colorName,
      base: null,
      withVat: null,
    });
    // "Cena sa PDV-om" = "Cena bez PDV-a" * (1 + PDV); prikazuje se kad se unese cena bez PDV-a.
    added.getCell(7).value = { formula: `IF(F${added.number}="","",F${added.number}*${multiplier})` } as any;
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(arrayBuffer as ArrayBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="cenovnik-podovi-template.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
