const fs = require('fs');
const path = require('path');
const assets = path.join(__dirname, '..', 'dist', 'assets');
if (!fs.existsSync(assets)) { console.error('No existe dist/assets. Ejecuta build antes.'); process.exit(2); }
const files = fs.readdirSync(assets).filter(f=>/\.css$/.test(f)).map(f=>path.join(assets,f));
let any=false;
for (const file of files) {
  const content = fs.readFileSync(file,'utf8');
  const lines = content.split(/\r?\n/);
  let balance=0; let negativeAt=-1;
  for (let i=0;i<lines.length;i++){
    const line=lines[i];
    for (const ch of line){ if (ch==='{') balance++; else if (ch==='}') { balance--; if (balance<0 && negativeAt===-1) negativeAt=i+1; } }
  }
  if (negativeAt!==-1 || balance!==0){ any=true; console.log('DIST ISSUE:', file); if (negativeAt!==-1) console.log('  negative at', negativeAt); console.log('  final balance', balance); }
}
if (!any) console.log('No issues in dist CSS files.');
