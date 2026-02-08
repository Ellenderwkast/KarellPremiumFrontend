const fs = require('fs');
const path = require('path');

const stylesDir = path.resolve(__dirname, '..', 'src', 'styles');

function walk(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) files = files.concat(walk(full));
    else if (it.isFile() && full.endsWith('.css')) files.push(full);
  }
  return files;
}

const files = walk(stylesDir);
if (!files.length) {
  console.error('No CSS files found in', stylesDir);
  process.exit(1);
}

let anyError = false;
for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  const lines = txt.split(/\r?\n/);
  let balance = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') balance++;
      else if (ch === '}') balance--;
      if (balance < 0) {
        console.log(`ERROR: Negative balance in ${file} at line ${i+1}`);
        console.log('  >', line.trim());
        anyError = true;
        break;
      }
    }
    if (balance < 0) break;
  }
  if (!anyError && balance !== 0) {
    console.log(`WARNING: Unbalanced braces in ${file}: final balance ${balance}`);
    anyError = true;
  }
}
if (!anyError) console.log('All CSS files have balanced braces.');
