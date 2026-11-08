'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ENGLISH_CURRICULUM_TOPICS,
  EnglishLesson,
  EnglishQuestion,
  EnglishLearningProgress,
  getLessonById,
  getQuestionById,
  getDueReviewQuestions,
  getNextRecommendedLesson,
  buildSmartReviewSessionQuestions,
  recordQuestionAttempt,
  isEnglishAnswerCorrect,
} from '@/lib/english-curriculum';
import {
  Volume2,
  X,
  Check,
  Flag,
  ChevronRight,
  BookOpen,
  RotateCcw,
  VolumeX,
} from 'lucide-react';

interface EnglishLearningHubProps {
  username: string;
  progress: EnglishLearningProgress;
  onUpdateProgress: (next: EnglishLearningProgress) => void;
  onAwardXp?: (xpAmount: number, eventId: string) => void;
  onOpenProfile?: () => void;
  onSessionActiveChange?: (isActive: boolean) => void;
  initialLessonId?: string | null;
  startInReviewMode?: boolean;
  onClearInitialLesson?: () => void;
}

export default function EnglishLearningHub({
  progress,
  onUpdateProgress,
  onAwardXp,
  onOpenProfile,
  onSessionActiveChange,
  initialLessonId,
  startInReviewMode,
  onClearInitialLesson,
}: EnglishLearningHubProps) {

  const [showAllTopics, setShowAllTopics] = useState(false);
  const [subTab, setSubTab] = useState<'roadmap' | 'doc_vocab'>('roadmap');

  // Trạng thái phiên làm bài
  const [sessionActive, setSessionActive] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [activeLesson, setActiveLesson] = useState<EnglishLesson | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<EnglishQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Tách điểm lần đầu (firstTry) và câu làm lại cuối phiên (retry)
  const [firstTryAttemptedIds, setFirstTryAttemptedIds] = useState<string[]>([]);
  const [firstTryCorrectIds, setFirstTryCorrectIds] = useState<string[]>([]);
  const [weakSkillsInSession, setWeakSkillsInSession] = useState<string[]>([]);

  // Trạng thái câu hỏi hiện tại
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [hasChecked, setHasChecked] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [listeningSupportMode, setListeningSupportMode] = useState(false);
  const [reportedToast, setReportedToast] = useState(false);

  // Hộp thoại xác nhận thoát giữa chừng
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Màn hình kết quả cuối bài
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Form thêm từ vựng từ tài liệu
  const [newTerm, setNewTerm] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newSourceSentence, setNewSourceSentence] = useState('');

  const speakEnglish = (text: string, slow = false) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = slow ? 0.65 : 0.92;
      window.speechSynthesis.speak(utter);
    }
  };

  const resetQuestionInputState = () => {
    setSelectedOption(null);
    setOrderedWords([]);
    setTextInput('');
    setHasChecked(false);
    setIsCurrentCorrect(false);
    setListeningSupportMode(false);
    setReportedToast(false);
  };

  const startLessonSession = (lesson: EnglishLesson, resumeSaved = false) => {
    if (
      resumeSaved &&
      progress.activeSession &&
      progress.activeSession.lessonId === lesson.id &&
      !progress.activeSession.isReviewSession
    ) {
      const savedQs = progress.activeSession.questionIds
        .map(id => getQuestionById(id))
        .filter((q): q is EnglishQuestion => Boolean(q));
      if (savedQs.length > 0) {
        setActiveLesson(lesson);
        setIsReviewMode(false);
        setSessionQuestions(savedQs);
        setCurrentIdx(Math.min(progress.activeSession.currentIndex, savedQs.length - 1));
        setFirstTryAttemptedIds(progress.activeSession.firstTryAttemptedIds || []);
        setFirstTryCorrectIds(progress.activeSession.firstTryCorrectIds || []);
        setWeakSkillsInSession([]);
        setSessionCompleted(false);
        resetQuestionInputState();
        setSessionActive(true);
        onSessionActiveChange?.(true);
        return;
      }
    }

    setActiveLesson(lesson);
    setIsReviewMode(false);
    setSessionQuestions([...lesson.questions]);
    setCurrentIdx(0);
    setFirstTryAttemptedIds([]);
    setFirstTryCorrectIds([]);
    setWeakSkillsInSession([]);
    setSessionCompleted(false);
    resetQuestionInputState();
    setSessionActive(true);
    onSessionActiveChange?.(true);

    // Lưu phiên đang làm
    const nextProg: EnglishLearningProgress = {
      ...progress,
      activeSession: {
        lessonId: lesson.id,
        isReviewSession: false,
        questionIds: lesson.questions.map(q => q.id),
        currentIndex: 0,
        firstTryCorrectIds: [],
        firstTryAttemptedIds: [],
        retryQueueIds: [],
        startedAt: new Date().toISOString(),
      },
    };
    onUpdateProgress(nextProg);
  };

  const startSmartReviewSession = () => {
    const reviewQs = buildSmartReviewSessionQuestions(progress, 10);
    if (reviewQs.length === 0) return;

    setActiveLesson({
      id: 'smart-review',
      topicId: 1,
      orderInTopic: 1,
      title: 'Phiên ôn tập đến hạn & câu hay sai',
      subtitle: 'Ôn ngắt quãng thông minh',
      durationMinutes: 5,
      canDoGoal: 'Củng cố các câu đến hạn ôn và sửa lỗi ngữ pháp/từ vựng.',
      questions: reviewQs,
    });
    setIsReviewMode(true);
    setSessionQuestions(reviewQs);
    setCurrentIdx(0);
    setFirstTryAttemptedIds([]);
    setFirstTryCorrectIds([]);
    setWeakSkillsInSession([]);
    setSessionCompleted(false);
    resetQuestionInputState();
    setSessionActive(true);
    onSessionActiveChange?.(true);
  };

  useEffect(() => {
    if (startInReviewMode) {
      startSmartReviewSession();
      onClearInitialLesson?.();
    } else if (initialLessonId) {
      const found = getLessonById(initialLessonId);
      if (found) {
        const hasSaved = progress.activeSession?.lessonId === found.id;
        startLessonSession(found, hasSaved);
      }
      onClearInitialLesson?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLessonId, startInReviewMode]);

  const currentQuestion = sessionQuestions[currentIdx];

  // Tự động phát âm thanh cho câu nghe khi mở câu mới
  useEffect(() => {
    if (sessionActive && !sessionCompleted && currentQuestion?.type === 'listening' && currentQuestion.audioText) {
      speakEnglish(currentQuestion.audioText, false);
    }
  }, [sessionActive, sessionCompleted, currentIdx, currentQuestion]);

  const getUserSubmittedAnswer = (): string => {
    if (!currentQuestion) return '';
    if (currentQuestion.type === 'sentence_order') {
      return orderedWords.join(' ');
    }
    if (currentQuestion.type === 'short_input' || currentQuestion.type === 'error_correction') {
      return textInput.trim();
    }
    return selectedOption || '';
  };

  const handleCheckAnswer = () => {
    if (!currentQuestion || hasChecked) return;
    const userAns = getUserSubmittedAnswer();
    if (!userAns) return;

    const isFirstTry = !firstTryAttemptedIds.includes(currentQuestion.id);
    const { updatedProgress, isCorrect } = recordQuestionAttempt(
      progress,
      currentQuestion,
      userAns,
      isFirstTry && !listeningSupportMode
    );

    const nextAttempted = isFirstTry
      ? [...firstTryAttemptedIds, currentQuestion.id]
      : firstTryAttemptedIds;
    const nextFirstCorrect =
      isFirstTry && isCorrect && !listeningSupportMode
        ? [...firstTryCorrectIds, currentQuestion.id]
        : firstTryCorrectIds;

    setFirstTryAttemptedIds(nextAttempted);
    setFirstTryCorrectIds(nextFirstCorrect);
    setIsCurrentCorrect(isCorrect);
    setHasChecked(true);

    let updatedQuestionsList = [...sessionQuestions];
    if (!isCorrect) {
      if (!weakSkillsInSession.includes(currentQuestion.skillTag)) {
        setWeakSkillsInSession(prev => [...prev, currentQuestion.skillTag]);
      }
      // Nếu trả lời sai, cho gặp lại câu này ở cuối phiên học để sửa lỗi
      updatedQuestionsList = [...sessionQuestions, currentQuestion];
      setSessionQuestions(updatedQuestionsList);
    }

    // Lưu trạng thái phiên học để nếu mất mạng/thoát ra quay lại đúng vị trí
    if (activeLesson && !isReviewMode) {
      updatedProgress.activeSession = {
        lessonId: activeLesson.id,
        isReviewSession: false,
        questionIds: updatedQuestionsList.map(q => q.id),
        currentIndex: currentIdx,
        firstTryCorrectIds: nextFirstCorrect,
        firstTryAttemptedIds: nextAttempted,
        retryQueueIds: [],
        startedAt: progress.activeSession?.startedAt || new Date().toISOString(),
      };
    }

    onUpdateProgress(updatedProgress);
  };

  const handleNextStep = () => {
    if (currentIdx + 1 < sessionQuestions.length) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      resetQuestionInputState();

      if (activeLesson && !isReviewMode && progress.activeSession) {
        onUpdateProgress({
          ...progress,
          activeSession: {
            ...progress.activeSession,
            currentIndex: nextIdx,
          },
        });
      }
    } else {
      // Hoàn thành bài học!
      setSessionCompleted(true);
      const baseTotal = activeLesson ? activeLesson.questions.length : firstTryAttemptedIds.length;
      const eventId = `eng-${activeLesson?.id || 'review'}-${ new Date().toISOString().slice(0, 10) }`;
      const minutesAdded = activeLesson?.durationMinutes || 5;

      const nextProg: EnglishLearningProgress = {
        ...progress,
        minutesStudiedToday: (progress.minutesStudiedToday || 0) + minutesAdded,
        lastStudyDate: new Date().toISOString().slice(0, 10),
        activeSession: null,
        completedLessons: { ...progress.completedLessons },
      };

      if (activeLesson && !isReviewMode) {
        nextProg.completedLessons[activeLesson.id] = {
          lessonId: activeLesson.id,
          firstTryCorrect: firstTryCorrectIds.length,
          totalQuestions: baseTotal,
          finalCorrectAfterRetry: baseTotal,
          weakSkills: weakSkillsInSession,
          completedAt: new Date().toISOString(),
          eventId,
        };
      }

      onUpdateProgress(nextProg);
      onAwardXp?.(15, eventId);
    }
  };

  const handleSaveAndExitSession = () => {
    setShowExitDialog(false);
    setSessionActive(false);
    onSessionActiveChange?.(false);
  };

  const handleReportQuestion = () => {
    if (!currentQuestion) return;
    setReportedToast(true);
    if (!progress.reportedQuestionIds.includes(currentQuestion.id)) {
      onUpdateProgress({
        ...progress,
        reportedQuestionIds: [...progress.reportedQuestionIds, currentQuestion.id],
      });
    }
  };

  // ==========================================================================
  // MÀN HÌNH LÀM BÀI TẬP TRUNG (FOCUSED LESSON PLAYER - HÌNH 3 BÊN PHẢI)
  // ==========================================================================
  if (sessionActive && activeLesson) {
    const baseTotalCount = activeLesson.questions.length;
    const progressPercent = Math.min(100, Math.round(((currentIdx + 1) / sessionQuestions.length) * 100));

    if (sessionCompleted) {
      return (
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 my-4">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#F3F0FF] text-[#6545D8] flex items-center justify-center mx-auto font-black text-2xl">
              ✓
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-[#6545D8]">
              HOÀN THÀNH PHIÊN HỌC
            </span>
            <h2 className="text-2xl font-black text-[#172033] dark:text-white">
              {activeLesson.title}
            </h2>
            <p className="text-xs text-gray-500">
              +{activeLesson.durationMinutes} phút vào mục tiêu hôm nay · Đã lưu lịch ôn ngắt quãng
            </p>
          </div>

          {/* Tách điểm làm lần đầu khỏi điểm sau khi ôn (Mục 8) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#F5F6FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-500">Đúng ngay lần đầu</p>
              <p className="text-2xl font-black text-[#6545D8] mt-1">
                {firstTryCorrectIds.length} / {baseTotalCount} câu
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Phản ánh mức nhớ độc lập
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Sau khi sửa lỗi cuối bài</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                {baseTotalCount} / {baseTotalCount} câu
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                Đã hoàn thành 100% câu hỏi
              </p>
            </div>
          </div>

          {weakSkillsInSession.length > 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
              <p className="text-xs font-black text-amber-900 dark:text-amber-200">
                Nội dung đã thêm vào Lịch ôn & Sổ lỗi (Ôn lại sau 1 ngày):
              </p>
              <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-300 font-medium">
                {weakSkillsInSession.map((sk) => (
                  <li key={sk}>• {sk}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#F5F6FA] dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 font-medium">
              Bạn trả lời chính xác tất cả các câu ngay từ lần đầu! Các mục kiến thức này đã được giãn lịch ôn sang mốc 3–7 ngày tới.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {weakSkillsInSession.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={startSmartReviewSession}
                className="flex-1 min-h-12 rounded-xl border-[#6545D8] text-[#6545D8] font-bold text-sm"
              >
                Ôn lại các câu vừa sai
              </Button>
            )}
            <Button
              type="button"
              onClick={() => {
                setSessionActive(false);
                onSessionActiveChange?.(false);
              }}
              className="flex-1 min-h-12 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-sm"
            >
              Về lộ trình Tiếng Anh
            </Button>
          </div>
        </div>
      );
    }

    if (!currentQuestion) return null;

    const isRetryTurn = currentIdx >= baseTotalCount;
    const canSubmit = Boolean(getUserSubmittedAnswer());

    return (
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6 my-2">
        {/* Thanh trên: Nút đóng X + Câu X / 10 + Thanh tiến trình */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowExitDialog(true)}
              className="w-11 h-11 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500"
              aria-label="Thoát phiên học"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
              {isRetryTurn
                ? `Ôn lại câu sai · Câu ${currentIdx + 1} / ${sessionQuestions.length}`
                : `Câu ${currentIdx + 1} / ${sessionQuestions.length}`}
            </span>
            <span className="text-xs font-bold text-[#6545D8] bg-[#F3F0FF] dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
              {currentQuestion.skillTag}
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#EBECEF] dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-[#6545D8] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Yêu cầu & Đề bài */}
        <div className="space-y-2">
          <p className="text-base sm:text-lg font-black text-[#172033] dark:text-white">
            {currentQuestion.promptVi}
          </p>

          {/* Nếu là bài nghe: ẩn bản chép trước khi trả lời */}
          {currentQuestion.type === 'listening' ? (
            <div className="p-4 rounded-2xl bg-[#F3F0FF] dark:bg-indigo-950/40 border border-[#6545D8]/20 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => currentQuestion.audioText && speakEnglish(currentQuestion.audioText, false)}
                  className="min-h-11 px-4 py-2 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-xs flex items-center gap-2 shadow-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Phát âm thanh</span>
                </button>
                <button
                  type="button"
                  onClick={() => currentQuestion.audioText && speakEnglish(currentQuestion.audioText, true)}
                  className="min-h-11 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#172033] dark:text-gray-200 font-bold text-xs"
                >
                  🐢 Nghe chậm
                </button>
              </div>

              {(hasChecked || listeningSupportMode || !currentQuestion.hideTranscriptBeforeAnswer) ? (
                <p className="text-sm font-bold text-[#172033] dark:text-indigo-200 pt-1">
                  Bản chép: &ldquo;{currentQuestion.audioText}&rdquo;
                </p>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-500">
                    Bản chép tiếng Anh sẽ mở sau khi bạn chọn đáp án.
                  </span>
                  <button
                    type="button"
                    onClick={() => setListeningSupportMode(true)}
                    className="text-xs font-bold text-[#6545D8] hover:underline flex items-center gap-1"
                  >
                    <VolumeX className="w-3.5 h-3.5" /> Hiện không nghe được
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 pt-1">
              <h3 className="text-xl sm:text-2xl font-black text-[#172033] dark:text-white">
                {currentQuestion.questionText}
              </h3>
              {currentQuestion.audioText && (
                <button
                  type="button"
                  onClick={() => speakEnglish(currentQuestion.audioText!, false)}
                  className="w-11 h-11 rounded-xl bg-[#F3F0FF] dark:bg-indigo-950/60 text-[#6545D8] flex items-center justify-center shrink-0 hover:brightness-95"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* KHU VỰC TƯƠNG TÁC THEO DẠNG BÀI */}
        {(currentQuestion.type === 'multiple_choice' ||
          currentQuestion.type === 'word_match' ||
          currentQuestion.type === 'fill_blank' ||
          currentQuestion.type === 'listening') &&
          currentQuestion.options && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500">Chọn một đáp án</p>
              {currentQuestion.options.map((opt) => {
                const isCorrectOption = isEnglishAnswerCorrect(opt, currentQuestion);
                const isChosenOption = selectedOption === opt;

                let cardClass =
                  'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-[#6545D8] text-[#172033] dark:text-white';
                if (hasChecked) {
                  if (isCorrectOption) {
                    cardClass =
                      'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 text-[#172033] dark:text-emerald-100';
                  } else if (isChosenOption) {
                    cardClass =
                      'border-red-400 bg-red-50/90 dark:bg-red-950/40 text-[#172033] dark:text-red-100';
                  }
                } else if (isChosenOption) {
                  cardClass =
                    'border-[#6545D8] bg-[#F3F0FF] dark:bg-indigo-950/50 text-[#172033] dark:text-white ring-2 ring-[#6545D8]/20';
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={hasChecked}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full min-h-14 px-4 py-3.5 rounded-2xl border text-left font-black text-base flex items-center justify-between transition-all ${cardClass}`}
                  >
                    <span>{opt}</span>
                    {hasChecked && isCorrectOption && (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Đáp án đúng
                      </span>
                    )}
                    {hasChecked && !isCorrectOption && isChosenOption && (
                      <span className="text-xs font-bold text-red-600 dark:text-red-300">
                        Bạn chọn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

        {currentQuestion.type === 'sentence_order' && currentQuestion.wordBank && (
          <div className="space-y-4">
            <div className="min-h-14 p-3.5 rounded-2xl bg-[#F5F6FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-2">
              {orderedWords.length === 0 ? (
                <span className="text-xs text-gray-400 font-medium">
                  Chạm vào các từ bên dưới theo đúng thứ tự...
                </span>
              ) : (
                orderedWords.map((w, idx) => (
                  <button
                    key={`${w}-${idx}`}
                    type="button"
                    disabled={hasChecked}
                    onClick={() => setOrderedWords(orderedWords.filter((_, i) => i !== idx))}
                    className="min-h-11 px-3.5 py-2 rounded-xl bg-[#6545D8] text-white font-bold text-sm shadow-2xs"
                  >
                    {w}
                  </button>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {currentQuestion.wordBank.map((word, idx) => {
                const usedCount = orderedWords.filter(w => w === word).length;
                const totalInBank = currentQuestion.wordBank!.filter(w => w === word).length;
                const isDisabled = hasChecked || usedCount >= totalInBank;
                return (
                  <button
                    key={`${word}-bank-${idx}`}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setOrderedWords([...orderedWords, word])}
                    className={`min-h-11 px-4 py-2 rounded-xl border font-bold text-sm transition-all ${
                      isDisabled
                        ? 'border-gray-200 bg-gray-100 text-gray-300 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-600'
                        : 'border-gray-300 bg-white dark:bg-gray-900 hover:border-[#6545D8] text-[#172033] dark:text-white'
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(currentQuestion.type === 'short_input' || currentQuestion.type === 'error_correction') && (
          <div className="space-y-2">
            <Input
              type="text"
              disabled={hasChecked}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Nhập câu tiếng Anh của bạn..."
              className="h-13 rounded-2xl text-base font-bold px-4 border-gray-300 dark:border-gray-700"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !hasChecked && textInput.trim()) {
                  handleCheckAnswer();
                }
              }}
            />
            <p className="text-[11px] text-gray-500">
              Hệ thống chấp nhận cả cách viết đầy đủ (I am) hoặc viết tắt (I&apos;m), không phân biệt hoa thường.
            </p>
          </div>
        )}

        {/* KHUNG GHI NHỚ & GIẢI THÍCH TIẾNG VIỆT (Chuẩn Hình 3 bên phải) */}
        {hasChecked && (
          <div className="p-4 rounded-2xl bg-[#F5F6FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-[#172033] dark:text-white">
                {isCurrentCorrect ? '✓ Chính xác · Ghi nhớ' : 'Ghi nhớ'}
              </p>
              <button
                type="button"
                onClick={handleReportQuestion}
                className="text-[11px] font-semibold text-gray-500 hover:text-[#6545D8] flex items-center gap-1"
              >
                <Flag className="w-3 h-3" />
                {reportedToast ? 'Đã ghi nhận phản hồi' : 'Báo đáp án chưa phù hợp'}
              </button>
            </div>

            {!isCurrentCorrect && (
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Đáp án chuẩn: {currentQuestion.correctAnswer}
              </p>
            )}

            <p className="text-sm text-[#172033] dark:text-gray-200 leading-relaxed">
              {currentQuestion.explanationVi}
            </p>

            <p className="text-xs text-gray-500 pt-1">
              {isCurrentCorrect
                ? 'Đã cập nhật vào lịch ôn ngắt quãng của bạn.'
                : 'Câu này sẽ được ôn lại ở cuối bài và trong lịch ôn ngày mai.'}
            </p>
          </div>
        )}

        {/* Nút chính cố định dưới đáy: Kiểm tra / Tiếp tục */}
        <div className="pt-1">
          {!hasChecked ? (
            <Button
              type="button"
              disabled={!canSubmit}
              onClick={handleCheckAnswer}
              className="w-full min-h-13 rounded-2xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-black text-base shadow-xs"
            >
              Kiểm tra
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full min-h-13 rounded-2xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-black text-base shadow-xs"
            >
              Tiếp tục
            </Button>
          )}
        </div>

        {/* Hộp thoại hỏi Lưu phiên hoặc Rời bài khi bấm X */}
        {showExitDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h4 className="text-base font-black text-[#172033] dark:text-white">
                Tạm dừng bài học?
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Tiến độ câu <strong>{currentIdx + 1} / {sessionQuestions.length}</strong> của bạn đã được lưu tự động. Khi quay lại, bạn sẽ mở đúng câu đang làm.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => setShowExitDialog(false)}
                  className="w-full min-h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-xs"
                >
                  Tiếp tục làm bài
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveAndExitSession}
                  className="w-full min-h-11 rounded-xl text-xs font-bold"
                >
                  Lưu phiên & Quay về lộ trình
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // MÀN HÌNH LỘ TRÌNH TIẾNG ANH (ROADMAP VIEW - HÌNH 3 BÊN TRÁI)
  // ==========================================================================
  const dueQuestions = getDueReviewQuestions(progress);
  const dueCount = Math.max(dueQuestions.length, progress.errorNotebook.length > 0 ? 5 : 0);
  const recommended = getNextRecommendedLesson(progress);
  const topicsToShow = showAllTopics
    ? ENGLISH_CURRICULUM_TOPICS
    : ENGLISH_CURRICULUM_TOPICS.filter(t => t.id === recommended.topic.id || t.id === 1);

  const handleAddCustomVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newMeaning.trim()) return;
    const item = {
      id: `voc-${Date.now()}`,
      term: newTerm.trim(),
      meaningVi: newMeaning.trim(),
      sourceSentence: newSourceSentence.trim() || `Term extracted from study document: ${newTerm.trim()}`,
      documentName: 'Tài liệu học tập cá nhân',
      addedAt: new Date().toISOString(),
    };
    onUpdateProgress({
      ...progress,
      customVocabulary: [item, ...(progress.customVocabulary || [])],
    });
    setNewTerm('');
    setNewMeaning('');
    setNewSourceSentence('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header khu Tiếng Anh chuẩn Hình 3 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172033] dark:text-white tracking-tight">
            Tiếng Anh
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Nền tảng · Mục tiêu {progress.dailyGoalMinutes || 15} phút · Bài ngắn mỗi ngày và ôn đúng chỗ bạn hay sai
          </p>
        </div>
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="min-h-11 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            Hồ sơ
          </button>
        )}
      </div>

      {/* Khối Hôm nay: Ôn câu đến hạn (Nền tím nhạt chuẩn Hình 3 bên trái) */}
      <button
        type="button"
        onClick={startSmartReviewSession}
        className="w-full p-5 rounded-2xl bg-[#EEEAFE] dark:bg-indigo-950/50 border border-[#6545D8]/20 text-left hover:brightness-98 transition-all flex items-center justify-between"
      >
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#6545D8] dark:text-indigo-300 block">
            Hôm nay
          </span>
          <span className="text-lg sm:text-xl font-black text-[#172033] dark:text-white flex items-center gap-1.5">
            Ôn {dueCount} câu đến hạn
            <ChevronRight className="w-5 h-5 text-[#172033] dark:text-white" />
          </span>
        </div>
        <span className="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-gray-900 text-[#6545D8] font-bold text-xs shrink-0">
          5 phút
        </span>
      </button>

      {/* Chuyển giữa Lộ trình 8 chủ đề (24 bài) & Từ vựng từ tài liệu */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('roadmap')}
          className={`min-h-11 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subTab === 'roadmap'
              ? 'bg-[#6545D8] text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
          }`}
        >
          Lộ trình 8 chủ đề (24 bài)
        </button>
        <button
          type="button"
          onClick={() => setSubTab('doc_vocab')}
          className={`min-h-11 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'doc_vocab'
              ? 'bg-[#6545D8] text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Từ vựng từ tài liệu của bạn ({(progress.customVocabulary || []).length})</span>
        </button>
      </div>

      {subTab === 'roadmap' ? (
        <div className="space-y-8">
          {topicsToShow.map((topic) => (
            <div key={topic.id} className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <h2 className="text-lg sm:text-xl font-black text-[#172033] dark:text-white">
                  Chủ đề {topic.id} &nbsp;{topic.title}
                </h2>
                <span className="text-xs text-gray-500 font-medium">
                  Đầu ra: {topic.canDoOutput}
                </span>
              </div>

              <div className="space-y-3">
                {topic.lessons.map((lesson) => {
                  const completedRec = progress.completedLessons[lesson.id];
                  const isCompleted = Boolean(completedRec);
                  const isRecommended = recommended.lesson.id === lesson.id;
                  const hasSavedSession = progress.activeSession?.lessonId === lesson.id;

                  return (
                    <div
                      key={lesson.id}
                      className={`p-5 rounded-2xl transition-all ${
                        isRecommended
                          ? 'bg-white dark:bg-gray-900 border-2 border-[#6545D8] shadow-xs'
                          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Vòng tròn số thứ tự 1, 2, 3 chuẩn Hình 3 */}
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                            isRecommended
                              ? 'bg-[#6545D8] text-white'
                              : isCompleted
                              ? 'bg-[#E5E7EB] dark:bg-gray-800 text-[#172033] dark:text-gray-200'
                              : 'bg-[#E5E7EB] dark:bg-gray-800 text-gray-500'
                          }`}
                        >
                          {lesson.orderInTopic}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-black text-[#172033] dark:text-white">
                              {lesson.title}
                            </h3>
                            {isCompleted && !isRecommended && (
                              <button
                                type="button"
                                onClick={() => startLessonSession(lesson, false)}
                                className="text-xs font-bold text-[#6545D8] hover:underline flex items-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Ôn lại
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 font-medium">
                            {hasSavedSession
                              ? `Đang làm dở · Còn ${Math.max(1, (progress.activeSession?.questionIds.length || lesson.questions.length) - (progress.activeSession?.currentIndex || 0))} câu`
                              : isCompleted
                              ? `Đã hoàn thành · Đúng lần đầu ${completedRec.firstTryCorrect}/${completedRec.totalQuestions} câu`
                              : isRecommended
                              ? `Bài tiếp theo · ${lesson.durationMinutes} phút`
                              : `Sau bài ${lesson.orderInTopic - 1} · ${lesson.durationMinutes} phút`}
                          </p>

                          {isRecommended && (
                            <div className="pt-3">
                              <Button
                                type="button"
                                onClick={() => startLessonSession(lesson, hasSavedSession)}
                                className="w-full min-h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-sm"
                              >
                                {hasSavedSession ? 'Tiếp tục câu đang làm' : 'Học tiếp'}
                              </Button>
                            </div>
                          )}

                          {!isRecommended && !isCompleted && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => startLessonSession(lesson, false)}
                                className="text-xs font-bold text-[#6545D8] hover:underline"
                              >
                                Mở bài này &gt;
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAllTopics(!showAllTopics)}
              className="min-h-11 text-sm font-black text-[#6545D8] hover:underline flex items-center gap-1"
            >
              <span>
                {showAllTopics
                  ? 'Thu gọn danh sách chủ đề'
                  : 'Xem các chủ đề khác (Trọn bộ 8 chủ đề · 24 bài học) >'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Khu vực Từ vựng Tiếng Anh từ tài liệu môn học của bạn (Mục 10) */
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
            <h3 className="text-base font-black text-[#172033] dark:text-white">
              Từ vựng Tiếng Anh rút trích từ tài liệu của bạn
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Học thuật ngữ tiếng Anh gắn trực tiếp với câu gốc trong tài liệu môn học bạn đang đọc. Bạn cũng có thể bấm <strong>&ldquo;Rút trích từ vựng Tiếng Anh&rdquo;</strong> ngay trong không gian Tài liệu.
            </p>

            <form onSubmit={handleAddCustomVocab} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <Input
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Thuật ngữ / Từ tiếng Anh (VD: Photosynthesis)"
                className="h-11 rounded-xl text-xs font-bold"
              />
              <Input
                value={newMeaning}
                onChange={(e) => setNewMeaning(e.target.value)}
                placeholder="Nghĩa tiếng Việt (VD: Quang hợp)"
                className="h-11 rounded-xl text-xs font-bold"
              />
              <div className="flex gap-2">
                <Input
                  value={newSourceSentence}
                  onChange={(e) => setNewSourceSentence(e.target.value)}
                  placeholder="Câu gốc trong tài liệu..."
                  className="h-11 rounded-xl text-xs flex-1"
                />
                <Button
                  type="submit"
                  className="h-11 px-4 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-xs shrink-0"
                >
                  Lưu từ
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            {(progress.customVocabulary || []).length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center space-y-2">
                <p className="text-sm font-bold text-[#172033] dark:text-white">
                  Chưa có từ vựng nào từ tài liệu
                </p>
                <p className="text-xs text-gray-500">
                  Hãy thêm từ ở khung trên hoặc mở một tài liệu trong mục Tài liệu để trích xuất thuật ngữ.
                </p>
              </div>
            ) : (
              progress.customVocabulary.map((voc) => (
                <div
                  key={voc.id}
                  className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#6545D8]">{voc.term}</span>
                      <span className="text-sm font-bold text-[#172033] dark:text-white">
                        — {voc.meaningVi}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                      &ldquo;{voc.sourceSentence}&rdquo;
                    </p>
                    <p className="text-[11px] font-bold text-gray-400">
                      Nguồn: {voc.documentName} {voc.pageNumber ? `· trang ${voc.pageNumber}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakEnglish(voc.term, false)}
                    className="w-10 h-10 rounded-xl bg-[#F3F0FF] text-[#6545D8] flex items-center justify-center shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
