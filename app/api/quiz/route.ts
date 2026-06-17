// app/api/quiz/route.ts
// API tạo trắc nghiệm từ tài liệu

import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createQuizPrompt } from '@/lib/prompts';
import { QuizQuestion } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { pdfText, questionCount = 5, role = 'student' } = await request.json();

    // Kiểm tra input
    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Chưa có tài liệu. Vui lòng upload PDF trước.' },
        { status: 400 }
      );
    }

    // Cắt bớt text nếu quá dài
    const truncatedText = pdfText.substring(0, 30000);
    const count = Math.min(19, Math.max(1, questionCount));

    // Tạo prompt và gọi Gemini
    let prompt = createQuizPrompt(truncatedText, count);
    if (role === 'student') {
      prompt += '\n\nLƯU Ý QUAN TRỌNG: Các câu hỏi hướng đến mục tiêu giúp HỌC SINH tự ôn tập và kiểm tra kiến thức cá nhân. Cần viết lời giải thích dễ hiểu, gần gũi.';
    } else {
      prompt += '\n\nLƯU Ý QUAN TRỌNG: Các câu hỏi hướng đến mục tiêu giúp GIÁO VIÊN làm bài kiểm tra hoặc đánh giá lớp học. Cần có độ phân hóa tốt, tính học thuật cao.';
    }

    const response = await callGemini(prompt, 'quiz', true); // Bật JSON Mode

    // Parse JSON từ response
    let jsonString = response.trim();

    // Loại bỏ markdown code block nếu có
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Trích xuất phần JSON thực tế nằm trong cặp ngoặc { ... } hoặc [ ... ] đề phòng AI sinh text thừa
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (err) {
      console.error('Lỗi parse JSON từ Gemini:', err, 'Nội dung phản hồi:', response);
      throw new Error('Gemini trả về không đúng định dạng JSON');
    }

    const questions: QuizQuestion[] = parsedData.questions || parsedData;

    // Validate format
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Format JSON không hợp lệ');
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('[Gemini API] Lỗi khi gọi Gemini Quiz:', error);
    return NextResponse.json(
      { error: 'Lỗi khi kết nối với AI để soạn câu hỏi trắc nghiệm: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
