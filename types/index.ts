// types/index.ts
// Định nghĩa các kiểu dữ liệu dùng trong project

import { QuizQuestion } from './quiz';
import { UserRole, SubscriptionPlan, AIModelTier } from './role';

export * from './role';
export * from './chat';
export * from './quiz';
export * from './summary';
export * from './document';

export interface User {
  username: string;
  fullName?: string;
  email?: string;
  emailVerified?: boolean;
  role: UserRole;
  room?: string;
  plan?: SubscriptionPlan;
  planActivatedAt?: string;
  planExpiresAt?: string;
  aiQuotaUsed?: number;
  aiQuotaDate?: string;
  preferredModel?: AIModelTier;
  xp?: number;
  streak?: number;
  lastActiveDate?: string;
  createdAt?: string;
}

export interface LicenseCodeItem {
  code: string;
  plan: SubscriptionPlan;
  durationDays: number;
  status: 'unused' | 'redeemed' | 'expired';
  targetEmail?: string;
  targetUsername?: string;
  createdBy: string;
  createdAt: string;
  redeemedBy?: string;
  redeemedAt?: string;
  amountVnd?: number;
}

export interface SubscriptionOrder {
  id: string;
  username: string;
  fullName?: string;
  email: string;
  plan: SubscriptionPlan;
  durationDays: number;
  amountVnd: number;
  licenseCode: string;
  status: 'code_sent' | 'redeemed';
  createdAt: string;
  redeemedAt?: string;
}

export interface MindmapNode {
  id: string;
  label: string;
  summary?: string;
  children?: MindmapNode[];
}

export interface PodcastTurn {
  speaker: 'teacher' | 'student';
  speakerName: string;
  text: string;
}

export interface Assignment {
  id: string;
  title: string;       // Tiêu đề của bài tập được giao
  type: 'quiz' | 'essay'; // Phân loại: trắc nghiệm (quiz) hoặc tự luận (essay)
  roomId: string;
  teacherUsername?: string;
  fileName: string;
  pdfText: string;
  questions?: QuizQuestion[]; // Tùy chọn (cho trắc nghiệm)
  essay?: string;            // Tùy chọn (cho tự luận)
  difficultyMatrix?: 'basic' | 'standard' | 'advanced';
  startTime: string;
  endTime: string;
  createdAt?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic?: string;
}

export type FlashcardItem = Flashcard;

export interface FlashcardProgress {
  cardId: string;
  status: 'forgot' | 'medium' | 'easy';
  lastReviewedAt: string;
}

// Thông tin file PDF đã upload
export interface FileInfo {
  fileName: string;   // Tên file
  fileSize: number;    // Dung lượng (bytes)
  pages: number;       // Số trang
  textLength: number;  // Số ký tự text
  pdfUrl?: string;     // Link đến file PDF đã lưu trên Firebase Storage
}

// Lịch sử thi của học sinh (Hỗ trợ cả trắc nghiệm và tự luận)
export interface QuizHistoryItem {
  id?: string;
  username?: string;     // Tên học sinh nộp bài
  fullName?: string;     // Họ và tên học sinh nộp bài
  assignmentId: string;
  roomId: string;
  fileName: string;
  score: number;         // Trắc nghiệm: số câu đúng; Tự luận: điểm số
  totalQuestions: number; // Trắc nghiệm: tổng số câu; Tự luận: 10
  scale10Score: string;  // Điểm số hệ 10
  submittedAt: string;

  // Trường mở rộng cho bài thi tự luận & trắc nghiệm
  type?: 'quiz' | 'essay';
  studentAnswer?: string; // Bài làm tự luận của học sinh (hoặc JSON đáp án trắc nghiệm đã chọn)
  handwritingImageUrl?: string; // Ảnh chụp vở viết tay (nếu nộp qua OCR)
  aiFeedback?: string;     // Nhận xét chi tiết của AI
  teacherComment?: string; // Nhận xét thủ công của giáo viên (tùy chọn)
  teacherScoreOverride?: number; // Điểm giáo viên chấm lại
  status?: 'pending' | 'graded'; // Trạng thái chấm bài
  questions?: QuizQuestion[]; // Lưu bộ câu hỏi đã làm (để giáo viên xem lại đúng thứ tự đã đảo)
  modelUsed?: AIModelTier;
}
