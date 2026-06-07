const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const rootDir = path.join(__dirname, '..');
  const envPath = path.join(rootDir, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    });
    console.log('Loaded env variables from:', envPath);
  } else {
    console.error('Env file not found at:', envPath);
  }
}

loadEnv();

const keys = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_API_KEY_QUIZ: process.env.GEMINI_API_KEY_QUIZ,
  GEMINI_API_KEY_CHAT: process.env.GEMINI_API_KEY_CHAT,
  GEMINI_API_KEY_MULTIMODAL: process.env.GEMINI_API_KEY_MULTIMODAL,
  GEMINI_API_KEY_ESSAY: process.env.GEMINI_API_KEY_ESSAY
};

const dummyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // 1x1 black pixel PNG

async function testKey(name, key) {
  if (!key) {
    console.log(`Key ${name} is empty.`);
    return;
  }
  
  console.log(`\nTesting key ${name}: ${key.substring(0, 8)}...`);
  try {
    const genAI = new GoogleGenerativeAI(key.trim());
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Test simple text request
    console.log(`[${name}] Sending text prompt...`);
    const textRes = await model.generateContent("Hello, write one word.");
    console.log(`[${name}] Text Response:`, textRes.response.text().trim());

    // Test multimodal (image input)
    console.log(`[${name}] Sending multimodal prompt...`);
    const multiRes = await model.generateContent([
      {
        inlineData: {
          data: dummyBase64,
          mimeType: 'image/png'
        }
      },
      "What is this image? Reply in one word."
    ]);
    console.log(`[${name}] Multimodal Response:`, multiRes.response.text().trim());
  } catch (error) {
    console.error(`[${name}] Failed:`, error.message);
    if (error.status) console.error(`Status code: ${error.status}`);
  }
}

async function run() {
  for (const [name, key] of Object.entries(keys)) {
    await testKey(name, key);
  }
}

run();
