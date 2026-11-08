// components/ClassKnowledgeHeatmap.tsx
// Phân hệ D: Bản đồ Ma trận Lỗ hổng Kiến thức Lớp học (Class Knowledge Heatmap)
// Trợ thủ đắc lực cho Giáo viên: Nhận diện tức thì chủ đề học sinh yếu kém và sinh đề ôn bù 1 chạm

'use client';

import React, { useState } from 'react';
import {
  Grid,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Download,
  Users,
  Search,
  BookOpen,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';

export interface StudentMastery {
  studentId: string;
  studentName: string;
  topicScores: Record<string, number>; // topicKey -> percentage (0-100)
}

export interface TopicItem {
  key: string;
  name: string;
  description?: string;
}

interface ClassKnowledgeHeatmapProps {
  classNameTitle: string;
  topics?: TopicItem[];
  studentsData?: StudentMastery[];
  onCreateRemedialQuiz?: (weakTopics: string[]) => void;
  onExportExcel?: () => void;
}

export default function ClassKnowledgeHeatmap({
  classNameTitle,
  topics: propTopics,
  studentsData: propStudents,
  onCreateRemedialQuiz,
  onExportExcel,
}: ClassKnowledgeHeatmapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Dữ liệu mẫu chuẩn sư phạm nếu chưa có dữ liệu backend truyền vào
  const defaultTopics: TopicItem[] = [
    { key: 't1', name: 'Định nghĩa & Lý thuyết Căn bản' },
    { key: 't2', name: 'Công thức & Biến đổi Đại số' },
    { key: 't3', name: 'Kỹ năng Phân tích Dữ liệu' },
    { key: 't4', name: 'Ứng dụng Thực tiễn & Suy luận' },
    { key: 't5', name: 'Câu hỏi Phân hóa Điểm 9-10' },
  ];

  const defaultStudents: StudentMastery[] = [
    { studentId: 's1', studentName: 'Nguyễn Văn An', topicScores: { t1: 95, t2: 88, t3: 90, t4: 82, t5: 65 } },
    { studentId: 's2', studentName: 'Trần Thị Bích', topicScores: { t1: 85, t2: 60, t3: 75, t4: 45, t5: 30 } },
    { studentId: 's3', studentName: 'Lê Hoàng Cường', topicScores: { t1: 90, t2: 92, t3: 88, t4: 90, t5: 85 } },
    { studentId: 's4', studentName: 'Phạm Minh Dũng', topicScores: { t1: 70, t2: 50, t3: 65, t4: 40, t5: 25 } },
    { studentId: 's5', studentName: 'Vũ Thị Hoa', topicScores: { t1: 92, t2: 85, t3: 95, t4: 88, t5: 70 } },
    { studentId: 's6', studentName: 'Đặng Quốc Huy', topicScores: { t1: 80, t2: 70, t3: 60, t4: 55, t5: 40 } },
    { studentId: 's7', studentName: 'Bùi Thanh Mai', topicScores: { t1: 98, t2: 95, t3: 92, t4: 90, t5: 90 } },
    { studentId: 's8', studentName: 'Hoàng Văn Nam', topicScores: { t1: 65, t2: 45, t3: 50, t4: 35, t5: 20 } },
  ];

  const topics = propTopics && propTopics.length > 0 ? propTopics : defaultTopics;
  const students = propStudents && propStudents.length > 0 ? propStudents : defaultStudents;

  // Lọc theo tìm kiếm
  const filteredStudents = students.filter((s) =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tính điểm trung bình của từng chủ đề
  const topicAverages: Record<string, number> = {};
  topics.forEach((t) => {
    const scores = students.map((s) => s.topicScores[t.key] ?? 70);
    const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
    topicAverages[t.key] = Math.round(avg);
  });

  // Tìm ra các chủ đề yếu nhất lớp (avg < 60)
  const weakTopics = topics.filter((t) => (topicAverages[t.key] ?? 0) < 60);

  const getHeatmapColor = (score: number) => {
    if (score >= 80) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    } else if (score >= 55) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    } else {
      return 'bg-rose-500/25 text-rose-300 border-rose-500/40 font-black animate-pulse';
    }
  };

  const handleCreateRemedial = async () => {
    setIsGeneratingQuiz(true);
    try {
      const topicNames = weakTopics.map((t) => t.name);
      if (onCreateRemedialQuiz) {
        onCreateRemedialQuiz(topicNames);
      }
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#11131a] border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
      {/* 1. Header Khối & Nút tạo đề phụ đạo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[#6545D8] dark:text-indigo-300 text-xs font-black mb-1.5">
            <Grid className="w-3.5 h-3.5" />
            <span>EduGenie Matrix Analytics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Bản Đồ Ma Trận Lỗ Hổng Kiến Thức — {classNameTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
            Phân tích tỷ lệ nắm vững từng chuyên đề theo màu nhiệt. Nhận diện học sinh cần phụ đạo.
          </p>
        </div>

        {/* Nút tạo đề phụ đạo 1 chạm */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCreateRemedial}
            disabled={isGeneratingQuiz}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6545D8] to-[#EC4899] hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-md shadow-indigo-500/25 flex items-center gap-2 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isGeneratingQuiz ? 'Đang Tạo Đề...' : 'Tạo Đề Ôn Bù Lấp Lỗ Hổng (AI)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Thống kê nhanh cảnh báo lỗ hổng */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">
            Mức Nắm Vững Trung Bình Cả Lớp
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {Math.round(Object.values(topicAverages).reduce((a, b) => a + b, 0) / (topics.length || 1))}%
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              Chuẩn đầu ra
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold block">
            Chuyên Đề Cần Ôn Phụ Đạo
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {weakTopics.length} chuyên đề
            </span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
              (Dưới 60% làm đúng)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
          <span className="text-[11px] text-rose-700 dark:text-rose-400 font-bold block">
            Học Sinh Cần Giáo Viên Kèm Thêm
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {students.filter((s) => Object.values(s.topicScores).some((sc) => sc < 50)).length} em
            </span>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
              Có ít nhất 1 lỗ hổng nặng
            </span>
          </div>
        </div>
      </div>

      {/* 3. Thanh tìm kiếm & Chú thích màu nhiệt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm học sinh theo tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500/40 border border-emerald-500/60" />
            <span className="text-slate-600 dark:text-slate-300">Đã vững (≥ 80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500/40 border border-amber-500/60" />
            <span className="text-slate-600 dark:text-slate-300">Nguy cơ (55-79%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500/50 border border-rose-500/70" />
            <span className="text-slate-600 dark:text-slate-300">Hổng kiến thức (&lt; 55%)</span>
          </div>
        </div>
      </div>

      {/* 4. BẢNG MA TRẬN NHIỆT (HEATMAP GRID) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-black">
              <th className="p-3.5 w-12 text-center">STT</th>
              <th className="p-3.5 min-w-[180px]">Họ Và Tên Học Sinh</th>
              {topics.map((t) => (
                <th key={t.key} className="p-3.5 text-center min-w-[120px]">
                  <span className="block leading-tight">{t.name}</span>
                  <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                    Lớp TB: {topicAverages[t.key]}%
                  </span>
                </th>
              ))}
              <th className="p-3.5 text-center min-w-[100px]">Tổng Quan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
            {filteredStudents.map((st, idx) => {
              const scores = Object.values(st.topicScores);
              const avg = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));

              return (
                <tr key={st.studentId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-3.5 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-3.5 font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black text-[10px] flex items-center justify-center">
                      {st.studentName.charAt(0)}
                    </div>
                    <span>{st.studentName}</span>
                  </td>

                  {topics.map((t) => {
                    const score = st.topicScores[t.key] ?? 70;
                    return (
                      <td key={t.key} className="p-2.5 text-center">
                        <div
                          className={`py-1.5 px-2 rounded-xl border font-mono font-black text-xs ${getHeatmapColor(
                            score
                          )}`}
                        >
                          {score}%
                        </div>
                      </td>
                    );
                  })}

                  <td className="p-3 text-center">
                    <span
                      className={`font-black text-xs px-2.5 py-1 rounded-full ${
                        avg >= 80
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : avg >= 60
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {avg}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
