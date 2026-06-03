// components/ChatBox.tsx
// Giao diện chat hỏi đáp với AI trợ lý, hỗ trợ đồng bộ lịch sử hỏi đáp (chatHistory)

'use client';

import { useRef, useEffect, useState, useCallback, ChangeEvent } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/types';
import { useChat, Message } from 'ai/react';

interface ChatBoxProps {
  pdfText: string;
  userRole?: 'teacher' | 'student';
  onError: (message: string) => void;
  chatHistory?: ChatMessage[];
  onSendMessage?: (updatedHistory: ChatMessage[]) => void;
}

export default function ChatBox({
  pdfText,
  userRole,
  onError,
  chatHistory = [],
  onSendMessage
}: ChatBoxProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const onSendMessageRef = useRef(onSendMessage);
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  useEffect(() => {
    onSendMessageRef.current = onSendMessage;
  }, [onSendMessage]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: chatHistory as unknown as Message[],
    body: { pdfText, imageAttachment, userRole },
    onError: (err: Error) => {
      onError(err.message || 'Lỗi khi gửi câu hỏi');
    }
  });

  // Cập nhật messages state khi chatHistory từ props thay đổi đã bị xoá
  // Thay vào đó ta sẽ dùng key={activeDoc.id} ở app/page.tsx để unmount/remount component

  // Smart auto-scroll: chỉ cuộn xuống khi người dùng không chủ động cuộn lên
  const handleChatScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setIsUserScrolledUp(distanceFromBottom > 100);
  }, []);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsUserScrolledUp(false);
  }, []);

  useEffect(() => {
    if (!isUserScrolledUp) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isUserScrolledUp]);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && onSendMessageRef.current) {
      const formattedMessages: ChatMessage[] = messages.map((m: Message) => ({
        id: m.id,
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : (typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString()),
      }));
      onSendMessageRef.current(formattedMessages);
    }
  }, [messages, isLoading]);

  const handleSend = (e?: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    e?.preventDefault();
    if (!input.trim()) return;

    if (userRole === 'teacher' && !pdfText) {
      onError('Vui lòng upload PDF trước khi chat.');
      return;
    }

    handleSubmit(e as React.FormEvent<HTMLFormElement>);
    
    // Xóa ảnh đính kèm sau khi gửi
    setTimeout(() => {
      setImageAttachment(null);
    }, 100);
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageAttachment(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <Card className="p-0 border-0 shadow-lg bg-white/85 dark:bg-gray-900/85 backdrop-blur-sm flex flex-col h-[520px] overflow-hidden relative">
      {/* Vùng hiển thị lịch sử chat */}
      <div
        ref={chatContainerRef}
        onScroll={handleChatScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 relative"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-medium text-gray-500 dark:text-gray-400">Hỏi bất kỳ điều gì về tài liệu</p>
            <p className="text-xs mt-1.5 text-center max-w-xs text-gray-400">
              VD: &quot;Tóm tắt nội dung chính&quot;, &quot;Giải thích các luận điểm trọng tâm&quot;
            </p>
          </div>
        ) : (
          messages.map((msg: Message) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`
                  max-w-[85%] rounded-2xl px-4 py-2.5 text-sm
                  ${msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm'
                  }
                `}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none
                    prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:my-1 prose-p:leading-relaxed
                    prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:my-0.5
                    prose-strong:text-gray-800 dark:prose-strong:text-gray-100
                    prose-headings:mt-2 prose-headings:mb-1
                  ">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}

        {/* Trạng thái AI đang suy nghĩ */}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex space-x-1.5 items-center">
                <span className="text-[10px] text-gray-400 mr-1">AI Study Assistant đang gõ</span>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Nút cuộn xuống khi người dùng cuộn lên */}
      {isUserScrolledUp && messages.length > 0 && (
        <div className="absolute bottom-[72px] right-6 z-10">
          <button
            type="button"
            onClick={scrollToBottom}
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all hover:scale-105 animate-in fade-in zoom-in-90 duration-200"
            title="Cuộn xuống tin nhắn mới nhất"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}

      {/* Preview ảnh đính kèm */}
      {imageAttachment && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
              <Image src={imageAttachment} alt="Preview" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setImageAttachment(null)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Ô nhập câu hỏi */}
      <form onSubmit={handleSend} className="border-t border-gray-100 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-950/30">
        <div className="flex gap-2 items-end">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/jpg, image/webp" 
            onChange={handleImageSelect} 
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="rounded-xl h-10 w-10 shrink-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="Đính kèm ảnh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </Button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Nhập câu hỏi về tài liệu..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <Button
            type="submit"
            disabled={isLoading || (!input.trim() && !imageAttachment)}
            size="icon"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:shadow-none h-10 w-10 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </form>
    </Card>
  );
}
