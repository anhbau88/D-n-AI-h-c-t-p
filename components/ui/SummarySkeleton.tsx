// components/ui/SummarySkeleton.tsx
// Skeleton placeholder cho trạng thái loading khi AI đang tóm tắt tài liệu.
// Mô phỏng layout markdown output (tiêu đề + đoạn văn) để giảm CLS.

'use client';

import { Card } from '@/components/ui/card';

export default function SummarySkeleton() {
  return (
    <Card className="p-6 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm h-125 lg:h-160 xl:h-185 overflow-hidden">
      <div className="space-y-5 animate-pulse">
        {/* Tiêu đề chính */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />

        {/* Đoạn văn 1 */}
        <div className="space-y-2">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>

        {/* Tiêu đề phụ */}
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2" />

        {/* Đoạn văn 2 */}
        <div className="space-y-2">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-11/12" />
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>

        {/* Bullet points giả lập */}
        <div className="space-y-2 pl-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />
            <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />
            <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />
            <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
          </div>
        </div>

        {/* Tiêu đề phụ 2 */}
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/5 mt-2" />

        {/* Đoạn văn 3 */}
        <div className="space-y-2">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>

        {/* Thông báo trạng thái */}
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">AI đang tóm tắt tài liệu...</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
