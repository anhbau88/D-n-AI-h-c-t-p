// components/EssayPanel.tsx
// Giao diện hiển thị đề thi tự luận dành cho Giáo viên (giao đề) và Học sinh (làm đề, xem điểm & AI nhận xét)

'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuizHistoryItem } from '@/types';
import { BookOpen, Send, CheckCircle, FileText, Award } from 'lucide-react';
import TextStreamLoader from '@/components/TextStreamLoader';

interface EssayPanelProps {
  essay: string;
  isLoading: boolean;
  onGenerate: (metadata: {
    subject: string;
    gradeLevel: string;
    lessonTopic: string;
    examTime: string;
  }) => void;
  userRole?: 'student' | 'teacher';
  userRoom?: string;
  onAssignEssay?: (title: string, targetRoom: string, startTime: string, endTime: string) => Promise<void>;
  fileName?: string;
  
  // Student props
  hasSubmitted?: boolean;
  onEssaySubmit?: (studentAnswer: string) => Promise<void>;
  previousSubmission?: QuizHistoryItem;
  canTake?: boolean;
  timeMessage?: string;
  isGrading?: boolean;
  availableRooms?: Array<{ code: string; name: string }>;
}

const DEFAULT_CLASSES = ['64CTT1', '64CTT2', '64CTT3', '64CTT4', '64CTT5'];

