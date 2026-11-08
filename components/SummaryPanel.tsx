// components/SummaryPanel.tsx
// Trung tâm Học Tập Đa Phương Tiện AI (Tóm tắt thông minh + Sơ đồ tư duy Mindmap + Podcast Bài Giảng Audio TTS + Giáo án 5512)

'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SummarySkeleton from '@/components/ui/SummarySkeleton';
import { MindmapNode, PodcastTurn, AIModelTier } from '@/types';
import {
  FileText,
  Network,
  Headphones,
  GraduationCap,
  Play,
  Square,
  RefreshCw,
  Printer,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Volume2,
  FileDown,
  Presentation,
} from 'lucide-react';
import { exportMarkdownDocumentToWord } from '@/lib/word-export';
import { generateLecturePptx } from '@/lib/pptx-generator';

interface SummaryPanelProps {
  summary: string;
  isLoading: boolean;
  pdfText?: string;
  fileName?: string;
  userRole?: 'student' | 'teacher' | 'admin';
  modelTier?: AIModelTier;
  cachedMindmap?: MindmapNode;
  cachedPodcast?: PodcastTurn[];
  cachedLessonPlan?: string;
  onUpdateDocumentExtras?: (extras: {
    mindmap?: MindmapNode;
    podcast?: PodcastTurn[];
    lessonPlan?: string;
  }) => void;
  onRequireUpgrade?: (reason: string) => void;
}

