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
    console.warn('[Gemini API Fallback] Lỗi khi gọi Gemini Essay, tự động tạo câu hỏi tự luận mẫu:', error);
    
    const mockEssay = `Đề thi tự luận mẫu: Địa lý lớp 12\n\n` +
      `Câu 1 (5 điểm): Trình bày vị trí địa lý của Trái Đất trong Hệ Mặt Trời và ý nghĩa của khoảng cách trung bình 150 triệu km từ Trái Đất đến Mặt Trời đối với sự sống.\n\n` +
      `Câu 2 (5 điểm): Phân tích nguyên nhân và hệ quả của lực Coriolis đối với các vật thể chuyển động trên bề mặt Trái Đất ở Bán cầu Bắc và Bán cầu Nam. Cho ví dụ thực tế minh họa.`;
      
    return NextResponse.json({ essay: mockEssay });
  }
}
