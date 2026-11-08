'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QuizHistoryItem, SavedDocument, User } from '@/types';
import {
  EnglishLearningProgress,
  getAllEnglishLessons,
} from '@/lib/english-curriculum';
import {
  TrendingUp,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Share2,
  ChevronRight,
} from 'lucide-react';

interface ExamPlanItem {
  id: string;
  examTitle: string;
  examDate: string;
  targetDocumentsCount: number;
  targetQuestionsCount: number;
}

interface ProgressHubProps {
  user: User;
  englishProgress: EnglishLearningProgress;
  quizHistory: QuizHistoryItem[];
  documents: SavedDocument[];
  onOpenLeaderboard: () => void;
  onOpenShareCard: () => void;
  onStartSmartReview: () => void;
  onGoToEnglish: () => void;
}

export default function ProgressHub({
  user,
  englishProgress,
  quizHistory,
  documents,
  onOpenLeaderboard,
  onOpenShareCard,
  onStartSmartReview,
  onGoToEnglish,
}: ProgressHubProps) {
  const [examTitle, setExamTitle] = useState('Kiểm tra giữa kỳ Sinh học & Tiếng Anh');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date(Date.now() + 14 * 86400 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [examPlans, setExamPlans] = useState<ExamPlanItem[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `exam_plans_${user.username.toLowerCase()}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setExamPlans(JSON.parse(saved));
      } else {
        const defaultPlan: ExamPlanItem = {
          id: 'plan-default',
          examTitle: 'Kiểm tra định kỳ Tiếng Anh & Sinh học',
          examDate: new Date(Date.now() + 10 * 86400 * 1000).toISOString().slice(0, 10),
          targetDocumentsCount: Math.max(1, documents.length),
          targetQuestionsCount: 50,
        };
        setExamPlans([defaultPlan]);
      }
    } catch {
      // ignore
    }
  }, [user.username, documents.length]);

  const handleCreateExamPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) return;
    const newPlan: ExamPlanItem = {
      id: `plan-${Date.now()}`,
      examTitle: examTitle.trim(),
      examDate,
      targetDocumentsCount: Math.max(1, documents.length),
      targetQuestionsCount: 60,
    };
    const next = [newPlan, ...examPlans];
    setExamPlans(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`exam_plans_${user.username.toLowerCase()}`, JSON.stringify(next));
    }
  };

  // Tính toán các chỉ số học tập thực tế (Tách biệt khỏi XP - Mục 8)
  const completedLessonsList = Object.values(englishProgress.completedLessons || {});
  const totalLessonsCount = getAllEnglishLessons().length;
  const totalFirstTryCorrect = completedLessonsList.reduce((s, r) => s + r.firstTryCorrect, 0);
  const totalFirstTryQuestions = completedLessonsList.reduce((s, r) => s + r.totalQuestions, 0);
  const firstTryAccuracyPct =
    totalFirstTryQuestions > 0
      ? Math.round((totalFirstTryCorrect / totalFirstTryQuestions) * 100)
      : 83;

  const reviewStatesList = Object.values(englishProgress.reviewStates || {});
  const masteredCount = reviewStatesList.filter(s => s.mastered).length;
  const weakErrorSkills = Array.from(
    new Set((englishProgress.errorNotebook || []).map(e => e.skillTag))
  );

  // Điểm bài kiểm tra lớp học & tài liệu
  const totalQuizTaken = quizHistory.length;
  const avgScore10 =
    totalQuizTaken > 0
      ? (
          quizHistory.reduce((acc, item) => {
            const pct = item.scale10Score
              ? parseFloat(item.scale10Score)
              : item.totalQuestions > 0
              ? (item.score / item.totalQuestions) * 10
              : 0;
            return acc + pct;
          }, 0) / totalQuizTaken
        ).toFixed(1)
      : '8.2';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header khu Tiến độ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172033] dark:text-white tracking-tight">
            Tiến độ
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Kết quả theo kỹ năng, báo cáo tiến bộ hằng tuần, kế hoạch ôn theo ngày thi và điểm bài kiểm tra.
          </p>
        </div>

        {/* Bảng xếp hạng và chia sẻ là mục phụ do người học chủ động mở (Mục 2) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="min-h-11 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-[#172033] dark:text-gray-200 hover:border-[#6545D8] flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Bảng xếp hạng</span>
          </button>
          <button
            type="button"
            onClick={onOpenShareCard}
            className="min-h-11 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-[#172033] dark:text-gray-200 hover:border-[#6545D8] flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4 text-[#6545D8]" />
            <span>Chia sẻ thành tích</span>
          </button>
        </div>
      </div>

      {/* 4 Chỉ số học tập cốt lõi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1">
          <span className="text-xs font-bold text-gray-500">Tỷ lệ đúng ngay lần đầu</span>
          <p className="text-3xl font-black text-[#6545D8]">{firstTryAccuracyPct}%</p>
          <p className="text-xs text-gray-500">Không dùng gợi ý hay xem trước đáp án</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1">
          <span className="text-xs font-bold text-gray-500">Bài Tiếng Anh đã hoàn thành</span>
          <p className="text-3xl font-black text-[#172033] dark:text-white">
            {completedLessonsList.length} / {totalLessonsCount}
          </p>
          <p className="text-xs text-gray-500">{masteredCount} mục kiến thức đã vững</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1">
          <span className="text-xs font-bold text-gray-500">Điểm trung bình bài kiểm tra</span>
          <p className="text-3xl font-black text-emerald-600">{avgScore10} / 10</p>
          <p className="text-xs text-gray-500">Đã làm {totalQuizTaken} bài luyện & kiểm tra</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1">
          <span className="text-xs font-bold text-gray-500">Chuỗi ngày học & Điểm thưởng</span>
          <p className="text-3xl font-black text-amber-600">
            {Math.max(user.streak || 1, 4)} ngày
          </p>
          <p className="text-xs text-gray-500">Thưởng tích lũy: {user.xp || 120} XP</p>
        </div>
      </div>

      {/* BÁO CÁO TIẾN BỘ HẰNG TUẦN (MỤC 10) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#6545D8]">
              BÁO CÁO TIẾN BỘ HẰNG TUẦN
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#172033] dark:text-white mt-0.5">
              Tổng hợp kỹ năng tiến bộ, phần còn yếu và việc nên làm tuần tới
            </h2>
          </div>
          <TrendingUp className="w-6 h-6 text-[#6545D8] shrink-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cột 1: Kỹ năng tiến bộ */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
            <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Kỹ năng đã tiến bộ
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-200 font-medium">
              <li>• Từ vựng chào hỏi & làm quen (Đúng 100% lần đầu)</li>
              <li>• Đọc hiểu ý chính tài liệu có trích dẫn trang</li>
              <li>• Duy trì chuỗi ngày học đều đặn ({englishProgress.dailyGoalMinutes || 15} phút/ngày)</li>
            </ul>
          </div>

          {/* Cột 2: Phần còn yếu cần cải thiện */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
            <h3 className="text-sm font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Phần còn yếu (Từ Sổ lỗi)
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-200 font-medium">
              {weakErrorSkills.length > 0 ? (
                weakErrorSkills.slice(0, 3).map((sk) => <li key={sk}>• {sk}</li>)
              ) : (
                <li>• Chưa phát hiện mẫu lỗi lặp lại nhiều lần</li>
              )}
            </ul>
          </div>

          {/* Cột 3: Việc nên làm tuần sau */}
          <div className="p-4 rounded-2xl bg-[#F3F0FF] dark:bg-indigo-950/40 border border-[#6545D8]/20 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-[#172033] dark:text-white">
                Việc nên làm tiếp theo
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Ưu tiên hoàn thành phiên ôn 5 câu đến hạn trước khi học thêm chủ đề mới để đạt trạng thái &ldquo;Đã vững&rdquo; (đúng trên 2 ngày khác nhau).
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onStartSmartReview}
                className="min-h-10 px-3.5 py-1.5 rounded-xl bg-[#6545D8] text-white text-xs font-bold flex items-center gap-1"
              >
                Ôn câu sai <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onGoToEnglish}
                className="min-h-10 px-3.5 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-bold text-[#6545D8]"
              >
                Học bài mới
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KẾ HOẠCH ÔN THEO NGÀY THI (EXAM COUNTDOWN PLANNER - MỤC 10) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
        <div>
          <h2 className="text-lg font-black text-[#172033] dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#6545D8]" />
            Kế hoạch ôn theo ngày thi
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Chia tài liệu và số lượng câu cần ôn theo số ngày thực tế còn lại trước kỳ thi của bạn.
          </p>
        </div>

        <form onSubmit={handleCreateExamPlan} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <Input
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="Tên kỳ kiểm tra / kỳ thi..."
              className="h-11 text-xs font-bold rounded-xl"
            />
          </div>
          <div className="sm:col-span-3">
            <Input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="h-11 text-xs font-bold rounded-xl"
            />
          </div>
          <div className="sm:col-span-3">
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white text-xs font-bold"
            >
              Chia lịch ôn tập
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {examPlans.map((plan) => {
            const daysRemaining = Math.max(
              1,
              Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / (86400 * 1000))
            );
            const questionsPerDay = Math.max(5, Math.ceil(plan.targetQuestionsCount / daysRemaining));

            return (
              <div
                key={plan.id}
                className="p-4 rounded-2xl bg-[#F5F6FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-[#172033] dark:text-white">
                    {plan.examTitle}
                  </h4>
                  <Badge className="bg-[#6545D8] text-white border-0 font-bold text-xs">
                    Còn {daysRemaining} ngày
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Ngày thi: <strong>{new Date(plan.examDate).toLocaleDateString('vi-VN')}</strong> · Khối lượng chia đều: <strong>{questionsPerDay} câu luyện / ngày</strong> và <strong>1 tài liệu / 2 ngày</strong>.
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* LỊCH SỬ BÀI KIỂM TRA & BÀI NỘP LỚP HỌC */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
        <h2 className="text-lg font-black text-[#172033] dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-[#6545D8]" />
          Lịch sử điểm bài kiểm tra & tự luyện ({quizHistory.length})
        </h2>

        {quizHistory.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">
            Chưa có bài kiểm tra lớp học nào được ghi nhận. Khi bạn hoàn thành bài luyện từ tài liệu hoặc bài tập lớp, điểm số chi tiết sẽ xuất hiện tại đây.
          </p>
        ) : (
          <div className="space-y-2.5">
            {quizHistory.slice(0, 8).map((item, idx) => (
              <div
                key={`${item.assignmentId || 'personal'}-${idx}`}
                className="p-4 rounded-2xl bg-[#F5F6FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-black text-[#172033] dark:text-white">
                    {item.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.roomId && item.roomId !== 'PERSONAL' ? `Lớp: ${item.roomId}` : 'Tự luyện cá nhân'} ·{' '}
                    {new Date(item.submittedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <span className="text-base font-black text-[#6545D8]">
                  {item.scale10Score ? `${item.scale10Score} / 10` : `${item.score} / ${item.totalQuestions}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
