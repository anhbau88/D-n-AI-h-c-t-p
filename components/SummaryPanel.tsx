// components/SummaryPanel.tsx
// Hiển thị kết quả tóm tắt bằng Markdown

'use client';

import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import SummarySkeleton from '@/components/ui/SummarySkeleton';

interface SummaryPanelProps {
  summary: string;
  isLoading: boolean;
}

export default function SummaryPanel({ summary, isLoading }: SummaryPanelProps) {
  // Trạng thái loading nhưng chưa có dữ liệu stream nào
  if (isLoading && !summary) {
    return <SummarySkeleton />;
  }

  // Trạng thái trống - chưa có kết quả
  if (!summary) {
    return (
      <Card className="p-6 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm h-125 lg:h-160 xl:h-185 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Chưa có tóm tắt</p>
        <p className="text-gray-400 text-sm mt-1">Bấm nút &quot;Tóm tắt tài liệu&quot; để AI phân tích</p>
      </Card>
    );
  }

  // Hiển thị kết quả tóm tắt
  return (
    <Card className="p-6 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm h-125 lg:h-160 xl:h-185 overflow-y-auto">
      <div className="prose prose-sm dark:prose-invert max-w-none
        prose-headings:text-gray-800 dark:prose-headings:text-gray-100
        prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h2:font-bold
        prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
        prose-li:text-gray-600 dark:prose-li:text-gray-300
        prose-strong:text-gray-800 dark:prose-strong:text-gray-100
        prose-ul:space-y-1
      ">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </Card>
  );
}
