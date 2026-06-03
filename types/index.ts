// types/index.ts
// Định nghĩa các kiểu dữ liệu dùng trong project

import { QuizQuestion } from './quiz';

export * from './role';
export * from './chat';
export * from './quiz';
export * from './summary';
export * from './document';

export interface User {
  username: string;
  fullName?: string;
  role: 'teacher' | 'student';
  room?: string;
}

export interface Assignment {
  id: string;
  title: string;       // Tiêu đề của bài tập được giao
  type: 'quiz' | 'essay'; // Phân loại: trắc nghiệm (quiz) hoặc tự luận (essay)
  roomId: string;
  fileName: string;
  pdfText: string;
  questions?: QuizQuestion[]; // Tùy chọn (cho trắc nghiệm)
  essay?: string;            // Tùy chọn (cho tự luận)
  startTime: string;
  endTime: string;
}

// Thông tin file PDF đã upload
export interface FileInfo {
  fileName: string;   // Tên file
  fileSize: number;    // Dung lượng (bytes)
  pages: number;       // Số trang
  textLength: number;  // Số ký tự text
  pdfUrl?: string;     // Link đến file PDF đã lưu trên Vercel Blob
}

// Lịch sử thi của học sinh (Hỗ trợ cả trắc nghiệm và tự luận)
export interface QuizHistoryItem {
  username?: string;     // Tên học sinh nộp bài
  fullName?: string;     // Họ và tên học sinh nộp bài
  assignmentId: string;
  roomId: string;
  fileName: string;
  score: number;         // Trắc nghiệm: số câu đúng; Tự luận: điểm số
  totalQuestions: number; // Trắc nghiệm: tổng số câu; Tự luận: 10
  scale10Score: string;  // Điểm số hệ 10
  submittedAt: string;

  // Trường mở rộng cho bài thi tự luận
  type?: 'quiz' | 'essay';
  studentAnswer?: string; // Bài làm tự luận của học sinh
  aiFeedback?: string;     // Nhận xét chi tiết của AI
  teacherComment?: string; // Nhận xét thủ công của giáo viên (tùy chọn)
  status?: 'pending' | 'graded'; // Trạng thái chấm bài
}

