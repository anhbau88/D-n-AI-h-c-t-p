// components/ClassDiagnosticPanel.tsx
'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ClassDiagnosticPanelProps {
  classCode: string;
  className: string;
  language: 'vi' | 'en';
}

export default function ClassDiagnosticPanel({
  classCode,
  className,
  language
}: ClassDiagnosticPanelProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string>('');

  const handleRunDiagnostic = async () => {
    if (!classCode) return;
    setLoading(true);
    try {
      const res = await fetch('/api/classes/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi chẩn đoán');
      setReport(data.report);
    } catch (err) {
      console.error('Lỗi chẩn đoán lớp học:', err);
      setReport(
        language === 'vi'
          ? '### ⚠️ Lỗi kết nối\n\nKhông thể tạo báo cáo chẩn đoán vào lúc này. Vui lòng kiểm tra kết nối mạng và thử lại.'
          : '### ⚠️ Connection Error\n\nFailed to generate diagnostic report. Please check your network and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-white/80 dark:bg-gray-900/80 border-0 shadow-lg backdrop-blur-sm space-y-6">
      
      {/* Header and trigger button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            {language === 'vi' ? 'Trợ lý AI chẩn đoán lớp học' : 'AI Class Diagnostic Advisor'}
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            {language === 'vi'
              ? `Chẩn đoán tự động các khái niệm học sinh đang làm sai nhiều nhất trong lớp ${className}.`
              : `Automatically diagnose concepts students struggle with in class ${className}.`}
          </p>
        </div>

        <Button
          onClick={handleRunDiagnostic}
          disabled={loading || !classCode}
          className="h-10 px-5 rounded-xl bg-gradient-to-r from-primary to-violet text-white font-bold text-xs shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading 
            ? (language === 'vi' ? 'Đang phân tích...' : 'Analyzing...') 
            : (report ? (language === 'vi' ? 'Cập nhật phân tích' : 'Refresh Report') : (language === 'vi' ? 'Phân tích điểm yếu AI' : 'Run AI Analysis'))
          }
        </Button>
      </div>

      {/* Report render panel */}
      {loading ? (
        /* Loading Skeleton */
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Sparkles className="w-5 h-5 text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {language === 'vi' ? 'AI đang tổng hợp và phân tích dữ liệu...' : 'AI is compiling class submissions...'}
            </h4>
            <p className="text-[10px] text-gray-400 font-semibold mt-1 max-w-xs">
              {language === 'vi'
                ? 'AI sẽ đọc điểm số trắc nghiệm, các lựa chọn sai của học sinh và đánh giá tự luận để tạo báo cáo ôn tập chi tiết.'
                : 'AI will parse quiz scores, wrong options and essay grading comments to write diagnostic report.'}
            </p>
          </div>
        </div>
      ) : report ? (
        /* Report Markdown Render */
        <div className="p-5 bg-gradient-to-br from-gray-50/50 to-indigo-50/10 dark:from-gray-950/20 dark:to-indigo-950/5 border border-gray-250 dark:border-gray-800 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <Sparkles className="w-20 h-20 text-primary" />
          </div>

          <div className="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed text-foreground font-semibold space-y-3 prose-headings:font-black prose-headings:tracking-tight prose-h1:text-sm prose-h2:text-xs prose-h3:text-xs prose-ul:list-disc prose-ul:pl-5">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      ) : (
        /* Guide Banner */
        <div className="p-4 bg-gray-50/80 dark:bg-gray-950/30 rounded-2xl border border-gray-200 dark:border-gray-800/80 flex items-start gap-3">
          <AlertCircle className="w-5.5 h-5.5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-foreground">{language === 'vi' ? 'Cách hoạt động' : 'How it works'}</h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-semibold leading-relaxed">
              {language === 'vi'
                ? 'Nhấn nút "Phân tích điểm yếu AI" ở trên. AI sẽ tự động duyệt qua toàn bộ lịch sử nộp bài của học sinh trong lớp học này, tìm ra các câu hỏi trắc nghiệm nhiều em trả lời sai và tổng hợp các điểm yếu tự luận, từ đó chỉ ra những lỗ hổng kiến thức chính kèm đề xuất bù đắp chi tiết cho bạn.'
                : 'Click "Run AI Analysis". AI will aggregate all submissions in this classroom, identify commonly failed questions and essay weaknesses, and draft a pedagogical review plan.'}
            </p>
          </div>
        </div>
      )}

    </Card>
  );
}
