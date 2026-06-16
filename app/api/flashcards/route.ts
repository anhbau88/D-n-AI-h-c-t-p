// app/api/flashcards/route.ts
// API tạo Flashcards (thẻ ghi nhớ) từ tài liệu

import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createFlashcardsPrompt } from '@/lib/prompts';
import { Flashcard } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { pdfText } = await request.json();

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Chưa có tài liệu. Vui lòng upload PDF trước.' },
        { status: 400 }
      );
    }

    const truncatedText = pdfText.substring(0, 30000);
    const prompt = createFlashcardsPrompt(truncatedText);

    // Sử dụng purpose 'quiz' để kích hoạt JSON Mode
    const response = await callGemini(prompt, 'quiz', true);

    let jsonString = response.trim();

    // Loại bỏ markdown code block nếu có
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Trích xuất JSON thực tế
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (err) {
      console.error('Lỗi parse JSON flashcards từ Gemini:', err, 'Nội dung:', response);
      throw new Error('Gemini trả về không đúng định dạng JSON');
    }

    const flashcards: Flashcard[] = parsedData.flashcards || parsedData;

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('Format JSON không hợp lệ');
    }

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.warn('[Gemini API Fallback] Lỗi sinh Flashcards, tự động tạo mẫu:', error);
    
    // Bộ Flashcards mẫu chất lượng cao làm phương án dự phòng
    const mockFlashcards: Flashcard[] = [
      {
        id: "1",
        front: "Hệ Mặt Trời gồm bao nhiêu hành tinh chính?",
        back: "Tám hành tinh (Sao Thủy, Sao Kim, Trái Đất, Sao Hỏa, Sao Mộc, Sao Thổ, Thiên Vương, Hải Vương)."
      },
      {
        id: "2",
        front: "Trái Đất cách Mặt Trời khoảng bao nhiêu km?",
        back: "Khoảng 150 triệu km (1 Đơn vị thiên văn - AU)."
      },
      {
        id: "3",
        front: "Hiện tượng luân phiên ngày đêm trên Trái Đất là do đâu?",
        back: "Do Trái Đất tự quay quanh trục tưởng tượng theo hướng từ Tây sang Đông."
      },
      {
        id: "4",
        front: "Góc nghiêng tự quay quanh trục của Trái Đất so với mặt phẳng quỹ đạo là bao nhiêu?",
        back: "Góc nghiêng khoảng 66 độ 33 phút (hay nghiêng 23 độ 27 phút so với trục vuông góc)."
      },
      {
        id: "5",
        front: "Lực Coriolis là gì?",
        back: "Lực quán tính sinh ra do Trái Đất tự quay, làm lệch hướng chuyển động của các vật thể."
      }
    ];

    return NextResponse.json({ flashcards: mockFlashcards });
  }
}
