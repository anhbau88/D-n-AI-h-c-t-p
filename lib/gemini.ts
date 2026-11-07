import '@/lib/env-loader';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIModelTier } from '@/types';

/**
 * Lấy tất cả các API key không rỗng và duy nhất từ biến môi trường
 */
export function getAllApiKeys(): string[] {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP,
    process.env.GEMINI_API_KEY_BACKUP_2,
    process.env.GEMINI_API_KEY_QUIZ,
    process.env.GEMINI_API_KEY_CHAT,
    process.env.GEMINI_API_KEY_MULTIMODAL,
    process.env.GEMINI_API_KEY_ESSAY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ].map(k => (k || '').trim()).filter(Boolean);
  
  return Array.from(new Set(keys));
}

/**
 * Trả về danh sách tên model ưu tiên dựa theo cấp độ AI Model Tier ('flash' | 'pro' | 'ultra')
 * Có cơ chế tự động fallback an toàn xuống gemini-2.5-flash nếu key miễn phí chạm giới hạn model Pro
 */
export function getCandidateModelsForTier(tier: AIModelTier = 'flash'): string[] {
  const defaultModel = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
  if (tier === 'ultra') {
    return ['gemini-2.5-pro', defaultModel];
  }
  if (tier === 'pro') {
    return ['gemini-2.5-pro', defaultModel];
  }
  return [defaultModel];
}

/**
 * Bổ sung chỉ dẫn tư duy chuyên sâu (Deep Reasoning / Academic Rigor) khi người dùng chọn gói Model Pro hoặc Ultra
 */
export function enhancePromptForModelTier(prompt: string, tier: AIModelTier = 'flash', jsonMode = false): string {
  if (tier === 'flash' || jsonMode) return prompt;

  if (tier === 'ultra') {
    return `[CHẾ ĐỘ AI ULTRA ACADEMIC - HỘI ĐỒNG CHUYÊN GIA KHẢO THÍ QUỐC GIA]
Hãy suy luận đa bước, phân tích sâu sắc bản chất học thuật, đối chiếu ngữ cảnh chặt chẽ, đưa ra lập luận sắc bén, liên hệ mở rộng thực tiễn và trình bày đạt chuẩn mực sư phạm cao nhất.\n\n${prompt}`;
  }

  return `[CHẾ ĐỘ AI PRO REASONING - TƯ DUY LOGIC CHUYÊN SÂU]
Hãy phân tích kỹ lưỡng từng bước (Chain-of-Thought), giải thích rõ bản chất vấn đề, tránh trả lời hời hợt và đảm bảo độ chính xác học thuật tối đa.\n\n${prompt}`;
}

/**
 * Hàm helper tự động gọi lại (retry) khi Gemini API gặp sự cố (e.g. Lỗi 503, 429 quá tải, nghẽn mạng)
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const err = error as Error & { status?: number };
      const errorMsg = err.toString() || '';
      console.warn(`[Gemini API Warning] Thất bại lần thử ${i + 1}/${retries}:`, err.message || err);
      
      const isDailyQuotaExceeded = errorMsg.includes('daily quota') || 
                                   errorMsg.includes('generate_content_free_tier_requests') || 
                                   errorMsg.includes('limit: 20') ||
                                   errorMsg.includes('Quota exceeded') ||
                                   errorMsg.includes('404') ||
                                   errorMsg.includes('not found');
      if (isDailyQuotaExceeded) {
        throw error;
      }

      if (i < retries - 1) {
        let waitTime = delayMs * Math.pow(2, i);
        const isRateLimit = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED') || err.status === 429;
        
        if (isRateLimit) {
          const match = errorMsg.match(/retry in ([\d\.]+)\s*s/i);
          if (match) {
            const seconds = parseFloat(match[1]);
            waitTime = Math.min(8000, Math.ceil(seconds * 1000) + 1000);
          } else {
            waitTime = 4000;
          }
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  throw lastError;
}

/**
 * Thực hiện gọi Gemini với cơ chế xoay vòng Key động và phân tầng Model AI ('flash' | 'pro' | 'ultra')
 */
