// components/ChatBox.tsx
// Giao diện Gia sư AI Đa tầng: Hỗ trợ Luyện Vấn Đáp Bằng Giọng Nói (Mic STT & Loa TTS), Chọn Model AI (Flash / Pro / Ultra) & Đính kèm ảnh

'use client';

import { useRef, useEffect, useState, useCallback, ChangeEvent } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatMessage, AIModelTier, SubscriptionPlan } from '@/types';
import { useChat, Message } from 'ai/react';
import { Mic, MicOff, Volume2, VolumeX, Zap, Brain, Crown, Lock } from 'lucide-react';

interface ChatBoxProps {
  pdfText: string;
  userRole?: 'teacher' | 'student' | 'admin';
  userPlan?: SubscriptionPlan;
  modelTier?: AIModelTier;
  onChangeModelTier?: (tier: AIModelTier) => void;
  onRequireUpgrade?: (reason: string) => void;
  onError: (message: string) => void;
  chatHistory?: ChatMessage[];
  onSendMessage?: (updatedHistory: ChatMessage[]) => void;
  className?: string;
  language?: 'vi' | 'en';
}

export default function ChatBox({
  pdfText,
  userRole,
  userPlan = 'free',
  modelTier = 'flash',
  onChangeModelTier,
  onRequireUpgrade,
  onError,
  chatHistory = [],
  onSendMessage,
  className,
  language = 'vi'
}: ChatBoxProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const onSendMessageRef = useRef(onSendMessage);
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // Voice Tutor States (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    onSendMessageRef.current = onSendMessage;
  }, [onSendMessage]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: chatHistory as unknown as Message[],
    body: { pdfText, imageAttachment, userRole, modelTier },
    onError: (err: Error) => {
      onError(err.message || 'Lỗi khi gửi câu hỏi');
    }
  });

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

  // Chức năng Luyện Vấn Đáp Bằng Giọng Nói (Speech-to-Text)
  const toggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói. Hãy sử dụng Google Chrome hoặc Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'vi' ? 'vi-VN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setInput((prev: string) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Chức năng Nghe AI Giảng Bài (Text-to-Speech)
  const toggleSpeakMessage = (msgId: string, textContent: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = textContent.replace(/[#*`_~>|]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'vi' ? 'vi-VN' : 'en-US';
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectModel = (targetTier: AIModelTier) => {
    if (targetTier === 'pro' && userPlan === 'free') {
      onRequireUpgrade?.('Mở khóa Model AI Tư Duy Sâu (Gemini 2.5 Pro Reasoning) với gói Pro hoặc VIP!');
      return;
    }
    if (targetTier === 'ultra' && userPlan !== 'vip') {
      onRequireUpgrade?.('Mở khóa Model AI Học Thuật Chuyên Gia (Ultra Academic) với gói VIP Center!');
      return;
    }
    onChangeModelTier?.(targetTier);
  };

  const handleSend = (e?: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    e?.preventDefault();
    if (!input.trim() && !imageAttachment) return;

    handleSubmit(e as React.FormEvent<HTMLFormElement>);
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
    <Card className={`p-0 border-0 shadow-lg bg-white/85 dark:bg-gray-900/85 backdrop-blur-sm flex flex-col overflow-hidden relative ${className || 'h-[520px]'}`}>
      {/* Thanh chọn Model AI Đa Tầng (Giống ChatGPT Plus / Claude Pro) */}
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">Mô hình AI:</span>
          <button
            type="button"
            onClick={() => handleSelectModel('flash')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              modelTier === 'flash'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400'
            }`}
          >
            <Zap className="w-3 h-3" /> Flash 2.5
          </button>

          <button
            type="button"
            onClick={() => handleSelectModel('pro')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              modelTier === 'pro'
                ? 'bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'
            }`}
          >
            <Brain className="w-3 h-3" /> Pro Reasoning
            {userPlan === 'free' && <Lock className="w-2.5 h-2.5 text-amber-500 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectModel('ultra')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              modelTier === 'ultra'
                ? 'bg-linear-to-r from-amber-500 to-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:border-amber-400'
            }`}
          >
            <Crown className="w-3 h-3" /> Ultra Academic
            {userPlan !== 'vip' && <Lock className="w-2.5 h-2.5 text-amber-500 ml-0.5" />}
          </button>
        </div>

        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          🎙️ Hỗ trợ Vấn đáp Giọng nói
        </span>
      </div>

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
            <p className="font-bold text-gray-500 dark:text-gray-400">
              {pdfText 
                ? (language === 'vi' ? 'Hỏi đáp & Luyện vấn đáp cùng Tài liệu' : 'Ask or practice voice Q&A with document')
                : (language === 'vi' ? 'Trò chuyện với Gia sư AI Đa tầng' : 'Chat with Multi-Tier AI Tutor')
              }
            </p>
            <p className="text-xs mt-1.5 text-center max-w-xs text-gray-400">
              {language === 'vi'
                ? 'Bấm biểu tượng Micro 🎙️ để trả lời miệng hoặc đính kèm ảnh bài tập để AI hướng dẫn!'
                : 'Click the Mic 🎙️ icon for voice tutoring or attach a photo of your homework!'}
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
                  <div>
                    <div className="prose prose-sm dark:prose-invert max-w-none
                      prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:my-1 prose-p:leading-relaxed
                      prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:my-0.5
                      prose-strong:text-gray-800 dark:prose-strong:text-gray-100
                      prose-headings:mt-2 prose-headings:mb-1
                    ">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => toggleSpeakMessage(msg.id, msg.content)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" /> Dừng đọc
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" /> Nghe AI giảng
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex space-x-1.5 items-center">
                <span className="text-[10px] text-gray-400 mr-1">
                  AI ({modelTier.toUpperCase()}) đang suy luận
                </span>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {isUserScrolledUp && messages.length > 0 && (
        <div className="absolute bottom-[72px] right-6 z-10">
          <button
            type="button"
            onClick={scrollToBottom}
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all hover:scale-105"
            title="Cuộn xuống tin nhắn mới nhất"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}

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
            className="rounded-xl h-10 w-10 shrink-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            title="Đính kèm ảnh bài tập"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </Button>

          {/* Nút Micro Vấn Đáp Giọng Nói */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleVoiceInput}
            disabled={isLoading}
            className={`rounded-xl h-10 w-10 shrink-0 border transition-all ${
              isListening
                ? 'bg-red-500 text-white border-red-500 animate-pulse'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-rose-600'
            }`}
            title={isListening ? 'Đang nghe... Bấm để dừng' : 'Nói bằng giọng nói (Vấn đáp AI)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={
              isListening
                ? '🎙️ Đang lắng nghe giọng nói của bạn...'
                : pdfText
                ? (language === 'vi' ? 'Nhập câu hỏi hoặc bấm 🎙️ để trả lời vấn đáp...' : 'Ask a question or click 🎙️ to speak...')
                : (language === 'vi' ? 'Nhập câu hỏi học tập...' : 'Ask a study question...')
            }
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50 placeholder:text-gray-400"
          />
          <Button
            type="submit"
            disabled={isLoading || (!input.trim() && !imageAttachment)}
            size="icon"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 h-10 w-10 shrink-0"
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
