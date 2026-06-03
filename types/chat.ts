// types/chat.ts
// Định nghĩa cấu trúc tin nhắn chat

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  timestamp?: Date; // Giữ để tương thích với cấu trúc cũ nếu cần
}
