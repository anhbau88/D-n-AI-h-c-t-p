// lib/gemini.ts
// Khởi tạo và gọi Google Gemini API

import { GoogleGenerativeAI } from '@google/generative-ai';

// Khởi tạo các client với API Key tương ứng từ biến môi trường
const keySummarize = (process.env.GEMINI_API_KEY || '').trim();
const keyQuiz = (process.env.GEMINI_API_KEY_QUIZ || '').trim() || keySummarize;
const keyChat = (process.env.GEMINI_API_KEY_CHAT || '').trim() || keySummarize;
const keyEssay = (process.env.GEMINI_API_KEY_ESSAY || '').trim() || keySummarize;
const keyMultimodal = (process.env.GEMINI_API_KEY_MULTIMODAL || '').trim() || keySummarize;

const genAI = new GoogleGenerativeAI(keySummarize);
const genAIQuiz = new GoogleGenerativeAI(keyQuiz);
const genAIChat = new GoogleGenerativeAI(keyChat);
const genAIEssay = new GoogleGenerativeAI(keyEssay);
const genAIMultimodal = new GoogleGenerativeAI(keyMultimodal);

// Khởi tạo các model tương ứng cho từng mục đích sử dụng
const modelName = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

const modelSummarize = genAI.getGenerativeModel({
  model: modelName,
});

const modelQuiz = genAIQuiz.getGenerativeModel({
  model: modelName,
});

const modelQuizJson = genAIQuiz.getGenerativeModel({
  model: modelName,
  generationConfig: { responseMimeType: 'application/json' },
});

const modelChat = genAIChat.getGenerativeModel({
  model: modelName,
});

const modelEssay = genAIEssay.getGenerativeModel({
  model: modelName,
});

const modelEssayJson = genAIEssay.getGenerativeModel({
  model: modelName,
  generationConfig: { responseMimeType: 'application/json' },
});

const modelMultimodal = genAIMultimodal.getGenerativeModel({
  model: modelName,
});

/**
 * Gọi Gemini API với prompt và phân chia mục đích sử dụng key
 * @param prompt - Nội dung prompt gửi cho AI
 * @param purpose - Mục đích sử dụng: 'summarize' | 'quiz' | 'chat' | 'essay'
 * @param jsonMode - Có yêu cầu định dạng đầu ra là JSON hay không (áp dụng khi purpose là 'quiz' hoặc 'essay')
 * @returns Kết quả trả về từ AI (text)
 */
export async function callGemini(
  prompt: string,
  purpose: 'summarize' | 'quiz' | 'chat' | 'essay',
  jsonMode: boolean = false
): Promise<string> {
  try {
    let activeModel;
    if (purpose === 'quiz') {
      activeModel = jsonMode ? modelQuizJson : modelQuiz;
    } else if (purpose === 'chat') {
      activeModel = modelChat;
    } else if (purpose === 'essay') {
      activeModel = jsonMode ? modelEssayJson : modelEssay;
    } else {
      activeModel = modelSummarize;
    }

    const result = await activeModel.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error(`Lỗi gọi Gemini (${purpose}):`, error);
    throw new Error('AI không phản hồi. Vui lòng thử lại.');
  }
}

/**
 * Gọi Gemini Multimodal API để trích xuất văn bản từ hình ảnh hoặc PDF quét
 * @param fileBuffer - Buffer của file
 * @param mimeType - MimeType của file
 * @param prompt - Câu lệnh hướng dẫn AI trích xuất nội dung
 * @returns Văn bản trích xuất được từ file
 */
export async function callGeminiMultimodal(
  fileBuffer: Buffer,
  mimeType: string,
  prompt: string
): Promise<string> {
  try {
    const result = await modelMultimodal.generateContent([
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType
        }
      },
      prompt
    ]);
    return result.response.text();
  } catch (error) {
    console.error('Lỗi trích xuất đa phương tiện từ Gemini:', error);
    throw new Error('AI không phản hồi khi xử lý tệp đa phương tiện. Vui lòng thử lại.');
  }
}