export default function EssayPanel({
  essay,
  isLoading,
  onGenerate,
  userRole = 'student',
  userRoom,
  onAssignEssay,
  fileName = '',
  hasSubmitted = false,
  onEssaySubmit,
  previousSubmission,
  canTake = true,
  timeMessage = '',
  isGrading = false,
  availableRooms = []
}: EssayPanelProps) {
  const isTeacher = userRole === 'teacher';

  // Form states cho tạo bài tự luận (Teacher)
  const [subject, setSubject] = useState('Ngữ văn');
  const [gradeLevel, setGradeLevel] = useState('Trung học phổ thông');
  const [lessonTopic, setLessonTopic] = useState('');
  const [examTime, setExamTime] = useState('45 phút');

  // Form states cho giao bài tự luận (Teacher)
  const [assignTitle, setAssignTitle] = useState('');
  const [targetRoom, setTargetRoom] = useState(() => {
    if (availableRooms.length > 0) return availableRooms[0].code;
    if (userRoom && DEFAULT_CLASSES.includes(userRoom)) return userRoom;
    return DEFAULT_CLASSES[0];
  });
  const [assignStart, setAssignStart] = useState('');
  const [assignEnd, setAssignEnd] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [formError, setFormError] = useState('');

  // States làm bài tự luận (Student)
  const [studentAnswerText, setStudentAnswerText] = useState('');
  const [studentErrorMsg, setStudentErrorMsg] = useState('');


  // Tự động điền chủ đề theo tên file nếu chưa nhập
  useEffect(() => {
    if (fileName) {
      const topic = fileName.replace(/\.[^/.]+$/, "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLessonTopic(topic);
    }
  }, [fileName]);

  // Xử lý nộp form giao bài (Teacher)
  const handleAssignClick = async () => {
    setFormError('');
    if (!assignTitle.trim()) {
      setFormError('Vui lòng nhập tên bài tự luận.');
      return;
    }
    if (!assignStart || !assignEnd) {
      setFormError('Vui lòng nhập thời gian bắt đầu và kết thúc.');
      return;
    }
    if (new Date(assignStart) >= new Date(assignEnd)) {
      setFormError('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    if (onAssignEssay) {
      setIsAssigning(true);
      try {
        await onAssignEssay(assignTitle.trim(), targetRoom, assignStart, assignEnd);
        // Reset form
        setAssignTitle('');
        setAssignStart('');
        setAssignEnd('');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Lỗi khi giao bài.');
      } finally {
        setIsAssigning(false);
      }
    }
  };

  // Tính số từ của bài làm học sinh
  const wordCount = studentAnswerText.trim() === '' ? 0 : studentAnswerText.trim().split(/\s+/).length;

  // Xử lý học sinh nộp bài tự luận
  const handleStudentSubmit = async () => {
    setStudentErrorMsg('');
    if (wordCount < 10) {
      setStudentErrorMsg('Bài làm quá ngắn. Vui lòng viết câu trả lời chi tiết hơn (tối thiểu 10 từ).');
      return;
    }

    if (onEssaySubmit) {
      try {
        await onEssaySubmit(studentAnswerText);
      } catch (err) {
        setStudentErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi nộp bài.');
      }
    }
  };

  // Trạng thái đang tải câu hỏi tự luận từ AI (Dành cho Giáo viên khi click tạo đề)
  if (isLoading) {
    return (
      <Card className="p-6 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm h-[500px] lg:h-[640px] xl:h-[740px] flex flex-col items-center justify-center overflow-hidden">
        <TextStreamLoader 
          messages={[
            "AI đang đọc tài liệu...",
            "Đang phân tích cấu trúc bài học...",
            "Đang thiết kế câu hỏi đọc hiểu...",
            "Đang tạo câu hỏi nghị luận xã hội...",
            "Đang hoàn thiện đề thi tự luận..."
          ]} 
          interval={2500}
          className="py-16"
        />
      </Card>
    );
  }

  // Trạng thái chưa có đề tự luận
  if (!essay) {
    return (
      <Card className="p-6 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm h-[500px] lg:h-[640px] xl:h-[740px] overflow-y-auto">
        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <p className="font-bold text-gray-700 dark:text-gray-300 text-base mb-1">Chưa có đề tự luận</p>
          <p className="text-xs text-gray-400 mt-1 mb-6 text-center max-w-sm">
            {isTeacher 
              ? 'Điền thông tin bên dưới để trợ lý AI soạn thảo đề kiểm tra tự luận gồm 5 câu (3 đọc hiểu, 1 nghị luận xã hội, 1 vận dụng).'
              : 'Tài liệu giảng dạy hiện chưa có đề thi tự luận được soạn thảo.'}
          </p>

          {isTeacher && (
            <div className="w-full max-w-md bg-gray-50/50 dark:bg-gray-800/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/80 mb-6 space-y-4 text-left text-gray-700 dark:text-gray-300">
              <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
                ⚙️ Thiết lập đề kiểm tra
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Môn học</label>
                  <Input 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    placeholder="Ví dụ: Ngữ văn, Lịch sử" 
                    className="h-9 text-xs rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Lớp / Cấp học</label>
                  <Input 
                    value={gradeLevel} 
                    onChange={(e) => setGradeLevel(e.target.value)} 
                    placeholder="Ví dụ: Lớp 10, Lớp 12, THPT" 
                    className="h-9 text-xs rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Tên bài học hoặc chủ đề</label>
                <Input 
                  value={lessonTopic} 
                  onChange={(e) => setLessonTopic(e.target.value)} 
                  placeholder="Nhập tên bài học hoặc chủ đề" 
                  className="h-9 text-xs rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Thời gian làm bài</label>
                <Input 
                  value={examTime} 
                  onChange={(e) => setExamTime(e.target.value)} 
                  placeholder="Ví dụ: 45 phút, 90 phút" 
                  className="h-9 text-xs rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {isTeacher && (
            <Button 
              onClick={() => onGenerate({ subject, gradeLevel, lessonTopic, examTime })} 
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 h-10 shadow-md shadow-purple-500/20 font-medium text-xs flex items-center gap-1.5"
            >
              Tạo đề tự luận bằng AI
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Giao diện cho Học sinh
  if (!isTeacher) {
    const isSubmittedState = hasSubmitted || !!previousSubmission;
    const finalSubmission = previousSubmission;

    return (
      <div className="space-y-6 h-[500px] lg:h-[640px] xl:h-[740px] overflow-y-auto pr-2">
        {/* 1. Đề bài tự luận */}
        <Card className="p-6 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              Đề bài tự luận bài học
            </h3>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none
            prose-headings:text-gray-800 dark:prose-headings:text-gray-100
            prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-h2:font-bold
            prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
            prose-li:text-gray-600 dark:prose-li:text-gray-300
            prose-strong:text-gray-800 dark:prose-strong:text-gray-100
            prose-ul:space-y-1
          ">
            <ReactMarkdown>{essay}</ReactMarkdown>
          </div>
        </Card>

        {/* 2. Phần làm bài / xem kết quả chấm bài của học sinh */}
        {isSubmittedState ? (
          <div className="space-y-6">
            <Card className="p-6 border border-emerald-200 dark:border-emerald-900/50 shadow-lg bg-white/85 dark:bg-gray-900/85 backdrop-blur-sm animate-fade-in-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Bài làm tự luận của bạn
                </h3>
                {finalSubmission && (
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                    <Award className="w-4 h-4 text-yellow-500" />
                    Điểm AI chấm: {finalSubmission.scale10Score}/10
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Nội dung bài làm đã nộp:
                  </h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-200/50 dark:border-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {finalSubmission?.studentAnswer}
                  </div>
                </div>
              </div>
            </Card>

            {/* Báo cáo nhận xét chi tiết của AI */}
            {finalSubmission?.aiFeedback && (
              <Card className="p-6 border border-purple-200 dark:border-purple-900/50 shadow-lg bg-white/85 dark:bg-gray-900/85 backdrop-blur-sm animate-fade-in-up">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <span className="p-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </span>
                  <h3 className="font-bold text-sm text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                    Báo cáo chấm điểm chi tiết của AI
                  </h3>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-gray-800 dark:prose-headings:text-gray-100
                  prose-h2:text-sm prose-h2:mt-4 prose-h2:mb-2 prose-h2:font-bold prose-h2:text-purple-700 dark:prose-h2:text-purple-400
                  prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-li:text-gray-600 dark:prose-li:text-gray-300
                  prose-strong:text-gray-800 dark:prose-strong:text-gray-100
                  prose-ul:space-y-1
                ">
                  <ReactMarkdown>{finalSubmission.aiFeedback}</ReactMarkdown>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-6 border border-purple-200 dark:border-purple-900/50 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <h3 className="font-bold text-sm text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Nội dung bài làm tự luận của bạn
            </h3>

            {isGrading ? (
              <TextStreamLoader 
                messages={[
                  "AI đang đọc bài làm của bạn...",
                  "Đang phân tích lập luận và cấu trúc...",
                  "Đang kiểm tra lỗi ngữ pháp và chính tả...",
                  "Đang so sánh với đáp án chuẩn...",
                  "Đang tổng hợp điểm số và nhận xét chi tiết..."
                ]}
                interval={3000}
                className="py-16"
              />
            ) : (
              <div className="space-y-4">
                {canTake ? (
                  <>
                    <div className="relative">
                      <textarea
                        className="w-full min-h-[250px] p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all leading-relaxed"
                        placeholder="Nhập câu trả lời tự luận chi tiết của bạn tại đây (sử dụng kiến thức trong tài liệu tham khảo để lập luận)..."
                        value={studentAnswerText}
                        onChange={(e) => setStudentAnswerText(e.target.value)}
                        onPaste={(e) => {
                          e.preventDefault();
                          alert('Không cho phép dán (paste) câu trả lời! Vui lòng tự gõ bài làm.');
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                      <span>Độ dài: <span className="font-bold text-purple-600 dark:text-purple-400">{wordCount}</span> từ | Ký tự: <span className="font-bold">{studentAnswerText.length}</span></span>
                      <span>Yêu cầu tối thiểu: 10 từ</span>
                    </div>

                    {studentErrorMsg && (
                      <p className="text-red-500 text-xs font-semibold animate-shake">⚠️ {studentErrorMsg}</p>
                    )}

                    <div className="pt-2 flex justify-end">
                      <Button
                        onClick={handleStudentSubmit}
                        className="h-10 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 font-semibold flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Nộp bài tự luận
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center bg-gray-50 dark:bg-gray-950/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                    <svg className="w-10 h-10 text-amber-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{timeMessage || 'Không nằm trong thời gian làm bài.'}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }

  // Giao diện cho Giáo viên
  return (
    <div className="space-y-6 h-[500px] lg:h-[640px] xl:h-[740px] overflow-y-auto pr-2">
      {/* 1. Nội dung đề tự luận */}
      <Card className="p-6 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
          <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200">
            📝 Đề thi tự luận & Thang điểm gợi ý
          </h3>
          <Button 
            onClick={() => onGenerate({ subject, gradeLevel, lessonTopic, examTime })} 
            variant="outline" 
            size="sm" 
            className="rounded-lg text-xs h-8 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-600 dark:text-purple-400"
          >
            🔄 Tạo lại đề mới
          </Button>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none
          prose-headings:text-gray-800 dark:prose-headings:text-gray-100
          prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-h2:font-bold
          prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
          prose-li:text-gray-600 dark:prose-li:text-gray-300
          prose-strong:text-gray-800 dark:prose-strong:text-gray-100
          prose-ul:space-y-1
        ">
          <ReactMarkdown>{essay}</ReactMarkdown>
        </div>
      </Card>

      {/* 2. Giao bài tự luận cho học sinh */}
      {isTeacher && onAssignEssay && (
        <Card className="p-6 border border-purple-200 dark:border-purple-900 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm animate-fade-in-up">
          <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Giao bài kiểm tra tự luận cho học sinh
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Tên bài tự luận</label>
                <Input
                  placeholder="Ví dụ: Bài tập tự luận số 1, Kiểm tra 15p..."
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  disabled={isAssigning}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Lớp nhận bài tự luận</label>
                <select
                  value={targetRoom}
                  onChange={(e) => setTargetRoom(e.target.value)}
                  disabled={isAssigning}
                  className="flex h-9 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-semibold text-foreground"
                >
                  {availableRooms.length > 0 ? (
                    availableRooms.map((room) => (
                      <option key={room.code} value={room.code}>{room.name} ({room.code})</option>
                    ))
                  ) : (
                    DEFAULT_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>Lớp {cls}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Thời gian bắt đầu</label>
                <Input 
                  type="datetime-local" 
                  value={assignStart} 
                  onChange={(e) => setAssignStart(e.target.value)} 
                  disabled={isAssigning}
                  className="h-9 text-xs rounded-xl" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Thời gian kết thúc</label>
                <Input 
                  type="datetime-local" 
                  value={assignEnd} 
                  onChange={(e) => setAssignEnd(e.target.value)} 
                  disabled={isAssigning}
                  className="h-9 text-xs rounded-xl" 
                />
              </div>
            </div>
          </div>

          {formError && (
            <p className="text-red-500 text-xs mt-3 font-semibold animate-shake">⚠️ {formError}</p>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleAssignClick}
              disabled={isAssigning}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs h-9 px-6 font-semibold shadow-md shadow-purple-500/20"
            >
              {isAssigning ? 'Đang giao bài...' : `Giao Đề Lớp ${targetRoom}`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

