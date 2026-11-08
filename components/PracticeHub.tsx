'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SavedDocument, User } from '@/types';
import {
  EnglishLearningProgress,
  ErrorNotebookEntry,
  getDueReviewQuestions,
} from '@/lib/english-curriculum';
import {
  CalendarCheck,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  FileText,
  Sparkles,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface PracticeHubProps {
  user: User;
  englishProgress: EnglishLearningProgress;
  onUpdateEnglishProgress: (next: EnglishLearningProgress) => void;
  documents: SavedDocument[];
  onStartSmartReview: () => void;
  onOpenDocumentPractice: (doc: SavedDocument) => void;
  onOpenSampleDocPractice: () => void;
  generalChatElement: React.ReactNode;
}

export default function PracticeHub({
  englishProgress,
  onUpdateEnglishProgress,
  documents,
  onStartSmartReview,
  onOpenDocumentPractice,
  onOpenSampleDocPractice,
  generalChatElement,
}: PracticeHubProps) {
  const [activeTab, setActiveTab] = useState<'due_and_errors' | 'doc_sets' | 'general_tutor'>('due_and_errors');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');

  // Trạng thái "Gia sư hướng dẫn sửa lỗi: thử sửa trước khi mở lời giải đầy đủ" (Mục 9)
  const [repairingEntryId, setRepairingEntryId] = useState<string | null>(null);
  const [repairInput, setRepairInput] = useState<string>('');
  const [repairSubmitted, setRepairSubmitted] = useState<boolean>(false);
  const [repairCorrect, setRepairCorrect] = useState<boolean>(false);

  // Thêm câu sai từ tài liệu môn học vào Sổ lỗi dùng chung
  const [showAddErrorForm, setShowAddErrorForm] = useState(false);
  const [customErrSubject, setCustomErrSubject] = useState('Sinh học · Quang hợp.pdf');
  const [customErrSkill, setCustomErrSkill] = useState('Vai trò của lục lạp');
  const [customErrQuestion, setCustomErrQuestion] = useState('');
  const [customErrCorrect, setCustomErrCorrect] = useState('');
  const [customErrNote, setCustomErrNote] = useState('');

  const dueQuestions = getDueReviewQuestions(englishProgress);
  const dueCount = Math.max(dueQuestions.length, englishProgress.errorNotebook.length > 0 ? 5 : 0);

  const errorEntries = englishProgress.errorNotebook || [];
  const allSkillTags = Array.from(new Set(errorEntries.map(e => e.skillTag)));
  const filteredErrors =
    selectedSkillFilter === 'ALL'
      ? errorEntries
      : errorEntries.filter(e => e.skillTag === selectedSkillFilter);

  const handleStartRepair = (entry: ErrorNotebookEntry) => {
    setRepairingEntryId(entry.id);
    setRepairInput('');
    setRepairSubmitted(false);
    setRepairCorrect(false);
  };

  const handleSubmitRepair = (entry: ErrorNotebookEntry) => {
    if (!repairInput.trim()) return;
    const isOk =
      repairInput.trim().toLowerCase().replace(/[.,!?]+$/g, '') ===
      entry.correctAnswer.trim().toLowerCase().replace(/[.,!?]+$/g, '');
    setRepairCorrect(isOk);
    setRepairSubmitted(true);

    if (isOk) {
      const updatedList = englishProgress.errorNotebook.map(item =>
        item.id === entry.id
          ? {
              ...item,
              resolvedCount: (item.resolvedCount || 0) + 1,
              nextReviewAt: new Date(Date.now() + 3 * 86400 * 1000).toISOString(),
            }
          : item
      );
      onUpdateEnglishProgress({
        ...englishProgress,
        errorNotebook: updatedList,
      });
    }
  };

  const handleAddDocumentError = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customErrQuestion.trim() || !customErrCorrect.trim()) return;
    const newEntry: ErrorNotebookEntry = {
      id: `err-doc-${Date.now()}`,
      sourceType: 'document',
      sourceTitle: customErrSubject.trim() || 'Tài liệu môn học',
      sourcePageOrRef: 'Nguồn tài liệu cá nhân',
      skillTag: customErrSkill.trim() || 'Kiến thức trọng tâm',
      questionText: customErrQuestion.trim(),
      userWrongAnswer: 'Chưa nhớ rõ',
      correctAnswer: customErrCorrect.trim(),
      explanationVi: customErrNote.trim() || 'Đối chiếu lại đoạn trích trong tài liệu gốc.',
      wrongCount: 1,
      resolvedCount: 0,
      lastWrongAt: new Date().toISOString(),
      nextReviewAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    };
    onUpdateEnglishProgress({
      ...englishProgress,
      errorNotebook: [newEntry, ...englishProgress.errorNotebook],
    });
    setCustomErrQuestion('');
    setCustomErrCorrect('');
    setCustomErrNote('');
    setShowAddErrorForm(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header khu Luyện tập */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-[#172033] dark:text-white tracking-tight">
          Luyện tập
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          Ôn các câu đến hạn theo lịch 1–3–7–14–30 ngày, sửa lỗi trong Sổ lỗi dùng chung và luyện bộ đề từ tài liệu.
        </p>
      </div>

      {/* Khối ưu tiên: Phiên ôn đến hạn hôm nay */}
      <div className="p-6 rounded-3xl bg-[#EEEAFE] dark:bg-indigo-950/50 border border-[#6545D8]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wider text-[#6545D8] dark:text-indigo-300 flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4" />
            PHIÊN ÔN NGẮT QUÃNG HÔM NAY
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#172033] dark:text-white">
            Bạn có {dueCount} câu đến hạn cần ôn
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            Phiên ôn 10 câu kết hợp: 5 câu đến hạn + 3 câu từ mẫu lỗi hay sai + 2 câu mới.
          </p>
        </div>

        <Button
          type="button"
          onClick={onStartSmartReview}
          className="min-h-12 px-6 rounded-2xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-sm shrink-0"
        >
          Bắt đầu phiên ôn · 5 phút
        </Button>
      </div>

      {/* Thanh chuyển 3 nhóm trong Luyện tập */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('due_and_errors')}
          className={`min-h-11 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'due_and_errors'
              ? 'bg-[#6545D8] text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Sổ lỗi dùng chung các môn ({errorEntries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('doc_sets')}
          className={`min-h-11 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'doc_sets'
              ? 'bg-[#6545D8] text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Bộ đề & Tự luận theo tài liệu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('general_tutor')}
          className={`min-h-11 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'general_tutor'
              ? 'bg-[#6545D8] text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Hỏi AI (Kiến thức chung)</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: SỔ LỖI DÙNG CHUNG CÁC MÔN (ERROR NOTEBOOK - MỤC 9 & 10) */}
      {/* =================================================================== */}
      {activeTab === 'due_and_errors' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSkillFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  selectedSkillFilter === 'ALL'
                    ? 'bg-[#172033] text-white dark:bg-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                Tất cả mẫu lỗi ({errorEntries.length})
              </button>
              {allSkillTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedSkillFilter(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    selectedSkillFilter === tag
                      ? 'bg-[#6545D8] text-white'
                      : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddErrorForm(!showAddErrorForm)}
              className="min-h-10 px-3.5 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-[#6545D8] flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Ghi thêm câu hay sai từ môn học
            </button>
          </div>

          {showAddErrorForm && (
            <form
              onSubmit={handleAddDocumentError}
              className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3"
            >
              <h4 className="text-sm font-black text-[#172033] dark:text-white">
                Thêm mục cần nhớ vào Sổ lỗi dùng chung
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  value={customErrSubject}
                  onChange={(e) => setCustomErrSubject(e.target.value)}
                  placeholder="Tên tài liệu / Môn học (VD: Quang hợp.pdf · Trang 12)"
                  className="h-10 text-xs rounded-xl"
                />
                <Input
                  value={customErrSkill}
                  onChange={(e) => setCustomErrSkill(e.target.value)}
                  placeholder="Mẫu lỗi / Chủ đề (VD: Vai trò của lục lạp)"
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <Input
                value={customErrQuestion}
                onChange={(e) => setCustomErrQuestion(e.target.value)}
                placeholder="Câu hỏi hoặc chỗ bạn từng nhầm lẫn..."
                className="h-10 text-xs rounded-xl"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  value={customErrCorrect}
                  onChange={(e) => setCustomErrCorrect(e.target.value)}
                  placeholder="Đáp án đúng cần nhớ..."
                  className="h-10 text-xs rounded-xl"
                />
                <Input
                  value={customErrNote}
                  onChange={(e) => setCustomErrNote(e.target.value)}
                  placeholder="Ghi chú giải thích hoặc trang trích dẫn..."
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddErrorForm(false)}
                  className="h-10 rounded-xl text-xs font-bold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="h-10 rounded-xl bg-[#6545D8] text-white text-xs font-bold"
                >
                  Lưu vào Sổ lỗi
                </Button>
              </div>
            </form>
          )}

          {/* Danh sách các mục trong Sổ lỗi */}
          <div className="space-y-3">
            {filteredErrors.map((entry) => {
              const isRepairing = repairingEntryId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#F3F0FF] text-[#6545D8] border-0 font-bold text-xs">
                        Mẫu lỗi: {entry.skillTag}
                      </Badge>
                      <span className="text-xs text-gray-500 font-medium">
                        Nguồn: {entry.sourceTitle}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      Sai {entry.wrongCount} lần · Đã sửa đúng {entry.resolvedCount || 0} lần
                    </span>
                  </div>

                  <p className="text-base font-black text-[#172033] dark:text-white">
                    {entry.questionText}
                  </p>

                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    Lần trước bạn chọn: &ldquo;{entry.userWrongAnswer}&rdquo;
                  </p>

                  {!isRepairing ? (
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleStartRepair(entry)}
                        className="min-h-10 px-4 py-2 rounded-xl bg-[#F3F0FF] dark:bg-indigo-950/60 text-[#6545D8] font-bold text-xs hover:brightness-95"
                      >
                        Thử tự sửa lỗi trước khi xem đáp án &gt;
                      </button>
                      {entry.resolvedCount >= 2 && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Đang tiến bộ
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Chế độ Gia sư có căn cứ: Gợi ý nguyên tắc -> Yêu cầu học sinh tự sửa -> Mở lời giải đầy đủ */
                    <div className="p-4 rounded-2xl bg-[#F5F6FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-3">
                      <p className="text-xs font-bold text-[#6545D8]">
                        Gợi ý từ Gia sư: Hãy nhớ lại quy tắc của &ldquo;{entry.skillTag}&rdquo; và thử chọn/nhập lại câu trả lời đúng:
                      </p>

                      {entry.options && entry.options.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {entry.options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              disabled={repairSubmitted}
                              onClick={() => setRepairInput(opt)}
                              className={`min-h-10 px-4 py-2 rounded-xl border text-xs font-bold ${
                                repairInput === opt
                                  ? 'border-[#6545D8] bg-[#F3F0FF] text-[#6545D8]'
                                  : 'border-gray-300 bg-white dark:bg-gray-900 text-foreground'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <Input
                          value={repairInput}
                          disabled={repairSubmitted}
                          onChange={(e) => setRepairInput(e.target.value)}
                          placeholder="Nhập câu sửa lại của bạn..."
                          className="h-10 text-xs rounded-xl bg-white dark:bg-gray-900"
                        />
                      )}

                      {!repairSubmitted ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            disabled={!repairInput.trim()}
                            onClick={() => handleSubmitRepair(entry)}
                            className="h-10 px-4 rounded-xl bg-[#6545D8] text-white text-xs font-bold"
                          >
                            Kiểm tra phần tự sửa
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRepairingEntryId(null)}
                            className="h-10 rounded-xl text-xs font-bold"
                          >
                            Đóng
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1 border-t border-gray-200 dark:border-gray-700">
                          <p
                            className={`text-xs font-black ${
                              repairCorrect ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {repairCorrect
                              ? '✓ Bạn đã tự sửa đúng! Lịch ôn của mục này đã được đẩy sang 3 ngày tới.'
                              : `Đáp án chuẩn là: "${entry.correctAnswer}"`}
                          </p>
                          <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
                            <strong>Lời giải đầy đủ:</strong> {entry.explanationVi}
                          </p>
                          <p className="text-[11px] font-bold text-[#6545D8]">
                            Căn cứ: {entry.sourceTitle} ({entry.sourcePageOrRef})
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: BỘ ĐỀ TRẮC NGHIỆM, FLASHCARD & TỰ LUẬN THEO TÀI LIỆU */}
      {/* =================================================================== */}
      {activeTab === 'doc_sets' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
            <h3 className="text-base font-black text-[#172033] dark:text-white">
              Chọn tài liệu để làm Trắc nghiệm 10 câu, Flashcard hoặc Tự luận chấm điểm
            </h3>
            <p className="text-xs text-gray-500">
              Mọi bộ đề, thẻ ghi nhớ và bài chấm tự luận đều gắn trực tiếp với tài liệu gốc để đối chiếu trang trích dẫn.
            </p>

            <div className="space-y-2.5 pt-2">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => onOpenDocumentPractice(doc)}
                    className="w-full min-h-14 px-4 py-3.5 rounded-2xl bg-[#F5F6FA] dark:bg-gray-800 hover:border-[#6545D8] border border-gray-200 dark:border-gray-700 flex items-center justify-between text-left transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-[#6545D8] shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-black text-[#172033] dark:text-white truncate">
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.pages || 1} trang · Có sẵn Trắc nghiệm, Flashcard & Tự luận OCR
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#6545D8] flex items-center gap-1 shrink-0 ml-2">
                      Luyện tập <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={onOpenSampleDocPractice}
                  className="w-full min-h-14 px-4 py-3.5 rounded-2xl bg-[#F5F6FA] dark:bg-gray-800 hover:border-[#6545D8] border border-gray-200 dark:border-gray-700 flex items-center justify-between text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#6545D8] shrink-0" />
                    <div>
                      <p className="text-sm font-black text-[#172033] dark:text-white">
                        Quang hợp.pdf (Tài liệu mẫu)
                      </p>
                      <p className="text-xs text-gray-500">
                        Trang 12 · Luyện ngay 10 câu hỏi kiểm tra hiểu bài
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#6545D8] flex items-center gap-1 shrink-0 ml-2">
                    Mở bài luyện <ChevronRight className="w-4 h-4" />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: HỎI AI GIA SƯ CHUNG (CÓ NHÃN NGUỒN RÕ RÀNG) */}
      {/* =================================================================== */}
      {activeTab === 'general_tutor' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#6545D8]" />
              Chế độ: Hỏi AI kiến thức chung (Không giới hạn trong một tệp PDF).
            </span>
            <span className="text-[11px] font-medium">
              Để hỏi bám sát từng trang tài liệu có trích dẫn nguồn, hãy mở mục <strong>Tài liệu &rarr; Hỏi AI</strong>.
            </span>
          </div>
          {generalChatElement}
        </div>
      )}
    </div>
  );
}
