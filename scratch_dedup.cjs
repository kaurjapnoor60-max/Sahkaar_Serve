const fs = require('fs');
const content = fs.readFileSync('src/data.ts', 'utf8');
const lines = content.split('\n');
const seen = new Set();
let inHi = false;
const newLines = [];

for(let i = 0; i < lines.length; i++) {
  if (lines[i].includes('hi: {')) { 
    inHi = true; 
    seen.clear(); 
    newLines.push(lines[i]); 
    continue; 
  }
  
  if (inHi && lines[i].includes('pa: {')) {
    inHi = false;
  }
  
  if (inHi) {
    const match = lines[i].match(/^\s*['"]([^'"]+)['"]:/);
    if (match) {
      const key = match[1];
      if (seen.has(key)) {
        console.log(`Removed duplicate key: ${key} at line ${i+1}`);
        continue;
      }
      seen.add(key);
    }
  }
  newLines.push(lines[i]);
}

fs.writeFileSync('src/data.ts', newLines.join('\n'));
console.log('Done');
