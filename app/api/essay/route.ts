// app/api/essay/route.ts
// API tạo câu hỏi tự luận bằng Gemini

import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createEssayPrompt } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const { 
      pdfText, 
      subject, 
      gradeLevel, 
      lessonTopic, 
      examTime 
    } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Không có nội dung bài giảng. Vui lòng upload tài liệu trước.' },
        { status: 400 }
      );
    }

    // Giới hạn độ dài văn bản gửi đi
    const truncatedText = pdfText.substring(0, 30000);

    // Tạo prompt tự luận và gọi Gemini
    const prompt = createEssayPrompt(truncatedText, { subject, gradeLevel, lessonTopic, examTime });
    const essay = await callGemini(prompt, 'essay');

    return NextResponse.json({ essay });
  } catch (error) {
    console.error('[Gemini API] Lỗi khi gọi Gemini Essay:', error);
    return NextResponse.json(
      { error: 'Lỗi khi kết nối với AI để soạn đề tự luận: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
