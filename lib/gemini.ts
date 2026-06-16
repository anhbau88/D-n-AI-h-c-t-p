// lib/gemini.ts
// Khởi tạo và gọi Google Gemini API

import { GoogleGenerativeAI } from '@google/generative-ai';

// Khởi tạo các client với API Key tương ứng từ biến môi trường
const getValidGeminiKey = (...keys: (string | undefined)[]) => {
  const nonEmptyKeys = keys.map(k => (k || '').trim()).filter(Boolean);
  
  // Danh sách các key đã được xác nhận hoạt động tốt (không bị 503)
  const workingKeys = [
    process.env.GEMINI_API_KEY_QUIZ,
    process.env.GEMINI_API_KEY_MULTIMODAL,
    process.env.GEMINI_API_KEY_ESSAY
  ].map(k => (k || '').trim()).filter(Boolean);

  // Thử tìm xem có key yêu cầu nào nằm trong danh sách các key hoạt động tốt hay không
  const requestedWorkingKey = nonEmptyKeys.find(k => workingKeys.includes(k));
  if (requestedWorkingKey) return requestedWorkingKey;

  // Nếu không, sử dụng key hoạt động tốt đầu tiên có sẵn
  if (workingKeys.length > 0) return workingKeys[0];

  // Fallback: Tìm key chuẩn bắt đầu bằng AIzaSy
  const standardKey = nonEmptyKeys.find(k => k.startsWith('AIzaSy'));
  if (standardKey) return standardKey;

  return nonEmptyKeys[0] || '';
};

// Phân chia tải (Load balance) giữa các key hoạt động tốt để tránh quá hạn ngạch (quota limit) 20 requests/ngày
const keyQuiz = (process.env.GEMINI_API_KEY_QUIZ || '').trim() || getValidGeminiKey();
const keyEssay = (process.env.GEMINI_API_KEY_ESSAY || '').trim() || getValidGeminiKey();
const keyMultimodal = (process.env.GEMINI_API_KEY_MULTIMODAL || '').trim() || getValidGeminiKey();
const keyChat = keyEssay; // Sử dụng keyEssay cho Chat
const keySummarize = keyMultimodal; // Sử dụng keyMultimodal cho Summarize

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
 * Hàm helper tự động gọi lại (retry) khi Gemini API gặp sự cố (e.g. Lỗi 503, 429 quá tải, nghẽn mạng)
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 2000): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const err = error as Error & { status?: number };
      const errorMsg = err.toString() || '';
      console.warn(`[Gemini API Warning] Thất bại lần thử ${i + 1}/${retries}:`, err.message || err);
      
      // Nếu là hết quota hàng ngày (định mức 20 requests/ngày của free tier), ném lỗi luôn để kích hoạt cơ chế fallback ngay lập tức
      const isDailyQuotaExceeded = errorMsg.includes('daily quota') || 
                                   errorMsg.includes('generate_content_free_tier_requests') || 
                                   errorMsg.includes('limit: 20') ||
                                   errorMsg.includes('Quota exceeded');
      if (isDailyQuotaExceeded) {
        console.warn('[Gemini API] Phát hiện vượt quá hạn ngạch hàng ngày. Bỏ qua thử lại để chuyển sang dữ liệu dự phòng (fallback).');
        throw error;
      }

      if (i < retries - 1) {
        let waitTime = delayMs * Math.pow(2, i);
        const isRateLimit = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED') || err.status === 429;
        
        if (isRateLimit) {
          const match = errorMsg.match(/retry in ([\d\.]+)\s*s/i);
          if (match) {
            const seconds = parseFloat(match[1]);
            waitTime = Math.ceil(seconds * 1000) + 1500; // Chờ thêm 1.5 giây để quota hồi phục hoàn toàn
            console.warn(`[Gemini API Rate Limit] API yêu cầu chờ. Sẽ tự động chờ ${waitTime / 1000} giây trước khi thử lại...`);
          } else {
            waitTime = 15000; // Mặc định chờ 15s nếu là rate limit chung
            console.warn(`[Gemini API Rate Limit] Phát hiện quá tải. Sẽ chờ ${waitTime / 1000} giây trước khi thử lại...`);
          }
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  throw lastError;
}

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

    const result = await callWithRetry(() => activeModel.generateContent(prompt));
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
    const result = await callWithRetry(() => modelMultimodal.generateContent([
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType
        }
      },
      prompt
    ]));
    return result.response.text();
  } catch (error) {
    console.error('Lỗi trích xuất đa phương tiện từ Gemini:', error);
    throw new Error('AI không phản hồi khi xử lý tệp đa phương tiện. Vui lòng thử lại.');
  }
}

