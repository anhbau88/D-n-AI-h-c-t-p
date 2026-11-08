'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Assignment, SavedDocument, User } from '@/types';
import {
  EnglishLearningProgress,
  getNextRecommendedLesson,
  getDueReviewQuestions,
} from '@/lib/english-curriculum';
import { ChevronRight, Plus } from 'lucide-react';

interface TodayDashboardProps {
  user: User;
  englishProgress: EnglishLearningProgress;
  onUpdateEnglishProgress: (next: EnglishLearningProgress) => void;
  documents: SavedDocument[];
  assignments: Assignment[];
  completedAssignmentIds: string[];
  joinedRooms: { id: string; name: string }[];
  onStartEnglishLesson: (lessonId: string) => void;
  onStartEnglishReview: () => void;
  onOpenDocument: (doc: SavedDocument) => void;
  onOpenSampleBiologyDoc: () => void;
  onOpenUploadDocument: () => void;
  onOpenAssignment: (assignment: Assignment) => void;
  onOpenMyClasses: () => void;
  onJoinClassPrompt: () => void;
}

export default function TodayDashboard({
  user,
  englishProgress,
  onUpdateEnglishProgress,
  documents,
  assignments,
  completedAssignmentIds,
  joinedRooms,
  onStartEnglishLesson,
  onStartEnglishReview,
  onOpenDocument,
  onOpenSampleBiologyDoc,
  onOpenUploadDocument,
  onOpenAssignment,
  onOpenMyClasses,
  onJoinClassPrompt,
}: TodayDashboardProps) {
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [alternateChoiceIdx, setAlternateChoiceIdx] = useState(0);

  const recommendedEnglish = getNextRecommendedLesson(englishProgress);
  const dueReviewList = getDueReviewQuestions(englishProgress);
  const dueCount = Math.max(dueReviewList.length, englishProgress.errorNotebook.length > 0 ? 5 : 0);

  // Tìm các bài tập lớp học chưa nộp
  const pendingAssignments = assignments.filter(a => !completedAssignmentIds.includes(a.id));
  const nextAssignment = pendingAssignments[0];

  const goalMinutes = englishProgress.dailyGoalMinutes || 15;
  const studiedMinutes = englishProgress.minutesStudiedToday || 5;
  const goalProgressPct = Math.min(100, Math.round((studiedMinutes / goalMinutes) * 100));
  const streakDays = Math.max(user.streak || 1, 4);

  // Danh sách các phương án gợi ý có lý do giải thích (Mục 9) để người học có thể "Đổi việc học"
  const heroRecommendations = [
    {
      badge: 'TIẾP TỤC HỌC',
      title: recommendedEnglish.lesson.title,
      subtitle: recommendedEnglish.reasonVi,
      buttonLabel: `Học tiếp · ${recommendedEnglish.lesson.durationMinutes} phút`,
      onAction: () => onStartEnglishLesson(recommendedEnglish.lesson.id),
    },
    ...(dueCount > 0
      ? [
          {
            badge: 'ĐẾN LỊCH ÔN TẬP',
            title: `Ôn ${dueCount} câu đến hạn`,
            subtitle: `Bạn có ${dueCount} câu cần ôn hôm nay theo lịch ngắt quãng`,
            buttonLabel: 'Bắt đầu ôn · 5 phút',
            onAction: onStartEnglishReview,
          },
        ]
      : []),
    ...(nextAssignment
      ? [
          {
            badge: 'BÀI LỚP SẮP ĐẾN HẠN',
            title: nextAssignment.title,
            subtitle: `Bài được giao trong lớp ${nextAssignment.roomId} · Cần hoàn thành sớm`,
            buttonLabel: 'Làm bài lớp ngay',
            onAction: () => onOpenAssignment(nextAssignment),
          },
        ]
      : []),
  ];

  const activeHero = heroRecommendations[alternateChoiceIdx % heroRecommendations.length];

  const formatDueLabel = (endTime?: string) => {
    if (!endTime) return 'Hạn mai';
    const diffHours = (new Date(endTime).getTime() - Date.now()) / (1000 * 3600);
    if (diffHours < 0) return 'Quá hạn';
    if (diffHours <= 36) return 'Hạn mai';
    return `Hạn ${new Date(endTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      {/* Tiêu đề trang & Kế hoạch thời gian (Chuẩn Hình 1) */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-[32px] font-black text-[#172033] dark:text-white tracking-tight leading-tight">
          Hôm nay bạn học gì?
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
          <span>Kế hoạch {goalMinutes} phút</span>
          <span>·</span>
          <button
            type="button"
            onClick={() => setShowGoalEditor(!showGoalEditor)}
            className="text-gray-600 dark:text-gray-300 hover:text-[#6545D8] font-semibold underline-offset-4 hover:underline"
          >
            Đổi mục tiêu
          </button>
          {heroRecommendations.length > 1 && (
            <>
              <span>·</span>
              <button
                type="button"
                onClick={() => setAlternateChoiceIdx(prev => prev + 1)}
                className="text-[#6545D8] font-bold hover:underline"
              >
                Đổi việc học gợi ý
              </button>
            </>
          )}
        </div>

        {/* Khung chọn nhanh mục tiêu thời gian học mỗi ngày (2 bước đơn giản) */}
        {showGoalEditor && (
          <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#172033] dark:text-white">
              Chọn mục tiêu thời gian học mỗi ngày:
            </span>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 20, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    onUpdateEnglishProgress({
                      ...englishProgress,
                      dailyGoalMinutes: mins,
                    });
                    setShowGoalEditor(false);
                  }}
                  className={`min-h-10 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    goalMinutes === mins
                      ? 'bg-[#6545D8] text-white'
                      : 'bg-[#F5F6FA] dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {mins} phút / ngày
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* HÀNG 1: HERO TIẾP TỤC HỌC (2/3) + MỤC TIÊU HÔM NAY (1/3) — CHUẨN HÌNH 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Cột trái: Thẻ Tiếp tục học nền tím nhạt */}
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-3xl bg-[#EEEAFE] dark:bg-indigo-950/50 border border-[#6545D8]/15 flex flex-col justify-between space-y-5">
          <div className="space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-[#6545D8] dark:text-indigo-300 block">
              {activeHero.badge}
            </span>
            <h2 className="text-2xl sm:text-[28px] font-black text-[#172033] dark:text-white leading-tight">
              {activeHero.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              {activeHero.subtitle}
            </p>
          </div>

          <div>
            <Button
              type="button"
              onClick={activeHero.onAction}
              className="min-h-12 px-7 rounded-2xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-sm sm:text-base shadow-xs"
            >
              {activeHero.buttonLabel}
            </Button>
          </div>
        </div>

        {/* Cột phải: Thẻ Mục tiêu hôm nay */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-black text-[#172033] dark:text-white">
              Mục tiêu hôm nay
            </h3>
            <p className="text-2xl sm:text-3xl font-black text-[#6545D8]">
              {studiedMinutes} / {goalMinutes} phút
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-full h-3 rounded-full bg-[#EBECEF] dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-[#6545D8] rounded-full transition-all duration-300"
                style={{ width: `${goalProgressPct}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Chuỗi học {streakDays} ngày
            </p>
          </div>
        </div>
      </div>

      {/* HÀNG 2: VIỆC CẦN LÀM (2/3) + LỚP CỦA TÔI (1/3) — CHUẨN HÌNH 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Cột trái: Việc cần làm (Tối đa 3 việc) */}
        <div className="lg:col-span-8 space-y-3">
          <h3 className="text-lg font-black text-[#172033] dark:text-white">
            Việc cần làm
          </h3>

          <div className="space-y-3">
            {/* Việc 1: Ôn câu đến hạn */}
            <button
              type="button"
              onClick={onStartEnglishReview}
              className="w-full min-h-15 px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#6545D8] flex items-center justify-between transition-all text-left"
            >
              <span className="text-sm sm:text-base font-black text-[#172033] dark:text-white">
                Ôn {dueCount} câu đến hạn
              </span>
              <span className="text-sm font-bold text-[#6545D8] flex items-center gap-1 shrink-0">
                5 phút <ChevronRight className="w-4 h-4" />
              </span>
            </button>

            {/* Việc 2: Bài tập lớp học */}
            {nextAssignment ? (
              <button
                type="button"
                onClick={() => onOpenAssignment(nextAssignment)}
                className="w-full min-h-15 px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#6545D8] flex items-center justify-between transition-all text-left"
              >
                <span className="text-sm sm:text-base font-black text-[#172033] dark:text-white">
                  {nextAssignment.title}
                </span>
                <span className="text-sm font-semibold text-gray-500 flex items-center gap-1 shrink-0">
                  {formatDueLabel(nextAssignment.endTime)} <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenMyClasses}
                className="w-full min-h-15 px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#6545D8] flex items-center justify-between transition-all text-left"
              >
                <span className="text-sm sm:text-base font-black text-[#172033] dark:text-white">
                  Bài lớp Sinh học
                </span>
                <span className="text-sm font-semibold text-gray-500 flex items-center gap-1 shrink-0">
                  Hạn mai <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Cột phải: Lớp của tôi */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#172033] dark:text-white">
              Lớp của tôi
            </h3>
            <button
              type="button"
              onClick={onJoinClassPrompt}
              className="text-xs font-bold text-[#6545D8] hover:underline flex items-center gap-0.5"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm lớp
            </button>
          </div>

          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {joinedRooms.length > 0 ? joinedRooms[0].name : 'Sinh học cơ bản'}
          </p>
          <p className="text-xs text-gray-500">
            {pendingAssignments.length > 0
              ? `${pendingAssignments.length} bài sắp đến hạn`
              : '1 bài sắp đến hạn'}
          </p>

          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenMyClasses}
              className="min-h-10 text-sm font-black text-[#6545D8] hover:underline flex items-center gap-1"
            >
              Mở lớp <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* HÀNG 3: TÀI LIỆU GẦN ĐÂY — CHUẨN HÌNH 1 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-[#172033] dark:text-white">
            Tài liệu gần đây
          </h3>
          <button
            type="button"
            onClick={onOpenUploadDocument}
            className="min-h-11 px-5 py-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#6545D8] text-xs sm:text-sm font-bold text-[#6545D8] transition-all"
          >
            Thêm tài liệu
          </button>
        </div>

        <div className="space-y-2.5">
          {documents.length > 0 ? (
            documents.slice(0, 3).map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => onOpenDocument(doc)}
                className="w-full min-h-15 px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#6545D8] flex items-center justify-between transition-all text-left"
              >
                <span className="text-sm sm:text-base font-black text-[#172033] dark:text-white truncate pr-4">
                  {doc.fileName}
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1 shrink-0">
                  Đang học · Mở tài liệu <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            ))
          ) : (
            <button
              type="button"
              onClick={onOpenSampleBiologyDoc}
              className="w-full min-h-15 px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#6545D8] flex items-center justify-between transition-all text-left"
            >
              <span className="text-sm sm:text-base font-black text-[#172033] dark:text-white">
                Quang hợp.pdf
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1 shrink-0">
                Đang học · Mở tài liệu <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
