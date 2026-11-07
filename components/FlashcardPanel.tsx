'use client';

import { useState } from 'react';
import { FlashcardItem } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Layers, RotateCw, Sparkles, CheckCircle2, AlertCircle, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface FlashcardPanelProps {
  flashcards: FlashcardItem[];
  isLoading: boolean;
  onGenerate: (forceRegenerate?: boolean) => void;
}

export default function FlashcardPanel({ flashcards, isLoading, onGenerate }: FlashcardPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<string, 'hard' | 'good' | 'easy'>>({});

  if (isLoading) {
    return (
      <Card className="p-10 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto animate-spin">
          <RotateCw className="w-6 h-6" />
        </div>
        <h4 className="text-base font-black text-foreground">AI đang trích xuất bộ Thẻ Ghi Nhớ (Flashcards)...</h4>
        <p className="text-xs text-gray-500">Áp dụng thuật toán lặp lại ngắt quãng Spaced Repetition (SM-2)</p>
      </Card>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <Card className="p-8 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-md flex flex-col items-center border border-gray-300 dark:border-gray-800">
        <Layers className="w-12 h-12 text-indigo-600 mb-3" />
        <h4 className="text-base font-bold text-foreground">Thẻ Ghi Nhớ Thông Minh (3D Flashcards)</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5 max-w-md">
          AI tự động trích xuất các thuật ngữ, công thức và định nghĩa quan trọng nhất từ tài liệu để bạn lật thẻ học thuộc siêu tốc kiểu Quizlet.
        </p>
        <Button
          onClick={() => onGenerate(false)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white rounded-xl text-sm h-10 px-6 shadow-md font-bold flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Tạo bộ Flashcards bằng AI
        </Button>
      </Card>
    );
  }

  const safeIndex = Math.min(currentIndex, flashcards.length - 1);
  const currentCard = flashcards[safeIndex];
  const masteredCount = Object.values(ratings).filter((r) => r === 'easy').length;
  const reviewCount = Object.values(ratings).filter((r) => r === 'hard').length;

  const handleRate = (level: 'hard' | 'good' | 'easy') => {
    setRatings((prev) => ({ ...prev, [currentCard.id || String(safeIndex)]: level }));
    setIsFlipped(false);
    if (safeIndex < flashcards.length - 1) {
      setCurrentIndex(safeIndex + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Progress Bar */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            Thẻ {safeIndex + 1} / {flashcards.length}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            ✅ Đã thuộc: {masteredCount}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            🔥 Cần ôn lại: {reviewCount}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onGenerate(true)}
          className="h-8 rounded-xl text-xs font-bold border-indigo-200 dark:border-indigo-800 text-indigo-600"
        >
          <RotateCw className="w-3.5 h-3.5 mr-1.5" />
          Tạo lại bộ thẻ mới
        </Button>
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer select-none group"
      >
        <div
          className={`min-h-[260px] sm:min-h-[300px] p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between shadow-lg ${
            isFlipped
              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-indigo-400'
              : 'bg-white dark:bg-gray-900 text-foreground border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider opacity-75">
            <span>{isFlipped ? '💡 MẶT SAU — ĐÁP ÁN / GIẢI THÍCH' : '❓ MẶT TRƯỚC — THUẬT NGỮ / CÂU HỎI'}</span>
            {currentCard.topic && (
              <span className="px-2.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[10px]">
                {currentCard.topic}
              </span>
            )}
          </div>

          <div className="my-auto py-6 text-center">
            <p className={`font-black leading-relaxed ${isFlipped ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl'}`}>
              {isFlipped ? currentCard.back : currentCard.front}
            </p>
          </div>

          <div className="text-center text-[11px] font-bold opacity-70">
            👆 Bấm vào thẻ để lật {isFlipped ? 'mặt trước' : 'xem đáp án'}
          </div>
        </div>
      </div>

      {/* Spaced Repetition SM-2 Rating Controls */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleRate('hard')}
          className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-black text-xs flex flex-col items-center gap-1 transition-all"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Quên / Khó (Ôn lại ngay)</span>
        </button>

        <button
          type="button"
          onClick={() => handleRate('good')}
          className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-black text-xs flex flex-col items-center gap-1 transition-all"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Tạm nhớ (Ôn sau 1 ngày)</span>
        </button>

        <button
          type="button"
          onClick={() => handleRate('easy')}
          className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-black text-xs flex flex-col items-center gap-1 transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã thuộc lòng (+XP)</span>
        </button>
      </div>

      {/* Navigation Prev / Next */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={safeIndex === 0}
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex(Math.max(0, safeIndex - 1));
          }}
          className="rounded-xl text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Thẻ trước
        </Button>

        <div className="flex gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-xs py-1">
          {flashcards.map((c, idx) => {
            const r = ratings[c.id || String(idx)];
            const dotColor =
              r === 'easy'
                ? 'bg-emerald-500'
                : r === 'good'
                ? 'bg-amber-500'
                : r === 'hard'
                ? 'bg-rose-500'
                : 'bg-gray-300 dark:bg-gray-700';
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(idx);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${dotColor} ${
                  idx === safeIndex ? 'ring-2 ring-indigo-500 scale-125' : 'opacity-70'
                }`}
              />
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={safeIndex === flashcards.length - 1}
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex(Math.min(flashcards.length - 1, safeIndex + 1));
          }}
          className="rounded-xl text-xs font-bold"
        >
          Thẻ tiếp <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
