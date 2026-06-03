// components/ui/QuizSkeleton.tsx
// Skeleton placeholder cho trạng thái loading khi AI đang tạo câu hỏi trắc nghiệm.
// Mô phỏng layout thật của QuizPanel để giảm CLS (Cumulative Layout Shift).

'use client';

import { Card } from '@/components/ui/card';

export default function QuizSkeleton() {
  return (
    <Card className="p-6 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="space-y-6 animate-pulse">
        {/* Mô phỏng badge header */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-44 bg-emerald-100 dark:bg-emerald-900/40 rounded-full" />
        </div>

        {/* Mô phỏng 3 câu hỏi */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 border border-gray-100 dark:border-gray-800 rounded-xl bg-white/50 dark:bg-gray-900/50"
          >
            {/* Số thứ tự + câu hỏi */}
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-8 h-8 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            </div>

            {/* 4 đáp án */}
            <div className="space-y-2.5 ml-11">
              {[1, 2, 3, 4].map((j) => (
                <div
                  key={j}
                  className="h-11 bg-gray-100 dark:bg-gray-800/60 rounded-xl w-full border border-gray-100 dark:border-gray-800"
                />
              ))}
            </div>
          </div>
        ))}

        {/* Thông báo trạng thái */}
        <div className="flex flex-col items-center pt-2 pb-4">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">AI đang phân tích tài liệu và soạn câu hỏi...</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
