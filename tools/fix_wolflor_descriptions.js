// Čisti Wolflor opise od ingest-artefakata: engleske liste primene + meta-fraza „iz PDF kataloga".
// Uzemljeno: engleske aplikacije su izvorne (Wolflor katalog) — samo prevedene na srpski.
const fs = require('fs');
const path = require('path');
const core = require('./lib/ingest-core.js');

const FP = path.join(process.cwd(), 'public', 'data', 'wolflor_vinyl_colors.json');

function fix(s) {
    if (typeof s !== 'string') return s;
    return s
        .replace(
            /hospital, healthcare, clinic, lab, airport, bank,?\s*etc\.+/i,
            'bolnice, zdravstvene ustanove, klinike, laboratorije, aerodrome, banke i slične objekte.',
        )
        .replace(
            /home, school, office, library, kindergarten, retail,?\s*etc\.+/i,
            'domove, škole, kancelarije, biblioteke, vrtiće, maloprodaju i slične prostore.',
        )
        .replace(/\s*preuzet[ao] iz najnovijeg PDF kataloga/gi, '');
}

const d = JSON.parse(fs.readFileSync(FP, 'utf8'));
let n = 0;
function visit(arr) {
    for (const c of (arr || [])) {
        for (const key of ['description', 'shortDescription', 'categoryDescription']) {
            if (typeof c?.[key] === 'string') {
                const fixed = fix(c[key]);
                if (fixed !== c[key]) { c[key] = fixed; n++; }
            }
        }
        if (Array.isArray(c?.colors)) visit(c.colors);
    }
}
visit(Array.isArray(d.collections) ? d.collections : []);
visit(Array.isArray(d.colors) ? d.colors : []);

core.writeJsonWithBackup(FP, d, 'fix-wolflor-desc');
console.log('Wolflor opisa očišćeno:', n);
