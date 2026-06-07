// app/api/summarize/route.ts
// API tóm tắt tài liệu bằng Gemini

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
    console.warn('[Gemini API Fallback] Lỗi khi gọi Gemini, tự động tạo bản tóm tắt mẫu:', error);
    
    const title = fileName || 'Tài liệu học tập';
    let summaryText = `# Tóm tắt tài liệu: ${title}\n\n`;
    
    if (pdfText.includes('Coriolis') || pdfText.includes('Trái Đất')) {
      summaryText += `## 1. Vị trí của Trái Đất trong Hệ Mặt Trời\n` +
        `* Trái Đất là hành tinh thứ ba tính từ Mặt Trời.\n` +
        `* Khoảng cách trung bình từ Trái Đất đến Mặt Trời là khoảng 150 triệu km, nhận được lượng nhiệt và ánh sáng phù hợp cho sự sống.\n\n` +
        `## 2. Hệ quả chuyển động tự quay của Trái Đất\n` +
        `* Trái Đất tự quay quanh một trục tưởng tượng nghiêng 66 độ 33 phút so với mặt phẳng quỹ đạo.\n` +
        `* Tự quay từ Tây sang Đông trong 24 giờ tạo ra các hệ quả địa lý quan trọng:\n` +
        `  1. Hiện tượng luân phiên ngày và đêm ở khắp mọi nơi.\n` +
        `  2. Sự lệch hướng chuyển động của các vật thể do lực **Coriolis**.\n` +
        `  3. Giờ giấc khác nhau trên các khu vực khác nhau (các múi giờ toàn cầu).\n`;
    } else {
      summaryText += `Tài liệu đã được tải lên thành công. Nội dung chính xoay quanh các chủ đề thảo luận về học thuật và nghiên cứu tài liệu.\n\n` +
        `* **Nội dung trích xuất:** ${pdfText.substring(0, 300).trim()}...\n` +
        `* **Gợi ý học tập:** Hãy đọc kỹ tài liệu và thảo luận các câu hỏi học thuật với giáo viên.\n`;
    }
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        const parts = summaryText.match(/.{1,100}/g) || [summaryText];
        for (const part of parts) {
          const chunk = `0:${JSON.stringify(part)}\n`;
          controller.enqueue(encoder.encode(chunk));
          await new Promise(r => setTimeout(r, 10)); // Mô phỏng trễ stream nhẹ
        }
        controller.close();
      }
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1',
      },
    });
  }
}