function MindmapTreeNode({ node, depth = 0 }: { node: MindmapNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;

  const colors = [
    'from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20',
    'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
    'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200',
    'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200',
  ];
  const colorStyle = colors[Math.min(depth, colors.length - 1)];

  return (
    <div className={`${depth > 0 ? 'ml-5 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800/60 mt-3' : 'mt-2'}`}>
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`p-3.5 rounded-2xl border transition-all ${
          depth === 0 ? `bg-linear-to-r ${colorStyle} border-transparent` : colorStyle
        } ${hasChildren ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`font-bold ${depth === 0 ? 'text-base' : 'text-xs'}`}>{node.label}</p>
            {node.summary && (
              <p className={`mt-1 leading-relaxed ${depth === 0 ? 'text-indigo-100 text-xs' : 'text-gray-600 dark:text-gray-400 text-[11px]'}`}>
                {node.summary}
              </p>
            )}
          </div>
          {hasChildren && (
            <span className="shrink-0 p-1 rounded-lg bg-black/5 dark:bg-white/10">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="space-y-2">
          {node.children!.map((child, idx) => (
            <MindmapTreeNode key={child.id || `${depth}-${idx}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SummaryPanel({
  summary,
  isLoading,
  pdfText = '',
  fileName = 'Bài giảng',
  userRole = 'student',
  modelTier = 'flash',
  cachedMindmap,
  cachedPodcast,
  cachedLessonPlan,
  onUpdateDocumentExtras,
  onRequireUpgrade,
}: SummaryPanelProps) {
  const [subTab, setSubTab] = useState<'summary' | 'mindmap' | 'podcast' | 'lesson_plan'>('summary');
  const [mindmap, setMindmap] = useState<MindmapNode | null>(cachedMindmap || null);
  const [podcast, setPodcast] = useState<PodcastTurn[]>(cachedPodcast || []);
  const [lessonPlan, setLessonPlan] = useState<string>(cachedLessonPlan || '');
  const [loadingExtra, setLoadingExtra] = useState<string | null>(null);
  const [extraError, setExtraError] = useState('');

  // Audio Podcast Player States (Web Speech API)
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(-1);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const isPlayingRef = useRef(false);

  const handleExportPptx = async () => {
    setIsExportingPptx(true);
    try {
      const sourceText = lessonPlan || summary;
      const lines = sourceText.split('\n').filter((l) => l.trim().length > 0);
      const sections: Array<{ heading: string; points: string[]; note?: string }> = [];
      let currentHeading = 'Nội dung cốt lõi bài giảng';
      let currentPoints: string[] = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (
          trimmed.startsWith('#') ||
          (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 70)
        ) {
          if (currentPoints.length > 0) {
            sections.push({ heading: currentHeading, points: currentPoints.slice(0, 4) });
            currentPoints = [];
          }
          currentHeading = trimmed.replace(/^[#*\s]+|[#*\s]+$/g, '');
        } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
          currentPoints.push(trimmed.replace(/^[-*\d.]+\s*/, ''));
        }
      });

      if (currentPoints.length > 0) {
        sections.push({ heading: currentHeading, points: currentPoints.slice(0, 4) });
      }

      await generateLecturePptx({
        title: fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Bài Giảng Điện Tử EduGenie',
        subject: 'Bài Giảng Chuẩn',
        teacherName: 'Giáo Viên',
        sections: sections.length > 0 ? sections.slice(0, 6) : [],
      });
    } catch (err) {
      console.error('Lỗi xuất PowerPoint:', err);
    } finally {
      setIsExportingPptx(false);
    }
  };

  useEffect(() => {
    setMindmap(cachedMindmap || null);
    setPodcast(cachedPodcast || []);
    setLessonPlan(cachedLessonPlan || '');
  }, [cachedMindmap, cachedPodcast, cachedLessonPlan]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isPlayingRef.current = false;
    };
  }, []);

  const handleGenerateExtra = async (mode: 'mindmap' | 'podcast' | 'lesson_plan') => {
    if (!pdfText) {
      setExtraError('Vui lòng tải lên hoặc chọn một tài liệu trước.');
      return;
    }
    setLoadingExtra(mode);
    setExtraError('');

    try {
      const res = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfText,
          fileName,
          mode,
          modelTier,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.upgradeRequired && onRequireUpgrade) {
          onRequireUpgrade(data.error);
          return;
        }
        throw new Error(data.error || 'Không thể tạo nội dung.');
      }

      if (mode === 'mindmap' && data.mindmap) {
        setMindmap(data.mindmap);
        onUpdateDocumentExtras?.({ mindmap: data.mindmap });
      } else if (mode === 'podcast' && data.podcast) {
        setPodcast(data.podcast);
        onUpdateDocumentExtras?.({ podcast: data.podcast });
      } else if (mode === 'lesson_plan' && data.lessonPlan) {
        setLessonPlan(data.lessonPlan);
        onUpdateDocumentExtras?.({ lessonPlan: data.lessonPlan });
      }
    } catch (err) {
      setExtraError(err instanceof Error ? err.message : 'Lỗi kết nối AI');
    } finally {
      setLoadingExtra(null);
    }
  };

  const playPodcastTurn = (index: number, turns: PodcastTurn[], rate: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ phát giọng nói trực tiếp.');
      return;
    }
    if (!isPlayingRef.current || index >= turns.length) {
      setIsPlayingPodcast(false);
      setCurrentTurnIdx(-1);
      isPlayingRef.current = false;
      return;
    }

    setCurrentTurnIdx(index);
    const turn = turns[index];
    const utterance = new SpeechSynthesisUtterance(turn.text);
    utterance.lang = 'vi-VN';
    utterance.rate = rate;
    // Phân biệt tông giọng giữa Thầy Minh và Bạn Lan
    utterance.pitch = turn.speaker === 'teacher' ? 0.92 : 1.15;

    utterance.onend = () => {
      if (isPlayingRef.current) {
        playPodcastTurn(index + 1, turns, rate);
      }
    };
    utterance.onerror = () => {
      setIsPlayingPodcast(false);
      isPlayingRef.current = false;
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleStartPodcastAudio = () => {
    if (podcast.length === 0) return;
    isPlayingRef.current = true;
    setIsPlayingPodcast(true);
    const startIdx = currentTurnIdx >= 0 && currentTurnIdx < podcast.length ? currentTurnIdx : 0;
    playPodcastTurn(startIdx, podcast, playbackRate);
  };

  const handleStopPodcastAudio = () => {
    isPlayingRef.current = false;
    setIsPlayingPodcast(false);
    setCurrentTurnIdx(-1);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handlePrintLessonPlan = () => {
    window.print();
  };

  const isTeacher = userRole === 'teacher' || userRole === 'admin';

  return (
    <Card className="p-5 border-0 shadow-lg bg-white/85 dark:bg-gray-900/85 backdrop-blur-sm h-125 lg:h-160 xl:h-185 flex flex-col overflow-hidden">
      {/* Thanh chuyển đổi 4 công cụ AI (Summary / Mindmap / Podcast / Giáo án 5512) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/80 dark:bg-gray-800/60 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSubTab('summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'summary'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Tóm tắt trọng tâm
          </button>

          <button
            type="button"
            onClick={() => setSubTab('mindmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'mindmap'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Sơ đồ tư duy AI
          </button>

          <button
            type="button"
            onClick={() => setSubTab('podcast')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'podcast'
                ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            Podcast Bài Giảng
            <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-300 border-0 text-[9px] px-1.5 py-0">
              HOT
            </Badge>
          </button>

          {isTeacher && (
            <button
              type="button"
              onClick={() => setSubTab('lesson_plan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                subTab === 'lesson_plan'
                  ? 'bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Giáo án 5512
            </button>
          )}
        </div>
      </div>

      {extraError && (
        <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-semibold">
          ⚠️ {extraError}
        </div>
      )}

      {/* Nội dung từng chế độ */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* 1. TAB TÓM TẮT */}
        {subTab === 'summary' && (
          <>
            {isLoading && !summary ? (
              <SummarySkeleton />
            ) : !summary ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-bold">Chưa có bản tóm tắt</p>
                <p className="text-gray-400 text-xs mt-1 max-w-xs">
                  Bấm nút &quot;Tóm tắt tự động&quot; để AI chắt lọc toàn bộ luận điểm và công thức quan trọng.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportPptx}
                    disabled={isExportingPptx}
                    className="rounded-xl text-xs h-8 px-3 border-purple-200 text-purple-600 dark:border-purple-800 dark:text-purple-400 font-bold gap-1 shadow-xs hover:bg-purple-50 dark:hover:bg-purple-950/40"
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    {isExportingPptx ? 'Đang xuất...' : 'Xuất Slide (.pptx)'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      exportMarkdownDocumentToWord(summary, {
                        docType: 'summary',
                        fileName: fileName || 'Tom_Tat_Bai_Giang',
                      })
                    }
                    className="rounded-xl text-xs h-8 px-3 border-indigo-200 text-indigo-600 dark:border-indigo-800 dark:text-indigo-400 font-bold gap-1"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Tải Tóm tắt Word (.doc)
                  </Button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-800 dark:prose-headings:text-gray-100 prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2 prose-h2:font-bold prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-li:text-gray-600 dark:prose-li:text-gray-300">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </div>
            )}
          </>
        )}

        {/* 2. TAB SƠ ĐỒ TƯ DUY (AI MINDMAP) */}
        {subTab === 'mindmap' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40">
              <div>
                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Network className="w-4 h-4" /> Sơ đồ tư duy phân nhánh tự động (Mindmap)
                </h4>
                <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/80 mt-0.5">
                  Giúp nắm bắt cấu trúc toàn bài học trong 30 giây. Bấm vào từng nhánh để đóng/mở chi tiết.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleGenerateExtra('mindmap')}
                disabled={loadingExtra === 'mindmap'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-4 font-bold shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingExtra === 'mindmap' ? 'animate-spin' : ''}`} />
                {mindmap ? 'Vẽ lại Sơ đồ' : 'Tạo Sơ đồ tư duy'}
              </Button>
            </div>

            {loadingExtra === 'mindmap' ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-gray-500">AI đang phân tích cấu trúc và vẽ Sơ đồ tư duy...</p>
              </div>
            ) : mindmap ? (
              <div className="pb-6">
                <MindmapTreeNode node={mindmap} depth={0} />
              </div>
            ) : (
              <div className="py-16 text-center text-gray-400 text-xs">
                Nhấn nút <strong>&quot;Tạo Sơ đồ tư duy&quot;</strong> ở góc trên để AI vẽ cây kiến thức của tài liệu này.
              </div>
            )}
          </div>
        )}

        {/* 3. TAB PODCAST BÀI GIẢNG (NOTEBOOKLM AUDIO OVERVIEW) */}
        {subTab === 'podcast' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-linear-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 p-4 rounded-2xl border border-purple-200/60 dark:border-purple-800/40">
              <div>
                <h4 className="text-xs font-black text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4" /> AI Audio Podcast: Thầy Minh & Bạn Lan thảo luận bài học
                </h4>
                <p className="text-[11px] text-purple-600/90 dark:text-purple-400/80 mt-0.5">
                  Biến tài liệu dài thành cuộc trò chuyện thú vị. Bấm Nghe Podcast để học mọi lúc mọi nơi!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {podcast.length > 0 && (
                  <>
                    <select
                      value={playbackRate}
                      onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                      className="h-9 px-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 text-xs font-bold"
                      title="Tốc độ đọc"
                    >
                      <option value={0.9}>0.9x</option>
                      <option value={1.0}>1.0x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                    </select>

                    {!isPlayingPodcast ? (
                      <Button
                        size="sm"
                        onClick={handleStartPodcastAudio}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs h-9 px-4 font-bold gap-1.5 shadow-md shadow-purple-500/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Nghe Podcast
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleStopPodcastAudio}
                        className="rounded-xl text-xs h-9 px-4 font-bold gap-1.5"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" /> Dừng phát
                      </Button>
                    )}
                  </>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateExtra('podcast')}
                  disabled={loadingExtra === 'podcast'}
                  className="rounded-xl text-xs h-9 px-3.5 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold"
                >
                  <Sparkles className={`w-3.5 h-3.5 mr-1 ${loadingExtra === 'podcast' ? 'animate-spin' : ''}`} />
                  {podcast.length > 0 ? 'Soạn lại' : 'Tạo Podcast AI'}
                </Button>
              </div>
            </div>

            {loadingExtra === 'podcast' ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-gray-500">AI đang biên kịch hội thoại Podcast giữa Thầy Minh và Bạn Lan...</p>
              </div>
            ) : podcast.length > 0 ? (
              <div className="space-y-3 pb-6">
                {podcast.map((turn, idx) => {
                  const isTeacherSpeaker = turn.speaker === 'teacher';
                  const isSpeakingNow = currentTurnIdx === idx && isPlayingPodcast;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        isPlayingRef.current = true;
                        setIsPlayingPodcast(true);
                        playPodcastTurn(idx, podcast, playbackRate);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSpeakingNow
                          ? 'ring-2 ring-purple-500 bg-purple-50/90 dark:bg-purple-950/50 border-purple-400 shadow-md'
                          : isTeacherSpeaker
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-50'
                          : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-black flex items-center gap-1.5 ${
                          isTeacherSpeaker ? 'text-indigo-700 dark:text-indigo-300' : 'text-emerald-700 dark:text-emerald-300'
                        }`}>
                          <span>{isTeacherSpeaker ? '👨‍🏫' : '👩‍🎓'}</span>
                          {turn.speakerName || (isTeacherSpeaker ? 'Thầy Minh' : 'Bạn Lan')}
                        </span>
                        {isSpeakingNow && (
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 animate-pulse">
                            <Volume2 className="w-3.5 h-3.5" /> Đang đọc...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">{turn.text}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-gray-400 text-xs">
                Nhấn nút <strong>&quot;Tạo Podcast AI&quot;</strong> để chuyển bài giảng thành cuộc đối thoại âm thanh sống động!
              </div>
            )}
          </div>
        )}

        {/* 4. TAB GIÁO ÁN CÔNG VĂN 5512 (DÀNH CHO GIÁO VIÊN) */}
        {subTab === 'lesson_plan' && isTeacher && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/80 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200/70 dark:border-amber-800/40">
              <div>
                <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" /> Kế hoạch bài dạy chuẩn Công văn 5512 Bộ GD&ĐT
                </h4>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  Tự động thiết kế Mục tiêu, Thiết bị dạy học và 4 Hoạt động (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng).
                </p>
              </div>
              <div className="flex items-center gap-2">
                {lessonPlan && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportPptx}
                      disabled={isExportingPptx}
                      className="rounded-xl text-xs h-9 px-3 border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold gap-1"
                    >
                      <Presentation className="w-3.5 h-3.5" />
                      {isExportingPptx ? 'Đang xuất Slide...' : 'Xuất Slide PPTX (.pptx)'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        exportMarkdownDocumentToWord(lessonPlan, {
                          docType: 'lesson_plan_5512',
                          fileName: fileName || 'Giao_An_5512',
                        })
                      }
                      className="rounded-xl text-xs h-9 px-3 border-indigo-300 text-indigo-700 font-bold gap-1"
                    >
                      <FileDown className="w-3.5 h-3.5" /> Tải Giáo Án Word (.doc)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePrintLessonPlan}
                      className="rounded-xl text-xs h-9 px-3 border-amber-300 text-amber-700 font-bold gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> In Giáo Án
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  onClick={() => handleGenerateExtra('lesson_plan')}
                  disabled={loadingExtra === 'lesson_plan'}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs h-9 px-4 font-bold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingExtra === 'lesson_plan' ? 'animate-spin' : ''}`} />
                  {lessonPlan ? 'Soạn lại Giáo án' : 'Soạn Giáo án 5512'}
                </Button>
              </div>
            </div>

            {loadingExtra === 'lesson_plan' ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-gray-500">AI đang biên soạn Kế hoạch bài dạy chuẩn Công văn 5512...</p>
              </div>
            ) : lessonPlan ? (
              <div className="prose prose-sm dark:prose-invert max-w-none pb-6">
                <ReactMarkdown>{lessonPlan}</ReactMarkdown>
              </div>
            ) : (
              <div className="py-16 text-center text-gray-400 text-xs">
                Nhấn nút <strong>&quot;Soạn Giáo án 5512&quot;</strong> để AI lập kế hoạch giảng dạy tiết học hoàn chỉnh.
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
