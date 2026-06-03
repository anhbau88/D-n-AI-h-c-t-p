// types/quiz.ts
// Định nghĩa câu hỏi trắc nghiệm

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}
