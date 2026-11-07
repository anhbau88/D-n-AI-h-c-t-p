// app/api/quiz/route.ts
// API tạo trắc nghiệm từ tài liệu (hỗ trợ Ma trận độ khó 4 mức độ, Luyện lại câu sai Adaptive Drill & Chọn Model AI)

import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createQuizPrompt, createAdaptiveDrillPrompt } from '@/lib/prompts';
import { QuizQuestion, AIModelTier } from '@/types';
import { checkAndConsumeAiQuota } from '@/lib/quota';

export async function POST(request: NextRequest) {
  try {
    const {
      pdfText,
      questionCount = 5,
      role = 'student',
      difficultyMatrix = 'standard',
      wrongQuestionsSummary,
      modelTier,
    } = await request.json();

    const requestedTier: AIModelTier = ['flash', 'pro', 'ultra'].includes(modelTier) ? modelTier : 'flash';
    const quota = await checkAndConsumeAiQuota(request, requestedTier, 15);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.error, upgradeRequired: quota.upgradeRequired },
        { status: 403 }
      );
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Chưa có tài liệu. Vui lòng upload PDF trước.' },
        { status: 400 }
      );
    }

    const truncatedText = pdfText.substring(0, 30000);
    const count = Math.min(20, Math.max(1, questionCount));

    let prompt = '';
    if (wrongQuestionsSummary && String(wrongQuestionsSummary).trim().length > 0) {
      prompt = createAdaptiveDrillPrompt(truncatedText, String(wrongQuestionsSummary), count);
    } else {
      prompt = createQuizPrompt(truncatedText, count);
      if (difficultyMatrix === 'basic') {
        prompt += '\n\nMA TRẬN ĐỘ KHÓ: Tập trung 70% Nhận biết, 30% Thông hiểu. Câu hỏi rõ ràng, giúp học sinh nắm chắc kiến thức nền tảng.';
      } else if (difficultyMatrix === 'advanced') {
        prompt += '\n\nMA TRẬN ĐỘ KHÓ NÂNG CAO (CHUẨN THI THPT QUỐC GIA / HỌC SINH GIỎI): Phân bổ 20% Thông hiểu, 50% Vận dụng và 30% Vận dụng cao. Các phương án nhiễu phải có tính phân loại cao.';
      } else {
        prompt += '\n\nMA TRẬN ĐỘ KHÓ CHUẨN BỘ GD&ĐT: Phân bổ 40% Nhận biết, 30% Thông hiểu, 20% Vận dụng, 10% Vận dụng cao.';
      }

      if (role === 'student') {
        prompt += '\nLƯU Ý: Giải thích đáp án dễ hiểu, gần gũi để học sinh tự học.';
      } else {
        prompt += '\nLƯU Ý: Câu hỏi chuẩn mực sư phạm để giáo viên dùng làm đề kiểm tra chính thức.';
      }
    }

    const response = await callGemini(prompt, 'quiz', true, quota.effectiveModelTier);

    let jsonString = response.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

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

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Format JSON không hợp lệ');
    }

    return NextResponse.json({
      questions,
      modelUsed: quota.effectiveModelTier,
      quotaUsed: quota.quotaUsed,
      quotaLimit: quota.quotaLimit,
    });
  } catch (error) {
    console.error('[Gemini API] Lỗi khi gọi Gemini Quiz:', error);
    return NextResponse.json(
      { error: 'Lỗi khi kết nối với AI để soạn câu hỏi trắc nghiệm: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
