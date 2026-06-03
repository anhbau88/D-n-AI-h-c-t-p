// components/QuizPanel.tsx
// Hiển thị câu hỏi trắc nghiệm với nút xem đáp án, tích hợp Form giao bài trắc nghiệm dành cho Giáo viên

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { QuizQuestion } from '@/types';
import { BookOpen } from 'lucide-react';
import QuizSkeleton from '@/components/ui/QuizSkeleton';

interface QuizPanelProps {
  questions: QuizQuestion[];
  isLoading: boolean;
  userRole?: 'teacher' | 'student';
  userRoom?: string;
  hasSubmitted?: boolean;
  onScoreSubmit?: (score: number, scale10Score: string) => void;
  previousScoreInfo?: { score: number, scale10Score: string };
  onAssignQuiz?: (title: string, targetRoom: string, startTime: string, endTime: string) => Promise<void>;
  availableRooms?: Array<{ code: string; name: string }>;
}

const DEFAULT_CLASSES = ['64CTT1', '64CTT2', '64CTT3', '64CTT4', '64CTT5'];

export default function QuizPanel({
  questions,
  isLoading,
  userRole = 'student',
  userRoom,
  hasSubmitted = false,
  onScoreSubmit,
  previousScoreInfo,
  onAssignQuiz,
  availableRooms = []
}: QuizPanelProps) {
  // State lưu câu hỏi nào đang hiện đáp án (Giáo viên có thể toggle từng câu, học sinh thì hiện tất cả khi nộp bài)
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  // State lưu đáp án người dùng đã chọn
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(new Map());
  // Học sinh đã nộp bài chưa? (Local state, or initial from props)
  const [isSubmitted, setIsSubmitted] = useState(hasSubmitted);

  // Form states cho giáo viên giao bài trắc nghiệm
  const [assignTitle, setAssignTitle] = useState('');
  const [targetRoom, setTargetRoom] = useState(() => {
    if (availableRooms.length > 0) return availableRooms[0].code;
    if (userRoom && DEFAULT_CLASSES.includes(userRoom)) return userRoom;
    return DEFAULT_CLASSES[0];
  });
  const [assignStart, setAssignStart] = useState('');
  const [assignEnd, setAssignEnd] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [formError, setFormError] = useState('');

  const isTeacher = userRole === 'teacher';

  // Khi component mount hoặc hasSubmitted/questions thay đổi
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSubmitted(hasSubmitted);
    if (hasSubmitted) {
      const all = new Set(questions.map((_, i) => i));
      setRevealedAnswers(all);
    } else {
      setRevealedAnswers(new Set());
      setSelectedAnswers(new Map());
    }
  }, [hasSubmitted, questions]);

  const handleSubmitQuizRef = useRef<() => void>(undefined);
  useEffect(() => {
    handleSubmitQuizRef.current = handleSubmitQuiz;
  });

  // Tự động nộp bài trắc nghiệm khi học sinh rời khỏi tab thi
  useEffect(() => {
    if (isTeacher || isSubmitted || questions.length === 0) return;

    let autoSubmitted = false;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !autoSubmitted) {
        autoSubmitted = true;
        handleSubmitQuizRef.current?.();
        alert('Phát hiện hành động rời khỏi tab làm bài! Bài thi trắc nghiệm của bạn đã được nộp tự động.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTeacher, isSubmitted, questions]);


  // Toggle hiện/ẩn đáp án cho câu hỏi thứ index (Dành cho GV)
  const toggleAnswer = (index: number) => {
    setRevealedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Nộp bài (Dành cho HS)
  const handleSubmitQuiz = () => {
    setIsSubmitted(true);
    // Hiện toàn bộ đáp án
    const all = new Set(questions.map((_, i) => i));
    setRevealedAnswers(all);
    
    // Gọi callback để lưu điểm
    if (onScoreSubmit) {
      const scoreCount = questions.reduce((acc, q, idx) => {
        if (selectedAnswers.get(idx) === q.answer) return acc + 1;
        return acc;
      }, 0);
      const scale10 = questions.length > 0 ? ((scoreCount / questions.length) * 10).toFixed(1) : "0.0";
      onScoreSubmit(scoreCount, scale10);
    }
  };

  // Chọn đáp án
  const selectAnswer = (questionIndex: number, answer: string) => {
    if (isTeacher) return; // GV không cần chọn đáp án để làm bài
    if (isSubmitted) return; // Nộp rồi thì không đổi được
    
    setSelectedAnswers(prev => {
      const newMap = new Map(prev);
      newMap.set(questionIndex, answer);
      return newMap;
    });
  };

  // Lấy chữ cái đáp án từ option (VD: "A. Đáp án" -> "A", hoặc dùng index làm phương án dự phòng)
  const getOptionLetter = (option: string, index: number) => {
    const match = option.trim().match(/^([A-D])\s*\.?\s*/i);
    return match ? match[1].toUpperCase() : ['A', 'B', 'C', 'D'][index];
  };

  // Xử lý nộp form giao bài trắc nghiệm
  const handleAssignClick = async () => {
    setFormError('');
    if (!assignTitle.trim()) {
      setFormError('Vui lòng nhập tên bài trắc nghiệm.');
      return;
    }
    if (!assignStart || !assignEnd) {
      setFormError('Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc.');
      return;
    }
    if (new Date(assignStart) >= new Date(assignEnd)) {
      setFormError('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    if (onAssignQuiz) {
      setIsAssigning(true);
      try {
        await onAssignQuiz(assignTitle.trim(), targetRoom, assignStart, assignEnd);
        // Reset form
        setAssignTitle('');
        setAssignStart('');
        setAssignEnd('');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Lỗi khi giao bài tập.');
      } finally {
        setIsAssigning(false);
      }
    }
  };

  // Tính điểm
  const currentScore = questions.reduce((acc, q, idx) => {
    if (selectedAnswers.get(idx) === q.answer) return acc + 1;
    return acc;
  }, 0);

  const currentScale10Score = questions.length > 0 ? ((currentScore / questions.length) * 10).toFixed(1) : "0.0";

  // Hiển thị điểm (dùng previousScoreInfo nếu có sẵn (đã nộp từ trước), hoặc tính toán mới)
  const displayScore = hasSubmitted && previousScoreInfo ? previousScoreInfo.score : currentScore;
  const displayScale10 = hasSubmitted && previousScoreInfo ? previousScoreInfo.scale10Score : currentScale10Score;

  // Trạng thái đang tải
  if (isLoading) {
    return <QuizSkeleton />;
  }

  // Trạng thái trống
  if (questions.length === 0) {
    return (
      <Card className="p-6 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="font-medium text-gray-500 dark:text-gray-400">Chưa có câu hỏi trắc nghiệm</p>
          {isTeacher && <p className="text-sm mt-1">Bấm nút &quot;Tạo trắc nghiệm&quot; để AI tạo câu hỏi ôn tập</p>}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header trạng thái */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
          📝 {questions.length} câu hỏi trắc nghiệm
        </Badge>
        
        {isSubmitted && (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white shadow-md px-3 py-1">
            Điểm số: {displayScale10}/10 ({displayScore}/{questions.length} câu)
          </Badge>
        )}
      </div>

      {/* Danh sách câu hỏi */}
      <div 
        className="space-y-4"
        style={!isTeacher && !isSubmitted ? { userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' } as React.CSSProperties : undefined}
        onCopy={(e) => {
          if (!isTeacher && !isSubmitted) {
            e.preventDefault();
            alert('Không được phép sao chép câu hỏi trong khi đang làm bài!');
          }
        }}
      >
        {questions.map((q, index) => {
          const isRevealed = revealedAnswers.has(index);
          const userAnswer = selectedAnswers.get(index);

          return (
            <Card key={index} className="p-5 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all hover:shadow-xl">
              {/* Câu hỏi */}
              <div className="flex items-start gap-3 mb-4">
                <span className="shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                  {index + 1}
                </span>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 leading-relaxed pt-0.5">
                  {q.question}
                </h3>
              </div>

              {/* Danh sách đáp án */}
              <div className="space-y-2 mb-4 ml-11">
                {q.options.map((option, optIndex) => {
                  const letter = getOptionLetter(option, optIndex);
                  const isCorrect = letter === q.answer;
                  const isSelected = userAnswer === letter;
                  const showResult = isRevealed;

                  let optionClass = 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/60 cursor-pointer';

                  if (showResult && isCorrect) {
                    optionClass = 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50';
                  } else if (showResult && isSelected && !isCorrect) {
                    optionClass = 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/50';
                  } else if (isSelected && !showResult) {
                    optionClass = 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-500/30';
                  }

                  if (isTeacher) optionClass = optionClass.replace('cursor-pointer', 'cursor-default hover:bg-gray-50/50');

                  return (
                    <div
                      key={optIndex}
                      onClick={() => selectAnswer(index, letter)}
                      className={`
                        p-3 rounded-xl border text-sm transition-all duration-200
                        ${optionClass}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700 dark:text-gray-300">{option}</span>
                        {showResult && isCorrect && (
                          <svg className="w-5 h-5 text-emerald-500 shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <svg className="w-5 h-5 text-red-500 shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Các nút chức năng & Giải thích */}
              <div className="ml-11">
                {isTeacher && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAnswer(index)}
                    className="rounded-lg text-xs"
                  >
                    {isRevealed ? 'Ẩn đáp án' : 'Xem đáp án'}
                  </Button>
                )}

                {/* Giải thích */}
                {isRevealed && (
                  <div className="mt-3 p-3 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Đáp án đúng: {q.answer}
                    </p>
                    <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Nút Nộp Bài (Dành cho Học Sinh) */}
      {!isTeacher && !isSubmitted && questions.length > 0 && (
        <div className="pt-4 flex justify-end">
          <Button 
            onClick={handleSubmitQuiz}
            className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 font-semibold"
          >
            Nộp bài & Xem kết quả
          </Button>
        </div>
      )}

      {/* Form Giao bài trắc nghiệm (Chỉ cho Giáo viên khi có câu hỏi đã tạo xong) */}
      {isTeacher && onAssignQuiz && (
        <Card className="p-6 border border-emerald-200 dark:border-emerald-900 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm animate-fade-in-up">
          <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Giao bài kiểm tra trắc nghiệm cho học sinh
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Tên bài trắc nghiệm</label>
                <Input
                  placeholder="Ví dụ: Kiểm tra 15p chương 1, Ôn tập giữa kỳ..."
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  disabled={isAssigning}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Lớp nhận bài trắc nghiệm</label>
                <select
                  value={targetRoom}
                  onChange={(e) => setTargetRoom(e.target.value)}
                  disabled={isAssigning}
                  className="flex h-9 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold text-foreground"
                >
                  {availableRooms.length > 0 ? (
                    availableRooms.map((room) => (
                      <option key={room.code} value={room.code}>{room.name} ({room.code})</option>
                    ))
                  ) : (
                    DEFAULT_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>Lớp {cls}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Thời gian bắt đầu</label>
                <Input 
                  type="datetime-local" 
                  value={assignStart} 
                  onChange={(e) => setAssignStart(e.target.value)} 
                  disabled={isAssigning}
                  className="h-9 text-xs rounded-xl" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Thời gian kết thúc</label>
                <Input 
                  type="datetime-local" 
                  value={assignEnd} 
                  onChange={(e) => setAssignEnd(e.target.value)} 
                  disabled={isAssigning}
                  className="h-9 text-xs rounded-xl" 
                />
              </div>
            </div>
          </div>

          {formError && (
            <p className="text-red-500 text-xs mt-3 font-semibold">⚠️ {formError}</p>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleAssignClick}
              disabled={isAssigning}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-6 font-semibold shadow-md shadow-emerald-500/20"
            >
              {isAssigning ? 'Đang giao bài...' : `Giao Đề Lớp ${targetRoom}`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