async function callGenerativeAIWithFallback(
  purpose: 'summarize' | 'quiz' | 'chat' | 'essay' | 'multimodal',
  jsonMode: boolean,
  runner: (model: any) => Promise<any>,
  modelTier: AIModelTier = 'flash'
): Promise<any> {
  const keys = getAllApiKeys();
  if (keys.length === 0) {
    throw new Error('Không tìm thấy API Key nào trong biến môi trường.');
  }

  let preferredKey: string | undefined;
  if (purpose === 'quiz') preferredKey = process.env.GEMINI_API_KEY_QUIZ;
  else if (purpose === 'chat') preferredKey = process.env.GEMINI_API_KEY_CHAT;
  else if (purpose === 'essay') preferredKey = process.env.GEMINI_API_KEY_ESSAY;
  else if (purpose === 'multimodal') preferredKey = process.env.GEMINI_API_KEY_MULTIMODAL;
  else preferredKey = process.env.GEMINI_API_KEY;

  preferredKey = (preferredKey || '').trim();

  const orderedKeys = [...keys];
  if (preferredKey && orderedKeys.includes(preferredKey)) {
    const idx = orderedKeys.indexOf(preferredKey);
    orderedKeys.splice(idx, 1);
    orderedKeys.unshift(preferredKey);
  }

  const defaultKey = (process.env.GEMINI_API_KEY || '').trim();
  if (defaultKey && orderedKeys.includes(defaultKey) && orderedKeys[0] !== defaultKey) {
    const idx = orderedKeys.indexOf(defaultKey);
    orderedKeys.splice(idx, 1);
    orderedKeys.splice(1, 0, defaultKey);
  }

  const candidateModels = getCandidateModelsForTier(modelTier);
  let lastError: any;

  for (const modelName of candidateModels) {
    for (const key of orderedKeys) {
      try {
        console.log(`[Gemini SDK] Đang gọi model ${modelName} (Tier: ${modelTier}) với key: ${key.substring(0, 8)}... (${purpose})`);
        const genAI = new GoogleGenerativeAI(key);
        const modelConfig: any = { model: modelName };
        if (jsonMode) {
          modelConfig.generationConfig = { responseMimeType: 'application/json' };
        }
        const model = genAI.getGenerativeModel(modelConfig);
        
        const result = await callWithRetry(() => runner(model));
        return result;
      } catch (err: any) {
        console.error(`[Gemini SDK Error] Thất bại model ${modelName} với key ${key.substring(0, 8)}...:`, err.message || err);
        lastError = err;
      }
    }
  }

  throw lastError;
}

/**
 * Gọi Gemini API với prompt, mục đích sử dụng và cấp độ Model AI ('flash' | 'pro' | 'ultra')
 */
export async function callGemini(
  prompt: string,
  purpose: 'summarize' | 'quiz' | 'chat' | 'essay',
  jsonMode: boolean = false,
  modelTier: AIModelTier = 'flash'
): Promise<string> {
  try {
    const finalPrompt = enhancePromptForModelTier(prompt, modelTier, jsonMode);
    const result = await callGenerativeAIWithFallback(
      purpose,
      jsonMode,
      (model) => model.generateContent(finalPrompt),
      modelTier
    );
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error(`Lỗi gọi Gemini (${purpose}, tier=${modelTier}) sau khi đã thử tất cả các key:`, error);
    throw new Error('AI không phản hồi. Vui lòng thử lại.');
  }
}

/**
 * Gọi Gemini Multimodal API để trích xuất văn bản / chấm bài từ hình ảnh hoặc PDF quét
 */
export async function callGeminiMultimodal(
  fileBuffer: Buffer,
  mimeType: string,
  prompt: string,
  modelTier: AIModelTier = 'flash'
): Promise<string> {
  try {
    const result = await callGenerativeAIWithFallback(
      'multimodal',
      false,
      (model) =>
        model.generateContent([
          {
            inlineData: {
              data: fileBuffer.toString('base64'),
              mimeType: mimeType
            }
          },
          prompt
        ]),
      modelTier
    );
    return result.response.text();
  } catch (error) {
    console.error('Lỗi trích xuất đa phương tiện từ Gemini sau khi đã thử tất cả các key:', error);
    throw new Error('AI không phản hồi khi xử lý tệp đa phương tiện. Vui lòng thử lại.');
  }
}
