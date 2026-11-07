// app/api/flashcards/route.ts
// API sinh thẻ ghi nhớ thông minh (AI Spaced Repetition Flashcards) từ nội dung tài liệu

import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createFlashcardsPrompt } from '@/lib/prompts';
import { Flashcard, AIModelTier } from '@/types';
import { checkAndConsumeAiQuota } from '@/lib/quota';

export async function POST(request: NextRequest) {
  try {
    const { pdfText, modelTier } = await request.json();

    const requestedTier: AIModelTier = ['flash', 'pro', 'ultra'].includes(modelTier) ? modelTier : 'flash';
    const quota = await checkAndConsumeAiQuota(request, requestedTier, 10);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.error, upgradeRequired: quota.upgradeRequired },
        { status: 403 }
      );
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Chưa có nội dung tài liệu. Vui lòng mở tài liệu trước.' },
        { status: 400 }
      );
    }

    const truncatedText = pdfText.substring(0, 30000);
    const prompt = createFlashcardsPrompt(truncatedText);
    const response = await callGemini(prompt, 'quiz', true, quota.effectiveModelTier);

    let jsonString = response.trim();
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonString);
    const flashcards: Flashcard[] = Array.isArray(parsed.flashcards) ? parsed.flashcards : (Array.isArray(parsed) ? parsed : []);

    if (flashcards.length === 0) {
      throw new Error('Không trích xuất được thẻ ghi nhớ từ tài liệu.');
    }

    return NextResponse.json({
      flashcards,
      modelUsed: quota.effectiveModelTier,
    });
  } catch (error) {
    console.error('[Flashcards API] Lỗi:', error);
    return NextResponse.json(
      { error: 'Không thể tạo thẻ ghi nhớ lúc này: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
