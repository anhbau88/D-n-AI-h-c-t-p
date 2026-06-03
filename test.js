// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/GEMINI_API_KEY=\"([^\"]+)\"/);
if (!match) throw new Error("No key");
const key = match[1];

fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key)
  .then(res => res.json())
  .then(data => {
    if (data.error) console.error(data.error);
    else console.log(data.models.map(m => m.name));
  })
  .catch(console.error);
