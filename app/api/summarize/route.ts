// app/api/summarize/route.ts
// API tóm tắt tài liệu bằng Gemini

import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createSummarizePrompt } from '@/lib/prompts';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { pdfText, role = 'student', fileName = 'Tài liệu', fileType = 'PDF' } = await request.json();

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
    console.error('Lỗi tóm tắt:', error);
    return NextResponse.json(
      { error: 'Không thể tóm tắt tài liệu. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
