import '@/lib/env-loader';
import { NextRequest, NextResponse } from 'next/server';
import { streamText, CoreMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createChatPrompt, createHintChatPrompt } from '@/lib/prompts';

const getValidGeminiKey = () => {
  const keys = [
    process.env.GEMINI_API_KEY_CHAT,
    process.env.GEMINI_API_KEY,
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
  apiKey: (process.env.GEMINI_API_KEY_ESSAY || '').trim() || getValidGeminiKey(),
});

export async function POST(request: NextRequest) {
  let messages: any[] = [];
  try {
    const body = await request.json();
    messages = body.messages || [];
    const { pdfText, imageAttachment, userRole } = body;

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
    console.error('[Gemini API] Lỗi khi gọi Gemini Chat:', error);
    return NextResponse.json(
      { error: 'Lỗi khi kết nối với AI để trò chuyện: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
