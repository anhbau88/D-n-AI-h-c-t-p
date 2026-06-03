// types/summary.ts
// Định nghĩa cấu trúc lưu trữ bản tóm tắt SavedSummary

import { UserRole } from './role';
import { QuizQuestion } from './quiz';
import { ChatMessage } from './chat';

export type SourceFileType = 'pdf' | 'docx';

export interface SavedSummary {
  id: string;
  role: UserRole;
  title: string;
  category: string;
  note?: string;
  sourceFileName: string;
  sourceFileType: SourceFileType;
  sourceFileSize: number;
  summary: string;
  quiz?: QuizQuestion[];
  chatHistory?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
