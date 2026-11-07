import '@/lib/env-loader';
import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createSummarizePrompt } from '@/lib/prompts';
import { checkAndConsumeAiQuota } from '@/lib/quota';
import { getCandidateModelsForTier, enhancePromptForModelTier } from '@/lib/gemini';
import { AIModelTier } from '@/types';

function getAllApiKeys(): string[] {
  const keys = [
    process.env.GEMINI_API_KEY_MULTIMODAL,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP,
    process.env.GEMINI_API_KEY_BACKUP_2,
    process.env.GEMINI_API_KEY_CHAT,
    process.env.GEMINI_API_KEY_QUIZ,
    process.env.GEMINI_API_KEY_ESSAY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ].map(k => (k || '').trim()).filter(Boolean);
  
  return Array.from(new Set(keys));
}

export async function POST(request: NextRequest) {
  let pdfText = '';
  let role: 'student' | 'teacher' | undefined = 'student';
  let fileName = 'Tài liệu';
  let fileType = 'PDF';

  try {
    const body = await request.json();
    pdfText = body.pdfText || '';
    role = body.role === 'teacher' ? 'teacher' : 'student';
    fileName = body.fileName || 'Tài liệu';
    fileType = body.fileType || 'PDF';
    const requestedTier: AIModelTier = ['flash', 'pro', 'ultra'].includes(body.modelTier) ? body.modelTier : 'flash';

    const quota = await checkAndConsumeAiQuota(request, requestedTier, 10);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.error, upgradeRequired: quota.upgradeRequired },
        { status: 403 }
      );
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Không có nội dung tài liệu. Vui lòng upload PDF trước.' },
        { status: 400 }
      );
    }

    const truncatedText = pdfText.substring(0, 30000);
    const keys = getAllApiKeys();
    if (keys.length === 0) {
      throw new Error('Không tìm thấy API Key nào trong cấu hình.');
    }

    const preferredKey = (process.env.GEMINI_API_KEY_MULTIMODAL || '').trim();
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

    const systemPrompt = enhancePromptForModelTier(
      createSummarizePrompt(truncatedText, role, fileName, fileType),
      quota.effectiveModelTier,
      false
    );
    const candidateModels = getCandidateModelsForTier(quota.effectiveModelTier);

    let lastError: any;
    for (const modelName of candidateModels) {
      for (const key of orderedKeys) {
        try {
          console.log(`[Summarize API] Đang thử streamText model ${modelName} với key: ${key.substring(0, 8)}...`);
          const googleClient = createGoogleGenerativeAI({ apiKey: key });
          const result = await streamText({
            model: googleClient(`models/${modelName}`),
            system: systemPrompt,
            messages: [{ role: 'user', content: 'Hãy tóm tắt tài liệu này.' }],
          });
          return result.toAIStreamResponse();
        } catch (err: any) {
          console.error(`[Summarize API Error] Thất bại model ${modelName} với key ${key.substring(0, 8)}...:`, err.message || err);
          lastError = err;
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error('[Gemini API] Lỗi khi gọi Gemini Summarize:', error);
    return NextResponse.json(
      { error: 'Lỗi khi kết nối với AI để tóm tắt tài liệu: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
