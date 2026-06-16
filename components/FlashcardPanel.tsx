// components/FlashcardPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Layers, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Flashcard, DocumentItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FlashcardPanelProps {
  activeDoc: DocumentItem | null;
  language: 'vi' | 'en';
  onUpdateDocument: (docId: string, updates: Partial<DocumentItem>) => Promise<void>;
  username: string;
}

interface CardProgress {
  status: 'forgot' | 'medium' | 'easy';
  lastReviewedAt: string;
}

export default function FlashcardPanel({
  activeDoc,
  language,
  onUpdateDocument,
  username
}: FlashcardPanelProps) {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Lưu tiến trình ghi nhớ của từng thẻ (cardId -> progress)
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});

  // Nạp thẻ ghi nhớ và tiến trình học tập
  useEffect(() => {
    if (activeDoc) {
      setCards(activeDoc.flashcards || []);
      setCurrentIndex(0);
      setIsFlipped(false);

      // Đọc tiến trình lưu ở localStorage
      const storageKey = `fc_progress_${username}_${activeDoc.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setProgress(JSON.parse(saved));
        } catch {
          setProgress({});
        }
      } else {
        setProgress({});
      }
    } else {
      setCards([]);
      setProgress({});
    }
  }, [activeDoc, username]);

  // Sinh bộ Flashcards mới từ AI
  const handleGenerateCards = async () => {
    if (!activeDoc) return;
    setLoading(true);
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfText: activeDoc.textContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Cập nhật lên server
      await onUpdateDocument(activeDoc.id, { flashcards: data.flashcards });
      setCards(data.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setProgress({});
      
      // Xóa tiến trình cũ của tài liệu này
      localStorage.removeItem(`fc_progress_${username}_${activeDoc.id}`);
    } catch (err) {
      console.error('Lỗi khi tạo flashcards:', err);
      alert(language === 'vi' ? 'Không thể tạo thẻ ghi nhớ. Vui lòng thử lại.' : 'Failed to generate flashcards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Đánh giá mức độ nhớ
  const handleRateCard = (cardId: string, rating: 'forgot' | 'medium' | 'easy') => {
    const newProgress = {
      ...progress,
      [cardId]: {
        status: rating,
        lastReviewedAt: new Date().toISOString()
      }
    };
    setProgress(newProgress);
    localStorage.setItem(`fc_progress_${username}_${activeDoc?.id}`, JSON.stringify(newProgress));

    // Chuyển sang thẻ tiếp theo sau khi đánh giá
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  };

  if (!activeDoc) return null;

  const totalCards = cards.length;
  const easyCount = Object.values(progress).filter(p => p.status === 'easy').length;
  const mediumCount = Object.values(progress).filter(p => p.status === 'medium').length;
  const forgotCount = Object.values(progress).filter(p => p.status === 'forgot').length;
  
  const completionPercentage = totalCards > 0 ? Math.round((easyCount / totalCards) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            {language === 'vi' ? 'Học chủ động bằng Flashcards' : 'Active Recall with Flashcards'}
          </h3>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            {language === 'vi' 
              ? 'Lật thẻ để xem khái niệm và tự đánh giá khả năng ghi nhớ của bạn.'
              : 'Flip card to check concept and self-rate your memorization.'}
          </p>
        </div>

        {totalCards > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateCards()}
            disabled={loading}
            className="rounded-xl text-xs h-9 border-primary/25 text-primary flex items-center gap-1.5 font-bold shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {language === 'vi' ? 'Soạn lại thẻ' : 'Regenerate'}
          </Button>
        )}
      </div>

      {totalCards === 0 ? (
        /* Empty State */
        <Card className="p-8 text-center bg-white/80 dark:bg-gray-900/80 border-0 shadow-lg backdrop-blur-sm flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-150 to-indigo-50 dark:from-indigo-950/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h4 className="text-sm font-bold text-foreground">
            {language === 'vi' ? 'Chưa có thẻ ghi nhớ nào được tạo' : 'No flashcards created yet'}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-sm font-semibold">
            {language === 'vi'
              ? 'AI sẽ đọc tài liệu bài giảng và thiết kế các thẻ ghi nhớ thông minh giúp bạn chủ động ghi nhớ từ vựng, định nghĩa hoặc công thức chính.'
              : 'AI will parse study documents and create smart flashcards to help you recall key terms, definitions or formulas.'}
          </p>
          <Button
            onClick={() => handleGenerateCards()}
            disabled={loading}
            className="mt-6 h-10 px-6 rounded-xl bg-gradient-to-r from-primary to-violet text-white font-bold text-xs shadow-md shadow-primary/20 hover:brightness-110 transition-all flex items-center gap-1.5"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {language === 'vi' ? 'Khởi tạo Flashcards bằng AI' : 'Generate AI Flashcards'}
          </Button>
        </Card>
      ) : (
        /* Active Flashcard Viewer */
        <div className="space-y-6">
          
          {/* Progress Indicator */}
          <div className="p-4 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-500 uppercase tracking-wider">{language === 'vi' ? 'Tiến độ ôn tập' : 'Study Progress'}</span>
              <span className="text-primary">{language === 'vi' ? `Thuộc lòng: ${easyCount}/${totalCards} thẻ (${completionPercentage}%)` : `Memorized: ${easyCount}/${totalCards} cards (${completionPercentage}%)`}</span>
            </div>
            
            {/* Multi-segmented Progress Bar */}
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${(easyCount / totalCards) * 100}%` }} className="h-full bg-emerald-500 transition-all duration-300" title="Easy" />
              <div style={{ width: `${(mediumCount / totalCards) * 100}%` }} className="h-full bg-yellow-500 transition-all duration-300" title="Medium" />
              <div style={{ width: `${(forgotCount / totalCards) * 100}%` }} className="h-full bg-red-500 transition-all duration-300" title="Forgot" />
            </div>

            {/* Quick Metrics Badge List */}
            <div className="flex gap-4 text-[10px] font-bold text-gray-500 pt-0.5">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {language === 'vi' ? `Đã thuộc: ${easyCount}` : `Easy: ${easyCount}`}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> {language === 'vi' ? `Mơ hồ: ${mediumCount}` : `Medium: ${mediumCount}`}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> {language === 'vi' ? `Chưa thuộc: ${forgotCount}` : `Forgot: ${forgotCount}`}</span>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-72 cursor-pointer relative group [perspective:1000px] select-none"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="w-full h-full relative [transform-style:preserve-3d] shadow-xl rounded-3xl"
            >
              {/* CARD FRONT SIDE */}
              <div className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl [backface-visibility:hidden] z-10">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <span>{language === 'vi' ? `Thẻ ${currentIndex + 1} trên ${totalCards}` : `Card ${currentIndex + 1} of ${totalCards}`}</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-black">FRONT</span>
                </div>

                <div className="text-center py-6">
                  <p className="text-base sm:text-lg font-black text-foreground leading-relaxed">
                    {cards[currentIndex]?.front}
                  </p>
                </div>

                <div className="text-center text-[10px] text-gray-400 font-semibold flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  <span>{language === 'vi' ? 'Bấm vào thẻ để xem định nghĩa' : 'Click card to reveal definition'}</span>
                </div>
              </div>

              {/* CARD BACK SIDE */}
              <div 
                style={{ transform: 'rotateY(180deg)' }}
                className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between bg-gradient-to-br from-indigo-50/90 to-indigo-100/50 dark:from-slate-900/90 dark:to-slate-950/50 border border-indigo-200/50 dark:border-indigo-900/30 rounded-3xl [backface-visibility:hidden] z-10"
              >
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <span>{language === 'vi' ? 'Mặt sau' : 'Back side'}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-black">BACK</span>
                </div>

                <div className="text-center py-6">
                  <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                    {cards[currentIndex]?.back}
                  </p>
                </div>

                <div className="text-center text-[10px] text-indigo-500/80 dark:text-indigo-400 font-bold flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Bấm lần nữa để lật lại' : 'Click again to flip back'}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Active Recall rate buttons - Visible when card flipped */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {isFlipped ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="grid grid-cols-3 gap-3"
                >
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRateCard(cards[currentIndex].id, 'forgot');
                    }}
                    className="h-10 rounded-xl bg-red-500 hover:bg-red-650 active:scale-95 text-white text-xs font-bold shadow-md shadow-red-500/15"
                  >
                    ❌ {language === 'vi' ? 'Quên' : 'Forgot'}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRateCard(cards[currentIndex].id, 'medium');
                    }}
                    className="h-10 rounded-xl bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-yellow-500/15"
                  >
                    ⚠️ {language === 'vi' ? 'Mơ hồ' : 'Medium'}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRateCard(cards[currentIndex].id, 'easy');
                    }}
                    className="h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-500/15"
                  >
                    ✅ {language === 'vi' ? 'Đã thuộc' : 'Easy'}
                  </Button>
                </motion.div>
              ) : (
                <div className="h-10 flex items-center justify-center text-[11px] text-gray-400 font-bold">
                  {language === 'vi' ? '💡 Hãy tự suy nghĩ câu trả lời trước khi lật thẻ!' : '💡 Try to recall the answer before flipping!'}
                </div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  setCurrentIndex(prev => Math.max(0, prev - 1));
                }}
                disabled={currentIndex === 0}
                className="rounded-xl h-9 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                {language === 'vi' ? 'Thẻ trước' : 'Previous'}
              </Button>

              <div className="flex gap-1.5">
                {cards.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFlipped(false);
                      setCurrentIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex 
                        ? 'bg-primary w-4' 
                        : (progress[cards[idx]?.id]?.status === 'easy' ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-700')
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1));
                }}
                disabled={currentIndex === cards.length - 1}
                className="rounded-xl h-9 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {language === 'vi' ? 'Thẻ sau' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
