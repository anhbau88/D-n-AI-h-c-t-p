import '@/lib/env-loader';
import { NextRequest, NextResponse } from 'next/server';
import { streamText, CoreMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createChatPrompt, createHintChatPrompt } from '@/lib/prompts';
import { checkAndConsumeAiQuota } from '@/lib/quota';
import { getCandidateModelsForTier, enhancePromptForModelTier } from '@/lib/gemini';
import { AIModelTier } from '@/types';

function getAllApiKeys(): string[] {
  const keys = [
    process.env.GEMINI_API_KEY_CHAT,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP,
    process.env.GEMINI_API_KEY_BACKUP_2,
    process.env.GEMINI_API_KEY_QUIZ,
    process.env.GEMINI_API_KEY_MULTIMODAL,
    process.env.GEMINI_API_KEY_ESSAY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ].map(k => (k || '').trim()).filter(Boolean);
  
  return Array.from(new Set(keys));
}

export async function POST(request: NextRequest) {
  let messages: any[] = [];
  try {
    const body = await request.json();
    messages = body.messages || [];
    const { pdfText, imageAttachment, userRole, modelTier } = body;
    const requestedTier: AIModelTier = ['flash', 'pro', 'ultra'].includes(modelTier) ? modelTier : 'flash';

    // Kiểm tra hạn mức Quota và phân quyền Model AI
    const quota = await checkAndConsumeAiQuota(request, requestedTier, 5);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.error, upgradeRequired: quota.upgradeRequired },
        { status: 403 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const question = lastMessage?.content;

    if ((!question || question.trim().length === 0) && !imageAttachment) {
      return NextResponse.json(
        { error: 'Vui lòng nhập câu hỏi hoặc đính kèm ảnh.' },
        { status: 400 }
      );
    }

    const textToUse = pdfText || '';
    const truncatedText = textToUse.substring(0, 30000);

    let prompt = '';
    if (!truncatedText) {
      prompt = userRole === 'student'
        ? `Bạn là AI Study Assistant - một gia sư định hướng thông minh dành cho học sinh. Khi giải đáp thắc mắc, hãy giải thích cặn kẽ các khái niệm, đưa ra các gợi ý tư duy và câu hỏi định hướng thay vì cho ngay kết quả cuối cùng để khuyến khích học sinh tự suy nghĩ và tự tìm ra câu trả lời.`
        : `Bạn là AI Study Assistant - một trợ lý giảng dạy đắc lực dành cho giáo viên. Hãy cung cấp câu trả lời chi tiết, chính xác, khoa học, có cấu trúc rõ ràng và đề xuất các phương pháp hoặc tài liệu giảng dạy bổ ích khi được yêu cầu.`;
    } else {
      prompt = userRole === 'student'
        ? createHintChatPrompt(truncatedText, question)
        : createChatPrompt(truncatedText, question);
    }

    prompt = enhancePromptForModelTier(prompt, quota.effectiveModelTier, false);

    const aiMessages = [...messages.slice(0, -1)] as CoreMessage[];
    const userTextContent = (question && question.trim().length > 0) ? question : 'Hãy phân tích hình ảnh đính kèm.';

    if (imageAttachment) {
      aiMessages.push({
        role: 'user',
        content: [
          { type: 'text', text: userTextContent },
          { type: 'image', image: new URL(imageAttachment) }
        ]
      });
    } else {
      aiMessages.push({
        role: 'user',
        content: userTextContent
      });
    }

    const keys = getAllApiKeys();
    if (keys.length === 0) {
      throw new Error('Không tìm thấy API Key nào trong cấu hình.');
    }

    const preferredKey = (process.env.GEMINI_API_KEY_CHAT || process.env.GEMINI_API_KEY_ESSAY || '').trim();
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

    const candidateModels = getCandidateModelsForTier(quota.effectiveModelTier);
    let lastError: any;

    for (const modelName of candidateModels) {
      for (const key of orderedKeys) {
        try {
          console.log(`[Chat API] Đang thử streamText model ${modelName} với key: ${key.substring(0, 8)}...`);
          const googleClient = createGoogleGenerativeAI({ apiKey: key });
          const result = await streamText({
            model: googleClient(`models/${modelName}`),
            system: prompt,
            messages: aiMessages,
          });
          return result.toAIStreamResponse();
        } catch (err: any) {
          console.error(`[Chat API Error] Thất bại model ${modelName} với key ${key.substring(0, 8)}...:`, err.message || err);
          lastError = err;
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error('[Gemini API] Lỗi khi gọi Gemini Chat:', error);
    return NextResponse.json(
      { error: 'Lỗi khi kết nối với AI để trò chuyện: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
