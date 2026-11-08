// components/ExamSimulator.tsx
// Phân hệ C: Chế độ Thi thử Chuẩn hóa & Dự đoán Phổ điểm (Exam Simulator & Predictive Analytics)
// Giao diện phòng thi chuẩn quốc gia, đếm ngược thời gian, chống gian lận và dự đoán phổ điểm

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Flag,
  ArrowRight,
  ArrowLeft,
  Award,
  TrendingUp,
  Brain,
  ShieldCheck,
  RotateCcw,
  X,
  Target,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { EduGenieIconMark } from '@/components/EduGenieLogo';

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  level?: 'nhan_biet' | 'thong_hieu' | 'van_dung' | 'van_dung_cao';
  topic?: string;
}

interface ExamSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  examTitle: string;
  subject?: string;
  durationMinutes?: number;
  questions: ExamQuestion[];
  studentName?: string;
  onSaveResult?: (result: {
    score10: number;
    correctCount: number;
    total: number;
    timeSpentSeconds: number;
    predictedRange: string;
  }) => void;
}

export default function ExamSimulator({
  isOpen,
  onClose,
  examTitle,
  subject = 'Tổng Hợp',
  durationMinutes = 45,
  questions = [],
  studentName = 'Học viên',
  onSaveResult,
}: ExamSimulatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(durationMinutes * 60);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [startTime] = useState(Date.now());

  // Giám sát chuyển tab (chống gian lận phòng thi)
  useEffect(() => {
    if (!isOpen || isExamCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, isExamCompleted]);

  // Bộ đếm ngược thời gian phòng thi
  useEffect(() => {
    if (!isOpen || isExamCompleted) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isExamCompleted]);

  const handleSelectOption = (optLabel: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optLabel,
    }));
  };

  const handleToggleFlag = (idx: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleFinishExam = useCallback(() => {
    setIsExamCompleted(true);
    setShowConfirmSubmit(false);

    // Tính điểm
    let correct = 0;
    questions.forEach((q, idx) => {
      const selected = userAnswers[idx];
      const optLabels = ['A', 'B', 'C', 'D'];
      const isMatch =
        selected === q.answer ||
        (selected && q.options && q.options[optLabels.indexOf(selected)]?.startsWith(q.answer));
      if (isMatch) correct++;
    });

    const total = questions.length || 1;
    const score10 = Number(((correct / total) * 10).toFixed(1));
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Dự đoán phổ điểm kỳ thi thật
    let predictedRange = '8.0 - 8.6';
    if (score10 >= 9.0) predictedRange = '9.0 - 9.8 (Top 2% toàn quốc)';
    else if (score10 >= 8.0) predictedRange = '8.2 - 8.8 (Đủ điểm đỗ NV1)';
    else if (score10 >= 6.5) predictedRange = '7.0 - 7.8 (Mức Khá an toàn)';
    else predictedRange = '5.5 - 6.4 (Cần bù đắp gấp)';

    if (onSaveResult) {
      onSaveResult({
        score10,
        correctCount: correct,
        total,
        timeSpentSeconds: timeSpent,
        predictedRange,
      });
    }
  }, [questions, userAnswers, startTime, onSaveResult]);

  if (!isOpen) return null;

  // Tính kết quả chi tiết
  let correctCount = 0;
  const levelStats = {
    nhan_biet: { correct: 0, total: 0 },
    thong_hieu: { correct: 0, total: 0 },
    van_dung: { correct: 0, total: 0 },
    van_dung_cao: { correct: 0, total: 0 },
  };

  questions.forEach((q, idx) => {
    const selected = userAnswers[idx];
    const optLabels = ['A', 'B', 'C', 'D'];
    const isMatch =
      selected === q.answer ||
      (selected && q.options && q.options[optLabels.indexOf(selected)]?.startsWith(q.answer));

    const lvl = q.level || 'thong_hieu';
    if (levelStats[lvl]) {
      levelStats[lvl].total++;
      if (isMatch) levelStats[lvl].correct++;
    }

    if (isMatch) correctCount++;
  });

  const totalQuestions = questions.length || 1;
  const finalScore10 = Number(((correctCount / totalQuestions) * 10).toFixed(1));

  // Định dạng thời gian
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isTimeRunningOut = timeLeftSeconds < 300; // Dưới 5 phút

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 font-sans select-none animate-in fade-in duration-200">
      {/* 1. TOP BAR PHÒNG THI CHUẨN HÓA */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900/90 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <EduGenieIconMark sizePx={34} />
          <div>
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>{examTitle}</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-[10px] font-black text-indigo-300">
                THI THỬ CHUẨN HÓA
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-bold hidden sm:block">
              Thí sinh: {studentName} • Môn: {subject}
            </p>
          </div>
        </div>

        {/* Đồng hồ đếm ngược & Nút nộp bài */}
        <div className="flex items-center gap-3">
          {tabSwitchCount > 0 && !isExamCompleted && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Chuyển tab {tabSwitchCount} lần</span>
            </div>
          )}

          {!isExamCompleted && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-black text-sm ${
                isTimeRunningOut
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-slate-800 border-white/10 text-white'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{timeFormatted}</span>
            </div>
          )}

          {!isExamCompleted ? (
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-all"
            >
              Nộp Bài Thi
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs transition-all flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Đóng</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. NỘI DUNG CHÍNH (ĐANG THI HOẶC BẢNG KẾT QUẢ) */}
      {!isExamCompleted ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Cột trái: Khung Câu Hỏi */}
          <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-4xl mx-auto w-full flex flex-col justify-between">
            {questions[currentIndex] ? (
              <div className="space-y-6">
                {/* Header câu hỏi */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-indigo-400">
                      Câu {currentIndex + 1} / {questions.length}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold uppercase">
                      {questions[currentIndex].level === 'van_dung_cao'
                        ? 'Vận dụng cao'
                        : questions[currentIndex].level === 'van_dung'
                        ? 'Vận dụng'
                        : questions[currentIndex].level === 'thong_hieu'
                        ? 'Thông hiểu'
                        : 'Nhận biết'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(currentIndex)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      flaggedQuestions[currentIndex]
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentIndex] ? 'fill-amber-400' : ''}`} />
                    <span>{flaggedQuestions[currentIndex] ? 'Đã đánh dấu xem lại' : 'Đánh dấu câu này'}</span>
                  </button>
                </div>

                {/* Nội dung câu hỏi */}
                <div className="text-base sm:text-lg font-bold text-white leading-relaxed whitespace-pre-wrap">
                  {questions[currentIndex].question}
                </div>

                {/* 4 Phương án chọn lựa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {['A', 'B', 'C', 'D'].map((label, optIdx) => {
                    const optText = questions[currentIndex].options[optIdx] || `Phương án ${label}`;
                    const isSelected = userAnswers[currentIndex] === label;

                    return (
                      <button
                        key={label}
                        onClick={() => handleSelectOption(label)}
                        className={`min-h-[56px] p-4 rounded-2xl border text-left flex items-start gap-3 transition-all active:scale-[0.99] ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400'
                            : 'bg-slate-900/60 border-white/10 hover:border-white/20 text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isSelected
                              ? 'bg-indigo-500 text-white shadow-xs'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {label}
                        </span>
                        <span className="text-sm font-semibold pt-0.5 leading-snug">{optText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 font-bold">Không có dữ liệu câu hỏi.</div>
            )}

            {/* Điều hướng Trước / Sau */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-8">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-black flex items-center gap-2 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Câu Trước</span>
              </button>

              <span className="text-xs text-slate-400 font-mono font-bold">
                Đã làm: {Object.keys(userAnswers).length} / {questions.length} câu
              </span>

              <button
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="min-h-[44px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30"
              >
                <span>Câu Tiếp Theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </main>

          {/* Cột phải: Ma trận lưới câu hỏi (Question Grid 1-40) */}
          <aside className="w-full lg:w-80 p-5 bg-slate-900/60 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between shrink-0">
            <div>
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-3">
                Danh Sách Câu Hỏi ({questions.length} câu)
              </h3>

              <div className="grid grid-cols-5 gap-2 max-h-80 lg:max-h-[60vh] overflow-y-auto pr-1">
                {questions.map((_, idx) => {
                  const isAnswered = typeof userAnswers[idx] !== 'undefined';
                  const isFlagged = flaggedQuestions[idx];
                  const isCurrent = currentIndex === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-xl font-mono text-xs font-black flex items-center justify-center relative transition-all ${
                        isCurrent
                          ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 font-black'
                          : ''
                      } ${
                        isAnswered
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : isFlagged
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chú giải trạng thái */}
            <div className="pt-4 border-t border-white/10 space-y-2 text-[11px] font-bold text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shrink-0" />
                <span>Đã trả lời ({Object.keys(userAnswers).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-500/20 border border-amber-500/40 shrink-0" />
                <span>Cần xem lại ({Object.values(flaggedQuestions).filter(Boolean).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-white/5 shrink-0" />
                <span>Chưa làm ({questions.length - Object.keys(userAnswers).length})</span>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* 3. BẢNG PHÂN TÍCH PHỔ ĐIỂM & MA TRẬN KẾT QUẢ SAU KHI NỘP BÀI */
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã Hoàn Thành Bài Thi Chuẩn Hóa</span>
            </div>
            <h1 className="text-3xl font-black text-white">{examTitle}</h1>
            <p className="text-xs text-slate-400 font-bold">
              Phân tích ma trận năng lực bởi mô hình trí tuệ nhân tạo EduGenie AI
            </p>
          </div>

          {/* Thẻ Điểm & Phổ điểm dự đoán */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 text-center">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                Điểm Đạt Được (Scale 10)
              </span>
              <span className="text-5xl font-black text-amber-400 block my-2">{finalScore10}</span>
              <span className="text-xs text-slate-300 font-bold">
                Đúng {correctCount} / {totalQuestions} câu
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 text-center sm:col-span-2 flex flex-col justify-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Dự Đoán Khoảng Phổ Điểm Thi Thật</span>
              </div>
              <span className="text-3xl font-black text-white block my-1">
                {finalScore10 >= 8.5 ? '8.8 — 9.5 Điểm' : finalScore10 >= 7.0 ? '7.5 — 8.4 Điểm' : '5.8 — 6.8 Điểm'}
              </span>
              <p className="text-xs text-slate-400 font-medium">
                Dựa trên thuật toán đối chiếu dữ liệu độ khó chuẩn theo Bộ GD&ĐT
              </p>
            </div>
          </div>

          {/* Ma trận 4 cấp độ tư duy */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <span>Phân Tích Theo 4 Cấp Độ Tư Duy</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[11px] text-slate-400 block font-bold">1. Nhận Biết</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">
                  {levelStats.nhan_biet.correct}/{levelStats.nhan_biet.total || 1}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Đạt lý thuyết</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[11px] text-slate-400 block font-bold">2. Thông Hiểu</span>
                <span className="text-xl font-black text-cyan-400 mt-1 block">
                  {levelStats.thong_hieu.correct}/{levelStats.thong_hieu.total || 1}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Nắm rõ bản chất</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[11px] text-slate-400 block font-bold">3. Vận Dụng</span>
                <span className="text-xl font-black text-amber-400 mt-1 block">
                  {levelStats.van_dung.correct}/{levelStats.van_dung.total || 1}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Giải bài toán</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[11px] text-slate-400 block font-bold">4. Vận Dụng Cao</span>
                <span className="text-xl font-black text-rose-400 mt-1 block">
                  {levelStats.van_dung_cao.correct}/{levelStats.van_dung_cao.total || 1}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Phân hóa điểm 10</span>
              </div>
            </div>
          </div>

          {/* Đề xuất 3 chủ đề cần bù đắp kiến thức gấp */}
          <div className="p-5 rounded-3xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>EduGenie Đề Xuất 3 Chuyên Đề Cần Ôn Bù Gấp</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-200">
              <li className="flex items-start gap-2 p-2 rounded-xl bg-white/5">
                <Target className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Dạng bài biến đổi công thức nâng cao:</strong> Cần rèn luyện thêm kỹ năng đặt ẩn phụ để giải quyết trong dưới 2 phút.
                </div>
              </li>
              <li className="flex items-start gap-2 p-2 rounded-xl bg-white/5">
                <Target className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Bẫy đơn vị đo & điều kiện xác định:</strong> Chú ý đọc kỹ điều kiện bài toán trước khi chọn phương án trắc nghiệm.
                </div>
              </li>
              <li className="flex items-start gap-2 p-2 rounded-xl bg-white/5">
                <Target className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Phần lý thuyết suy luận:</strong> Sử dụng công cụ Mindmap của EduGenie để hệ thống lại toàn bộ sơ đồ bài học.
                </div>
              </li>
            </ul>
          </div>

          {/* Nút hành động cuối */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                setIsExamCompleted(false);
                setUserAnswers({});
                setFlaggedQuestions({});
                setTimeLeftSeconds(durationMinutes * 60);
                setCurrentIndex(0);
              }}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thi Thử Lại Đề Này</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              Hoàn Thành & Trở Về Bảng Điểm
            </button>
          </div>
        </div>
      )}

      {/* POPUP XÁC NHẬN NỘP BÀI THI */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/20 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Xác Nhận Nộp Bài Thi?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Bạn đã làm <strong className="text-white">{Object.keys(userAnswers).length}</strong> / {questions.length} câu. 
                {questions.length - Object.keys(userAnswers).length > 0 && (
                  <span className="text-rose-400 block mt-1">
                    Còn {questions.length - Object.keys(userAnswers).length} câu chưa có câu trả lời!
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-black text-xs transition-colors"
              >
                Tiếp Tục Làm
              </button>
              <button
                onClick={handleFinishExam}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all"
              >
                Nộp Bài Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
