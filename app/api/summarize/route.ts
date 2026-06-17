import '@/lib/env-loader';
import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createSummarizePrompt } from '@/lib/prompts';

const getValidGeminiKey = () => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_CHAT,
    process.env.GEMINI_API_KEY_QUIZ,
    process.env.GEMINI_API_KEY_MULTIMODAL,
    process.env.GEMINI_API_KEY_ESSAY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ].map(k => (k || '').trim()).filter(Boolean);

  const workingKeys = [
    process.env.GEMINI_API_KEY_QUIZ,
    process.env.GEMINI_API_KEY_MULTIMODAL,
    process.env.GEMINI_API_KEY_ESSAY
  ].map(k => (k || '').trim()).filter(Boolean);

  const foundWorking = keys.find(k => workingKeys.includes(k));
  if (foundWorking) return foundWorking;
  if (workingKeys.length > 0) return workingKeys[0];
  return keys.find(k => k.startsWith('AIzaSy')) || keys[0] || '';
};

const google = createGoogleGenerativeAI({
  apiKey: (process.env.GEMINI_API_KEY_MULTIMODAL || '').trim() || getValidGeminiKey(),
});

export async function POST(request: NextRequest) {
  let pdfText = '';
  let role: 'student' | 'teacher' | undefined = 'student';
  let fileName = 'Tài liệu';
  let fileType = 'PDF';

  try {
    const body = await request.json();
    pdfText = body.pdfText || '';
    role = body.role || 'student';
    fileName = body.fileName || 'Tài liệu';
    fileType = body.fileType || 'PDF';

    // Kiểm tra input
    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Không có nội dung tài liệu. Vui lòng upload PDF trước.' },
        { status: 400 }
      );
    }

    // Cắt bớt text nếu quá dài (giới hạn ~30,000 ký tự để tránh vượt token)
    const truncatedText = pdfText.substring(0, 30000);

    // Tạo prompt
    // Gọi Gemini với streaming
    const result = await streamText({
      model: google('models/gemini-2.5-flash'),
      system: createSummarizePrompt(truncatedText, role, fileName, fileType),
      messages: [{ role: 'user', content: 'Hãy tóm tắt tài liệu này.' }],
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error('[Gemini API] Lỗi khi gọi Gemini Summarize:', error);
    return NextResponse.json(
      { error: 'Lỗi khi kết nối với AI để tóm tắt tài liệu: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
