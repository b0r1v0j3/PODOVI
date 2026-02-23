const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const pdfParse = require('pdf-parse');

const DOCS_PARAMS = path.join(__dirname, '../public/data/documents_index.json');

async function downloadBuffer(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(downloadBuffer(res.headers.location));
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Status ${res.statusCode} for ${url}`));
            }
            const data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', reject);
    });
}

function extractSpecs(text) {
    const specs = {};
    const lines = text.split('\n');
    let fullText = text.replace(/\s+/g, ' '); // simple searchable text

    // Impact sound insulation: (e.g. dB, 19dB, etc)
    const acousticMatch = fullText.match(/(?:Impact sound insulation|Acoustic insulation|Zvučna izolacija|Sound absorption)[^\d]*(\d+\s*dB)/i);
    if (acousticMatch) specs.Acoustics = '-' + acousticMatch[1].replace(/\s/g, ''); // typically prefixed with '-' for insulation

    // Total thickness: (e.g. 2.0 mm, 2 mm)
    const thicknessMatch = fullText.match(/(?:Total thickness|Overall thickness)[^\d]*(\d+(?:\.\d+)?\s*mm)/i);
    if (thicknessMatch) specs.Thickness = thicknessMatch[1].replace(/\s/g, '');

    // Weight / Mass: (e.g. 2800 g/sqm, 2900 g/m²)
    const weightMatch = fullText.match(/(?:Weight|Total weight|Mass)[^\d]*(\d+(?:\.\d+)?\s*(?:g\/m²|g\/sqm|kg\/m²))/i);
    if (weightMatch) specs.Weight = weightMatch[1].replace('sqm', 'm²').replace(/\s/g, '');

    return specs;
}

async function testExtraction() {
    console.log("Testing PDF data extraction...");
    // creation-40-clic Technical Datasheet
    const url = "https://cdn.gerflor.com/media/2/60005/creation%2040%20clic%20-%20technical%20datasheet.pdf";
    console.log("Downloading from", url);
    try {
        const buffer = await downloadBuffer(url);
        console.log("Downloaded buffer length:", buffer.length);
        const data = await pdfParse(buffer);
        console.log("Extracting text length:", data.text.length);

        const specs = extractSpecs(data.text);
        console.log("Extracted specs:", specs);
    } catch (e) {
        console.error(e);
    }
}

testExtraction();
