const description = `Uklonjivi podovi koji odgovaraju vašim potrebama

Proizvod:
5 veličina: uključujući riblju kost i XL daske
Ekskluzivna konstrukcija « Duo Core », ojačano staklenim vlaknima za komfor i stabilnost
ProtecShield™ lak: prirodan izgled i lako za čišćenje

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Direktno na keramiku ako je spoj <4mm

Primena:
Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice - evropska klasa 34-43

Okruženje:
100% reciklabilno
35% recikliranog sadržaja
TVOC <10µg/m³
Bez ftalata`;

const sectionTitles = [
  'Design & Product',
  'Product & Design',
  'Product',
  'Product :',
  'Proizvod',
  'Proizvod:',
  'Dizajn i proizvod',
  'Installation & Maintenance',
  'Installation',
  'Installation :',
  'Ugradnja',
  'Ugradnja:',
  'Ugradnja i održavanje',
  'Maintenance',
  'Održavanje',
  'Market Application',
  'Application',
  'Application :',
  'Primena',
  'Primena:',
  'Environment',
  'Environment :',
  'Okruženje',
  'Okruženje:',
];

const lines = description.split('\n').map(line => line.trim()).filter(line => line.length > 0);

console.log('Lines:');
lines.forEach((line, i) => {
  const lineLower = line.toLowerCase();
  const isSection = sectionTitles.some(title => {
    const titleLower = title.toLowerCase();
    
    // Exact match
    if (lineLower === titleLower) return true;
    
    // Match if line starts with title and either:
    // 1. Ends with colon (":") - e.g., "Proizvod:", "Ugradnja:"
    // 2. Is followed by colon in the original line - e.g., "Product :"
    // 3. Line is short (< 30 chars) and starts with title - for single word sections
    if (lineLower.startsWith(titleLower)) {
      // Check if it ends with colon or is short single-word section
      if (line.endsWith(':') || line.endsWith(' :') || (line.length < 30 && !line.includes(' '))) {
        return true;
      }
    }
    
    // Contains title (for variations like "Technical and environmental")
    if (lineLower.includes(titleLower) && line.length < 60 && (line.endsWith(':') || line.endsWith(' :'))) {
      return true;
    }
    
    return false;
  });
  console.log(`${i}: "${line}" ${isSection ? '✅ SECTION' : '❌'}`);
});
