// app/api/mindmap/route.ts
// API đa năng tạo: (1) Sơ đồ tư duy AI Mindmap, (2) Kịch bản Podcast Bài Giảng (Audio Overview), (3) Giáo án chuẩn 5512

import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createMindmapPrompt, createPodcastPrompt, createLessonPlan5512Prompt } from '@/lib/prompts';
import { AIModelTier, MindmapNode, PodcastTurn } from '@/types';
import { checkAndConsumeAiQuota } from '@/lib/quota';

export async function POST(request: NextRequest) {
  try {
    const {
      pdfText,
      fileName = 'Tài liệu bài học',
      mode = 'mindmap', // 'mindmap' | 'podcast' | 'lesson_plan'
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
        { error: 'Không có nội dung tài liệu để phân tích.' },
        { status: 400 }
      );
    }

    const truncatedText = pdfText.substring(0, 28000);

    if (mode === 'lesson_plan') {
      const prompt = createLessonPlan5512Prompt(truncatedText, fileName);
      const lessonPlan = await callGemini(prompt, 'summarize', false, quota.effectiveModelTier);
      return NextResponse.json({
        lessonPlan,
        modelUsed: quota.effectiveModelTier,
      });
    }

    if (mode === 'podcast') {
      const prompt = createPodcastPrompt(truncatedText, fileName);
      const rawResponse = await callGemini(prompt, 'summarize', true, quota.effectiveModelTier);
      let jsonStr = rawResponse.trim();
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
      const parsed = JSON.parse(jsonStr);
      const podcast: PodcastTurn[] = Array.isArray(parsed.podcast) ? parsed.podcast : [];
      return NextResponse.json({
        podcast,
        modelUsed: quota.effectiveModelTier,
      });
    }

    // Default: mode === 'mindmap'
    const prompt = createMindmapPrompt(truncatedText, fileName);
    const rawResponse = await callGemini(prompt, 'summarize', true, quota.effectiveModelTier);
    let jsonStr = rawResponse.trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(jsonStr);
    const mindmap: MindmapNode = parsed.mindmap || parsed;

    return NextResponse.json({
      mindmap,
      modelUsed: quota.effectiveModelTier,
    });
  } catch (error) {
    console.error('[Mindmap/Podcast API] Lỗi:', error);
    return NextResponse.json(
      { error: 'Không thể khởi tạo dữ liệu AI lúc này. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
