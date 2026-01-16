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
    return lineLower === titleLower || 
           lineLower.startsWith(titleLower) || 
           (lineLower.includes(titleLower) && line.length < 60);
  });
  console.log(`${i}: "${line}" ${isSection ? '✅ SECTION' : '❌'}`);
});
