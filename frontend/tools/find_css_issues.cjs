const fs = require('fs');
const path = require('path');

function walk(dir, files=[]) {
  const arr = fs.readdirSync(dir);
  for (const name of arr) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.css$/i.test(name)) files.push(full);
  }
  return files;
}

const root = path.join(__dirname, '..', 'src');
if (!fs.existsSync(root)) {
  console.error('No encuentro la carpeta src. Ejecuta desde el repo.');
  process.exit(2);
}

const files = walk(root, []).sort();
let any=false;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  let balance = 0;
  let negativeAt = -1;
  for (let i=0;i<lines.length;i++){
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') balance++;
      else if (ch === '}') balance--;
    }
    if (balance<0 && negativeAt===-1) negativeAt = i+1;
  }
  if (negativeAt!==-1 || balance!==0) {
    any=true;
    console.log('ISSUE:', file);
    if (negativeAt!==-1) console.log('  negative at line', negativeAt);
    console.log('  final balance', balance);
  }
}
if (!any) {
  console.log('No issues found in individual CSS files.');
  process.exit(0);
} else {
  console.error('\nFound CSS issues. Exiting with code 1 to fail build.');
  process.exit(1);
}
