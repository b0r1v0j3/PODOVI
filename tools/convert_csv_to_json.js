const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

const csvPath = path.join(__dirname, 'tarkett_data', 'tarkett_products_deep.csv');
const jsonOutputPath = path.join(__dirname, 'tarkett_lvt_spc.json');

try {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const records = csv.parse(csvContent, {
        columns: true,
        skip_empty_lines: true
    });

    const products = records.map(record => {
        // Parse specs if they are JSON string
        let specs = {};
        try {
            specs = JSON.parse(record.Specifications || '{}');
        } catch (e) {
            console.warn(`Failed to parse specs for ${record.Name}`);
        }

        return {
            name: record.Name,
            sku: record.SKU,
            url: record.URL,
            description: record.Description,
            images: record.Images ? record.Images.split(';') : [],
            specifications: specs,
            documents: record.Documents ? record.Documents.split(';') : []
        };
    });

    fs.writeFileSync(jsonOutputPath, JSON.stringify(products, null, 2));
    console.log(`Successfully converted ${products.length} products to JSON.`);

} catch (err) {
    console.error('Error converting CSV to JSON:', err);
}
