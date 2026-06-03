// types/document.ts
// Định nghĩa kiểu dữ liệu cho tài liệu lưu trữ trong IndexedDB

import { UserRole } from './role';
import { QuizQuestion } from './quiz';
import { ChatMessage } from './chat';

export interface DocumentItem {
  id: string;
  role: UserRole; // Vai trò của người dùng hiện tại lúc upload ('student' hoặc 'teacher')
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  lastOpenedAt: string;
  hash: string; // Hash SHA-256 để kiểm tra trùng lặp
  pdfUrl?: string; // Link đến file PDF đã lưu trên Vercel Blob
  textContent: string; // Nội dung văn bản trích xuất từ PDF/Word
  summary?: string; // Cache kết quả tóm tắt từ AI
  quiz?: QuizQuestion[]; // Cache danh sách câu hỏi trắc nghiệm từ AI
  chatHistory?: ChatMessage[]; // Cache lịch sử hỏi đáp với AI
  essay?: string; // Cache câu hỏi tự luận của Giáo viên
  outline?: string; // Cache dàn ý bài giảng của Giáo viên
  ownerType: UserRole; // Để tách biệt dữ liệu giữa student_documents và teacher_documents
  subject?: string; // Chủ đề hoặc tên môn học (GV quản lý)
  status: "processed" | "unprocessed";
}
