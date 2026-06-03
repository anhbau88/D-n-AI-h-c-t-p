// app/api/chat/route.ts
// API chat hỏi đáp dựa trên tài liệu

import { NextRequest, NextResponse } from 'next/server';
import { streamText, CoreMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createChatPrompt, createHintChatPrompt } from '@/lib/prompts';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY_CHAT || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, pdfText, imageAttachment, userRole } = await request.json();

    // Lấy tin nhắn cuối cùng của người dùng
    const lastMessage = messages[messages.length - 1];
    const question = lastMessage?.content;

    // Kiểm tra input
    if ((!question || question.trim().length === 0) && !imageAttachment) {
      return NextResponse.json(
        { error: 'Vui lòng nhập câu hỏi hoặc đính kèm ảnh.' },
        { status: 400 }
      );
    }

    // Cắt bớt text nếu quá dài
    const textToUse = pdfText || '';
    const truncatedText = textToUse.substring(0, 30000);

    // Chọn prompt phù hợp theo vai trò:
    // - Học sinh: Chỉ nhận gợi ý, không đưa đáp án trực tiếp
    // - Giáo viên: Nhận đáp án đầy đủ
    const prompt = userRole === 'student'
      ? createHintChatPrompt(truncatedText, question)
      : createChatPrompt(truncatedText, question);

    // Xây dựng lại lịch sử tin nhắn cho mô hình AI
    const aiMessages = [...messages.slice(0, -1)] as CoreMessage[];

    const userTextContent = (question && question.trim().length > 0) ? question : 'Hãy phân tích hình ảnh đính kèm.';

    if (imageAttachment) {
      // Hỗ trợ xử lý multimodal với ảnh base64
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

    // Gọi Gemini với streaming
    const result = await streamText({
      model: google('models/gemini-2.5-flash'),
      system: prompt,
      messages: aiMessages,
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error('Lỗi chat:', error);
    return NextResponse.json(
      { error: 'AI không thể trả lời lúc này. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
