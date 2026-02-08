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
  console.error('No encuentro la carpeta src en frontend. Asegúrate de ejecutar desde el repo.');
  process.exit(2);
}

let files = walk(root, []);
files = files.sort();

let globalLine = 0;
let balance = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') balance++;
      else if (ch === '}') {
        balance--;
        if (balance < 0) {
          console.log('NEGATIVE at globalLine', globalLine + i + 1);
          console.log('file:', file);
          console.log('fileLine:', i + 1);
          console.log('lineText:', line.trim());
          process.exit(0);
        }
      }
    }
  }
  globalLine += lines.length;
}

console.log('All concatenated CSS files have non-negative balance (final balance =', balance + ')');
process.exit(0);
