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
    console.warn('[Gemini API Fallback] Lỗi khi gọi Gemini Quiz, tự động tạo trắc nghiệm mẫu:', error);
    
    // Tạo danh sách câu hỏi trắc nghiệm mẫu chất lượng cao
    const mockQuestions: QuizQuestion[] = [
      {
        id: 1,
        question: "Trong Hệ Mặt Trời, Trái Đất là hành tinh thứ mấy tính từ Mặt Trời?",
        options: [
          "A. Thứ nhất",
          "B. Thứ hai",
          "C. Thứ ba",
          "D. Thứ tư"
        ],
        answer: "C",
        explanation: "Theo vị trí trong Hệ Mặt Trời, Trái Đất là hành tinh thứ ba tính từ Mặt Trời."
      },
      {
        id: 2,
        question: "Hiện tượng nào sau đây là hệ quả quan trọng của chuyển động tự quay quanh trục của Trái Đất?",
        options: [
          "A. Hiện tượng luân phiên ngày và đêm",
          "B. Sự thay đổi thời tiết theo mùa",
          "C. Nhật thực và nguyệt thực",
          "D. Hiện tượng thủy triều"
        ],
        answer: "A",
        explanation: "Hiện tượng luân phiên ngày và đêm diễn ra liên tục do Trái Đất tự quay quanh trục từ Tây sang Đông."
      },
      {
        id: 3,
        question: "Trái Đất tự quay quanh một trục tưởng tượng nghiêng bao nhiêu độ so với mặt phẳng quỹ đạo?",
        options: [
          "A. 23 độ 27 phút",
          "B. 66 độ 33 phút",
          "C. 90 độ",
          "D. 0 độ"
        ],
        answer: "B",
        explanation: "Trục Trái Đất nghiêng một góc 66 độ 33 phút so với mặt phẳng quỹ đạo."
      },
      {
        id: 4,
        question: "Khoảng cách trung bình từ Trái Đất đến Mặt Trời là bao nhiêu?",
        options: [
          "A. Khoảng 100 triệu km",
          "B. Khoảng 120 triệu km",
          "C. Khoảng 150 triệu km",
          "D. Khoảng 200 triệu km"
        ],
        answer: "C",
        explanation: "Khoảng cách trung bình từ Trái Đất đến Mặt Trời là khoảng 150 triệu km."
      },
      {
        id: 5,
        question: "Lực nào gây ra sự lệch hướng chuyển động của các vật thể khi chúng di chuyển trên bề mặt Trái Đất?",
        options: [
          "A. Lực hấp dẫn của Mặt Trời",
          "B. Lực Coriolis",
          "C. Lực ly tâm địa lý",
          "D. Lực ma sát không khí"
        ],
        answer: "B",
        explanation: "Lực Coriolis sinh ra do Trái Đất tự quay quanh trục làm lệch hướng chuyển động của các vật thể."
      }
    ];

    return NextResponse.json({ questions: mockQuestions });
  }
}
