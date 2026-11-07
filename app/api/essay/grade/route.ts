// app/api/essay/grade/route.ts
// API tự động chấm điểm bài tự luận của học sinh bằng Gemini (Hỗ trợ chấm cả văn bản gõ phím & ảnh chụp vở viết tay OCR)

import { NextRequest, NextResponse } from 'next/server';
import { callGemini, callGeminiMultimodal } from '@/lib/gemini';
import { createGradeEssayPrompt } from '@/lib/prompts';
import { checkAndConsumeAiQuota } from '@/lib/quota';
import { AIModelTier } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const {
      essayQuestion,
      studentAnswer,
      pdfText,
      handwritingImageBase64,
      modelTier,
    } = await request.json();

    const requestedTier: AIModelTier = ['flash', 'pro', 'ultra'].includes(modelTier) ? modelTier : 'flash';
    const quota = await checkAndConsumeAiQuota(request, requestedTier, 25);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.error, upgradeRequired: quota.upgradeRequired },
        { status: 403 }
      );
    }

    if (!essayQuestion) {
      return NextResponse.json(
        { error: 'Không tìm thấy đề bài tự luận.' },
        { status: 400 }
      );
    }

    let finalStudentAnswer = (studentAnswer || '').trim();
    let extractedFromHandwriting = false;

    // Nếu học sinh đính kèm ảnh chụp bài viết tay (Handwriting OCR Grading)
    if (handwritingImageBase64 && typeof handwritingImageBase64 === 'string') {
      try {
        const matches = handwritingImageBase64.match(/^data:([^;]+);base64,(.+)$/);
        const mimeType = matches ? matches[1] : 'image/jpeg';
        const base64Data = matches ? matches[2] : handwritingImageBase64;
        const imgBuffer = Buffer.from(base64Data, 'base64');

        const ocrPrompt = `Đây là ảnh chụp trang vở bài làm tự luận viết tay của học sinh.
Hãy đọc và trích xuất chính xác 100% toàn bộ chữ viết tay của học sinh trong bức ảnh này thành văn bản tiếng Việt hoàn chỉnh.
Giữ nguyên cách chia đoạn và câu chữ của học sinh để giáo viên chấm điểm. Chỉ trả về nội dung văn bản đọc được, không thêm lời bình luận.`;

        const ocrText = await callGeminiMultimodal(imgBuffer, mimeType, ocrPrompt, quota.effectiveModelTier);
        if (ocrText && ocrText.trim().length > 0) {
          finalStudentAnswer = finalStudentAnswer
            ? `${finalStudentAnswer}\n\n[Nội dung trích xuất từ ảnh chụp vở viết tay]:\n${ocrText.trim()}`
            : ocrText.trim();
          extractedFromHandwriting = true;
        }
      } catch (ocrErr) {
        console.error('Lỗi OCR bài tự luận viết tay:', ocrErr);
        if (!finalStudentAnswer) {
          return NextResponse.json(
            { error: 'Không thể nhận diện chữ viết trong ảnh. Vui lòng chụp ảnh rõ nét hơn hoặc gõ văn bản.' },
            { status: 400 }
          );
        }
      }
    }

    if (!finalStudentAnswer || finalStudentAnswer.trim().length < 10) {
      return NextResponse.json(
        { error: 'Bài làm của bạn quá ngắn. Vui lòng viết câu trả lời đầy đủ hoặc tải ảnh bài viết rõ nét trước khi nộp.' },
        { status: 400 }
      );
    }

    const referenceText = pdfText ? pdfText.substring(0, 25000) : 'Không có tài liệu tham khảo cụ thể.';
    const truncatedQuestion = essayQuestion.substring(0, 5000);
    const truncatedAnswer = finalStudentAnswer.substring(0, 6000);

    const prompt = createGradeEssayPrompt(referenceText, truncatedQuestion, truncatedAnswer);
    const aiResponseText = await callGemini(prompt, 'essay', true, quota.effectiveModelTier);

    let gradedResult;
    try {
      let cleanJson = aiResponseText.trim();
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }
      gradedResult = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Lỗi phân tích cú pháp kết quả chấm bài của Gemini:', aiResponseText, parseError);
      const scoreMatch = aiResponseText.match(/"score"\s*:\s*([0-9.]+)/i);
      const scoreVal = scoreMatch ? parseFloat(scoreMatch[1]) : 7.0;
      gradedResult = {
        score: isNaN(scoreVal) ? 7.0 : scoreVal,
        feedback: aiResponseText
      };
    }

    let finalScore = typeof gradedResult.score === 'number' ? gradedResult.score : parseFloat(gradedResult.score);
    if (isNaN(finalScore)) {
      finalScore = 7.0;
    }
    finalScore = Math.min(10, Math.max(0, finalScore));

    return NextResponse.json({
      score: finalScore,
      feedback: gradedResult.feedback || 'Không có nhận xét chi tiết.',
      recognizedStudentAnswer: finalStudentAnswer,
      extractedFromHandwriting,
      modelUsed: quota.effectiveModelTier,
    });
  } catch (error) {
    console.error('Lỗi khi chấm bài tự luận:', error);
    return NextResponse.json(
      { error: 'Không thể chấm bài tự luận tại thời điểm này. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
