// types/document.ts
// Định nghĩa kiểu dữ liệu cho tài liệu lưu trữ

import { UserRole } from './role';
import { QuizQuestion } from './quiz';
import { ChatMessage } from './chat';
import { Flashcard, MindmapNode, PodcastTurn } from './index';
export type FlashcardItem = Flashcard;
export type SavedDocument = DocumentItem;

export interface DocumentItem {
  id: string;
  role: UserRole; // Vai trò của người dùng hiện tại lúc upload
  ownerUsername?: string; // Chủ sở hữu tài liệu (Multi-tenant isolation)
  visibility?: 'private' | 'class' | 'public'; // Chế độ chia sẻ
  fileName: string;
  fileSize: number;
  fileType: string;
  pages?: number;
  uploadedAt: string;
  lastOpenedAt: string;
  hash: string; // Hash SHA-256 để kiểm tra trùng lặp
  pdfUrl?: string; // Link đến file gốc
  textContent: string; // Nội dung văn bản trích xuất từ PDF/Word/Ảnh
  summary?: string; // Cache kết quả tóm tắt từ AI
  mindmap?: MindmapNode; // Cache sơ đồ tư duy từ AI
  podcast?: PodcastTurn[]; // Cache kịch bản Podcast đối thoại Thầy & Trò từ AI
  lessonPlan?: string; // Cache Giáo án 5512 của Giáo viên
  quiz?: QuizQuestion[]; // Cache danh sách câu hỏi trắc nghiệm từ AI
  flashcards?: Flashcard[]; // Cache danh sách thẻ ghi nhớ từ AI
  chatHistory?: ChatMessage[]; // Cache lịch sử hỏi đáp với AI
  essay?: string; // Cache câu hỏi tự luận của Giáo viên
  outline?: string; // Cache dàn ý bài giảng của Giáo viên
  ownerType: UserRole; // Để tách biệt dữ liệu giữa student_documents và teacher_documents
  subject?: string; // Chủ đề hoặc tên môn học (GV quản lý)
  status: "processed" | "unprocessed";
}
