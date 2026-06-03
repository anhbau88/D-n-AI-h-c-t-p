import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyCRhxsC6QlWJZUuvQjJrM_qDfrckb808UY');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' }
});

async function testJson() {
  try {
    const res = await model.generateContent('Return a simple JSON object');
    console.log('Success:', res.response.text());
  } catch (err) {
    console.error('API Error:', err.message || err);
  }
}
testJson();
