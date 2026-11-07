// app/api/essay/route.ts
// API tạo câu hỏi tự luận bằng Gemini (hỗ trợ chọn Model AI Flash / Pro / Ultra)

import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createEssayPrompt } from '@/lib/prompts';
import { checkAndConsumeAiQuota } from '@/lib/quota';
import { AIModelTier } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { 
      pdfText, 
      subject, 
      gradeLevel, 
      lessonTopic, 
      examTime,
      modelTier
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
        { error: 'Không có nội dung bài giảng. Vui lòng upload tài liệu trước.' },
        { status: 400 }
      );
    }

    const truncatedText = pdfText.substring(0, 30000);
    const prompt = createEssayPrompt(truncatedText, { subject, gradeLevel, lessonTopic, examTime });
    const essay = await callGemini(prompt, 'essay', false, quota.effectiveModelTier);

    return NextResponse.json({
      essay,
      modelUsed: quota.effectiveModelTier,
      quotaUsed: quota.quotaUsed,
      quotaLimit: quota.quotaLimit,
    });
  } catch (error) {
    console.error('[Gemini API] Lỗi khi gọi Gemini Essay:', error);
    return NextResponse.json(
      { error: 'Lỗi khi kết nối với AI để soạn đề tự luận: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
