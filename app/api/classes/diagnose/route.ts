// app/api/classes/diagnose/route.ts
// API chẩn đoán điểm yếu lớp học bằng AI dành cho giáo viên

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { callGemini } from '@/lib/gemini';
import { createClassDiagnosticPrompt } from '@/lib/prompts';
import { QuizHistoryItem } from '@/types';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const localFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'history.json') : 'history.json';

// Đọc danh sách lịch sử nộp bài của lớp học
async function getClassHistory(roomId: string): Promise<QuizHistoryItem[]> {
  if (db) {
    try {
      const snapshot = await db.collection('history').where('roomId', '==', roomId).get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => doc.data() as QuizHistoryItem);
      }
    } catch (error) {
      console.error('Error fetching history from Firebase for diagnose:', error);
    }
  }

  if (fs.existsSync(localFilePath)) {
    try {
      const data = fs.readFileSync(localFilePath, 'utf-8');
      const list = JSON.parse(data) as QuizHistoryItem[];
      return list.filter(item => item.roomId === roomId);
    } catch (error) {
      console.error('Error reading local history cache for diagnose:', error);
    }
  }

  return [];
}

export async function POST(request: NextRequest) {
  try {
    const { classCode } = await request.json();

    if (!classCode) {
      return NextResponse.json({ error: 'Mã lớp học không hợp lệ.' }, { status: 400 });
    }

    const historyItems = await getClassHistory(classCode);

    if (historyItems.length === 0) {
      return NextResponse.json({
        report: '### Báo cáo chẩn đoán lớp học bằng AI\n\n**Hiện tại lớp học này chưa có học sinh nào nộp bài tập trắc nghiệm hay tự luận.** AI cần dữ liệu kết quả bài làm của học sinh để phân tích và chỉ ra các khái niệm các em học sinh đang gặp khó khăn. Hãy hướng dẫn các em học sinh tham gia lớp và làm bài kiểm tra đã giao trước!'
      });
    }

    // Rút gọn thông tin nộp bài để tiết kiệm token và đảm bảo tốc độ phân tích
    const briefHistory = historyItems.map(item => {
      let answersBrief = '';
      if (item.studentAnswer && item.type === 'quiz') {
        try {
          const parsed = JSON.parse(item.studentAnswer);
          answersBrief = Object.entries(parsed).map(([qIdx, ans]) => `Q${Number(qIdx)+1}:${ans}`).join(', ');
        } catch {
          answersBrief = 'Ko parse được';
        }
      }

      return {
        student: item.fullName || item.username,
        type: item.type || 'quiz',
        score: item.scale10Score,
        fileName: item.fileName,
        studentAnswers: answersBrief,
        aiFeedbackSummary: item.aiFeedback ? item.aiFeedback.substring(0, 150) + '...' : undefined
      };
    });

    const submissionsJson = JSON.stringify(briefHistory, null, 2);
    const prompt = createClassDiagnosticPrompt(submissionsJson);

    // Gọi Gemini với vai trò chat để trả về nội dung Markdown
    const response = await callGemini(prompt, 'chat', false);

    return NextResponse.json({ report: response });
  } catch (error) {
    console.error('Lỗi khi chẩn đoán lớp học bằng AI:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lỗi server khi chẩn đoán lớp học.' },
      { status: 500 }
    );
  }
}
