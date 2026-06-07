const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
const query = process.argv[3];

if (!filePath || !query) {
  console.log('Usage: node find-code.js <file-path> <query>');
  process.exit(1);
}

try {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let matches = 0;
  
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(query.toLowerCase())) {
      console.log(`${index + 1}: ${line.trim()}`);
      matches++;
      if (matches >= 100) {
        console.log('...Too many matches. Truncating.');
        process.exit(0);
      }
    }
  });
  console.log(`Found ${matches} matches.`);
} catch (err) {
  console.error('Error:', err.message);
}
