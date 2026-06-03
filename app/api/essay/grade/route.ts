// app/api/essay/grade/route.ts
// API tự động chấm điểm bài tự luận của học sinh bằng Gemini

import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createGradeEssayPrompt } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const { essayQuestion, studentAnswer, pdfText } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!essayQuestion) {
      return NextResponse.json(
        { error: 'Không tìm thấy đề bài tự luận.' },
        { status: 400 }
      );
    }

    if (!studentAnswer || studentAnswer.trim().length < 10) {
      return NextResponse.json(
        { error: 'Bài làm của bạn quá ngắn. Vui lòng viết câu trả lời đầy đủ trước khi nộp.' },
        { status: 400 }
      );
    }

    // Giới hạn độ dài tài liệu ôn tập và bài làm để tránh tràn context
    const referenceText = pdfText ? pdfText.substring(0, 25000) : 'Không có tài liệu tham khảo cụ thể.';
    const truncatedQuestion = essayQuestion.substring(0, 5000);
    const truncatedAnswer = studentAnswer.substring(0, 5000);

    // Tạo prompt và gọi AI với jsonMode = true
    const prompt = createGradeEssayPrompt(referenceText, truncatedQuestion, truncatedAnswer);
    const aiResponseText = await callGemini(prompt, 'essay', true);

    // Parse kết quả trả về từ Gemini
    let gradedResult;
    try {
      gradedResult = JSON.parse(aiResponseText.trim());
    } catch (parseError) {
      console.error('Lỗi phân tích cú pháp kết quả chấm bài của Gemini:', aiResponseText, parseError);
      
      // Fallback nếu AI không trả về JSON chuẩn
      const scoreMatch = aiResponseText.match(/"score"\s*:\s*([0-9.]+)/i);
      const scoreVal = scoreMatch ? parseFloat(scoreMatch[1]) : 7.0;
      gradedResult = {
        score: isNaN(scoreVal) ? 7.0 : scoreVal,
        feedback: aiResponseText
      };
    }

    // Đảm bảo điểm số hợp lệ
    let finalScore = typeof gradedResult.score === 'number' ? gradedResult.score : parseFloat(gradedResult.score);
    if (isNaN(finalScore)) {
      finalScore = 7.0;
    }
    finalScore = Math.min(10, Math.max(0, finalScore));

    return NextResponse.json({
      score: finalScore,
      feedback: gradedResult.feedback || 'Không có nhận xét chi tiết.'
    });
  } catch (error) {
    console.error('Lỗi khi chấm bài tự luận:', error);
    return NextResponse.json(
      { error: 'Không thể chấm bài tự luận tại thời điểm này. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
