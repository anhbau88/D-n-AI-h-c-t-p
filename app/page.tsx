// app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, BookOpen, GraduationCap, RefreshCw, FileText, CheckCircle2, AlertCircle, ArrowLeft, Award, Users, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useCompletion } from 'ai/react';
import { motion, AnimatePresence } from 'framer-motion';

// Static imports - nhẹ, luôn hiển thị ngay
import ThemeToggle from '@/components/ThemeToggle';
import AccessibilitySettings from '@/components/AccessibilitySettings';
import AuthScreen from '@/components/AuthScreen';

// Dynamic imports - nặng, chỉ tải khi cần (giảm ~40-50% JS bundle ban đầu)
const FileUpload = dynamic(() => import('@/components/FileUpload'), { ssr: false });
const SummaryPanel = dynamic(() => import('@/components/SummaryPanel'), { ssr: false });
const ChatBox = dynamic(() => import('@/components/ChatBox'), { ssr: false });
const QuizPanel = dynamic(() => import('@/components/QuizPanel'), { ssr: false });
const EssayPanel = dynamic(() => import('@/components/EssayPanel'), { ssr: false });
const DocumentLibrary = dynamic(() => import('@/components/DocumentLibrary'), { ssr: false });
const UserManagement = dynamic(() => import('@/components/UserManagement'), { ssr: false });

import { FileInfo, QuizQuestion, User, Assignment, QuizHistoryItem, DocumentItem, ChatMessage } from '@/types';

// Danh sách các lớp học chính thức
const CLASSES = ['64CTT1', '64CTT2', '64CTT3', '64CTT4', '64CTT5'];

export default function Home() {
  // === STATE ===
  const [user, setUser] = useState<User | null>(null);
  
  // Ref để kiểm soát tần suất tự động đồng bộ (Tab Focus Sync)
  const lastFetchTimeRef = useRef<number>(0);

  // Tài liệu đang được mở từ Thư viện cá nhân
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  // Bài kiểm tra học sinh đang chọn làm/ôn tập từ Kho bài tập của lớp
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);

  // Danh sách tài liệu trong thư viện cá nhân
  const [libraryDocs, setLibraryDocs] = useState<DocumentItem[]>([]);

  // Workspace States (Được đồng bộ dựa trên activeDoc hoặc activeAssignment)
  const [pdfText, setPdfText] = useState('');
  const [, setFileInfo] = useState<FileInfo | null>(null);
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [essay, setEssay] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Các bài tập và lịch sử thi
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);

  // Streaming cho Tóm tắt
  const { completion: streamingSummary, complete: startStreamingSummary, isLoading: isSummaryStreaming, setCompletion: setStreamingSummary } = useCompletion({
    api: '/api/summarize',
    onFinish: async (prompt: string, result: string) => {
      if (activeDoc) {
        await updateDocumentOnServer(activeDoc.id, { summary: result });
        setSummary(result);
        showMessage('Tạo bản tóm tắt mới bằng AI thành công!', false);
        setLoadingType(null);
      }
    },
    onError: (err: Error) => {
      showMessage(err.message || 'Lỗi tóm tắt');
      setLoadingType(null);
    }
  });

  // Tài liệu tự luận được giáo viên chọn xem chi tiết bài nộp
  const [selectedEssaySubmission, setSelectedEssaySubmission] = useState<QuizHistoryItem | null>(null);

  // Lớp đang được giáo viên lựa chọn xem trên dashboard
  const [dashboardClass, setDashboardClass] = useState<string>('64CTT1');

  // UI States
  const [activeTab, setActiveTab] = useState('summary');

  // Khôi phục tab khi phóng to lên desktop và đang mở tab tài liệu gốc (vốn chỉ có trên mobile)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && activeTab === 'document') {
        setActiveTab('summary');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Lấy trạng thái vai trò
  const isTeacher = user?.role === 'teacher';

  // 1. Đồng bộ activeDoc sang các workspace states khi thay đổi tài liệu cá nhân
  useEffect(() => {
    if (activeDoc) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveAssignment(null); // Tắt bài thi đang chọn nếu mở tài liệu cá nhân
      setPdfText(activeDoc.textContent);
      setFileInfo({
        fileName: activeDoc.fileName,
        fileSize: activeDoc.fileSize,
        pages: Math.max(1, Math.ceil(activeDoc.textContent.length / 3000)),
        textLength: activeDoc.textContent.length
      });
      setSummary(activeDoc.summary || '');
      setQuestions(activeDoc.quiz || []);
      setEssay(activeDoc.essay || '');
      setChatHistory(activeDoc.chatHistory || []);
    }
  }, [activeDoc]);

  // 2. Đồng bộ activeAssignment sang workspace khi học sinh chọn bài tập ôn luyện
  useEffect(() => {
    if (activeAssignment) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveDoc(null); // Tắt tài liệu cá nhân nếu mở bài tập ôn luyện
      setPdfText(activeAssignment.pdfText);
      setFileInfo({
        fileName: activeAssignment.fileName,
        fileSize: 0,
        pages: Math.max(1, Math.ceil(activeAssignment.pdfText.length / 3000)),
        textLength: activeAssignment.pdfText.length
      });
      setQuestions(activeAssignment.questions || []);
      setEssay(activeAssignment.essay || '');

      // Với bài ôn luyện, tóm tắt và chat sẽ trống (hoặc bạn có thể tự gọi AI nếu muốn)
      setSummary('');
      setChatHistory([]);

      // Chuyển tab sang tương ứng
      setActiveTab(activeAssignment.type === 'quiz' ? 'quiz' : 'essay');
    }
  }, [activeAssignment]);

  // Tải danh sách tài liệu công cộng từ máy chủ
  const loadLibraryDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const docs = (await res.json()) as DocumentItem[];
        setLibraryDocs(docs.sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()));
        localStorage.setItem('libraryDocs', JSON.stringify(docs));
      }
    } catch (err) {
      console.error('Lỗi tải tài liệu từ máy chủ:', err);
    }
  };

  // Khôi phục session & dữ liệu khi mở ứng dụng
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const savedUser = localStorage.getItem('user');
    const savedAssignments = localStorage.getItem('assignments');
    const savedHistory = localStorage.getItem('quizHistory');
    const savedLibraryDocs = localStorage.getItem('libraryDocs');

    if (savedAssignments) {
      try { setAssignments(JSON.parse(savedAssignments)); } catch { }
    }
    if (savedHistory) {
      try { setQuizHistory(JSON.parse(savedHistory)); } catch { }
    }
    if (savedLibraryDocs) {
      try { setLibraryDocs(JSON.parse(savedLibraryDocs)); } catch { }
    }
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        if (parsedUser.room) setDashboardClass(parsedUser.room);
        loadLibraryDocuments();
      } catch { }
    }
  }, []);

  // Hàm tải toàn bộ điểm từ server
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setQuizHistory(data);
        localStorage.setItem('quizHistory', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Lỗi đồng bộ lịch sử điểm số:', err);
    }
  };

  // Lấy danh sách bài tập được giao từ Vercel Blob / Local
  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
        localStorage.setItem('assignments', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Lỗi đồng bộ assignments:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAssignments();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
    loadLibraryDocuments();
  }, [user]);

  // Tự động làm mới dữ liệu ngầm khi người dùng quay lại tab (Tab Focus Sync)
  useEffect(() => {
    if (!user) return;
    
    // Khởi tạo thời điểm fetch ban đầu
    lastFetchTimeRef.current = Date.now();

    const syncDataSilently = () => {
      const now = Date.now();
      // Chỉ đồng bộ ngầm nếu lần cuối cách đây ít nhất 15 giây
      if (now - lastFetchTimeRef.current > 15000) {
        lastFetchTimeRef.current = now;
        Promise.all([
          fetchAssignments(),
          fetchHistory(),
          loadLibraryDocuments()
        ]).catch(err => console.error('Lỗi đồng bộ ngầm:', err));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncDataSilently();
      }
    };

    const handleFocus = () => {
      syncDataSilently();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  if (!isMounted) return null;

  // === HANDLERS ===

  // Làm mới dữ liệu thủ công
  const handleRefreshData = () => {
    if (!user) return;
    setLoadingType('refreshing');
    Promise.all([
      fetchAssignments(),
      fetchHistory(),
      loadLibraryDocuments()
    ]).finally(() => {
      setLoadingType(null);
      showMessage('Đã đồng bộ dữ liệu mới nhất!', false);
    });
  };

  // Đăng nhập thành công
  const handleLogin = (newUser: User) => {
    setUser(newUser);
    if (newUser.room) setDashboardClass(newUser.room);
    localStorage.setItem('user', JSON.stringify(newUser));
    loadLibraryDocuments();
    setActiveDoc(null);
    setActiveAssignment(null);
  };

  // Đăng xuất
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setActiveDoc(null);
    setActiveAssignment(null);
    setLibraryDocs([]);
  };

  // Hiển thị Toast thông báo nhanh
  const showMessage = (msg: string, isError = true) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  // Học sinh nộp bài thi
  const handleScoreSubmit = async (score: number, scale10Score: string) => {
    if (!user || !activeAssignment) return;

    const newItem: QuizHistoryItem = {
      username: user.username,
      fullName: user.fullName,
      assignmentId: activeAssignment.id,
      roomId: activeAssignment.roomId,
      fileName: activeAssignment.fileName,
      score,
      totalQuestions: activeAssignment.questions?.length || 0,
      scale10Score,
      submittedAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        const data = await res.json();
        setQuizHistory(data);
        localStorage.setItem('quizHistory', JSON.stringify(data));
      } else {
        const newHistory = [...quizHistory, newItem];
        setQuizHistory(newHistory);
        localStorage.setItem('quizHistory', JSON.stringify(newHistory));
      }
    } catch (err) {
      console.error('Lỗi nộp điểm lên server:', err);
      const newHistory = [...quizHistory, newItem];
      setQuizHistory(newHistory);
      localStorage.setItem('quizHistory', JSON.stringify(newHistory));
    }

    setActiveDoc(null);
    setActiveAssignment(null);
    showMessage(`Đã nộp bài! Điểm của bạn là ${scale10Score}/10`, false);
  };

  // Học sinh nộp bài tự luận
  const handleEssaySubmit = async (studentAnswer: string) => {
    if (!user || !activeAssignment) return;

    setLoadingType('grading-essay');
    try {
      const resGrade = await fetch('/api/essay/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayQuestion: activeAssignment.essay,
          studentAnswer,
          pdfText: activeAssignment.pdfText
        })
      });
      const dataGrade = await resGrade.json();
      if (!resGrade.ok) throw new Error(dataGrade.error || 'Lỗi chấm bài tự động');

      const { score, feedback } = dataGrade;

      const newItem: QuizHistoryItem = {
        username: user.username,
        fullName: user.fullName,
        assignmentId: activeAssignment.id,
        roomId: activeAssignment.roomId,
        fileName: activeAssignment.fileName,
        score: score,
        totalQuestions: 10,
        scale10Score: score.toFixed(1),
        submittedAt: new Date().toISOString(),
        type: 'essay',
        studentAnswer,
        aiFeedback: feedback,
        status: 'graded'
      };

      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (res.ok) {
        const data = await res.json();
        setQuizHistory(data);
        localStorage.setItem('quizHistory', JSON.stringify(data));
      } else {
        const newHistory = [...quizHistory, newItem];
        setQuizHistory(newHistory);
        localStorage.setItem('quizHistory', JSON.stringify(newHistory));
      }
      setActiveDoc(null);
      setActiveAssignment(null);
      showMessage(`Đã nộp bài tự luận! AI chấm bài làm của bạn là ${score.toFixed(1)}/10`, false);
    } catch (err) {
      console.error('Lỗi khi nộp & chấm bài tự luận:', err);
      showMessage(err instanceof Error ? err.message : 'Lỗi chấm bài tự luận');
      throw err;
    } finally {
      setLoadingType(null);
    }
  };

  // Giáo viên xóa/hủy bài thi đã giao
  const handleDeleteAssignment = async (asmId: string) => {
    if (!user || !isTeacher) return;

    if (!confirm('Bạn có chắc chắn muốn xóa/hủy bài thi đã giao này? Học sinh sẽ không thể nhìn thấy bài thi này nữa.')) {
      return;
    }

    const updatedAssignments = assignments.filter(a => a.id !== asmId);

    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAssignments),
      });

      if (!res.ok) {
        throw new Error('Lỗi server khi đồng bộ sau khi xóa.');
      }

      setAssignments(updatedAssignments);
      localStorage.setItem('assignments', JSON.stringify(updatedAssignments));
      showMessage('Đã xóa bài thi đã giao thành công!', false);
    } catch (err) {
      console.error('Lỗi khi xóa bài thi:', err);
      showMessage('Không thể xóa bài thi.');
    }
  };

  // Hàm cập nhật tài liệu trên máy chủ và đồng bộ state local
  const updateDocumentOnServer = async (docId: string, updates: Partial<DocumentItem>, forceSetActive = false) => {
    let updatedDoc: DocumentItem | null = null;
    const updatedDocs = libraryDocs.map(d => {
      if (d.id === docId) {
        const newDoc = {
          ...d,
          ...updates,
          lastOpenedAt: new Date().toISOString()
        };
        updatedDoc = newDoc;
        return newDoc;
      }
      return d;
    });

    if (updatedDoc) {
      if (forceSetActive) {
        setActiveDoc(updatedDoc);
      } else {
        setActiveDoc(prevActiveDoc => {
          if (prevActiveDoc && prevActiveDoc.id === docId) {
            return updatedDoc!;
          }
          return prevActiveDoc;
        });
      }
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDocs),
      });

      if (res.ok) {
        setLibraryDocs(updatedDocs);
        localStorage.setItem('libraryDocs', JSON.stringify(updatedDocs));
      } else {
        throw new Error('Lỗi server khi cập nhật tài liệu.');
      }
    } catch (err) {
      console.error('Lỗi cập nhật tài liệu lên server:', err);
    }
  };

  // XỬ LÝ UPLOAD FILE MỚI (chưa có trong thư viện dùng chung)
  const handleUploadSuccess = async (text: string, info: FileInfo, hash: string) => {
    if (!user) return;

    // eslint-disable-next-line react-hooks/purity
    const newDocId = Date.now().toString();
    const newDoc: DocumentItem = {
      id: newDocId,
      role: user.role,
      fileName: info.fileName,
      fileSize: info.fileSize,
      fileType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      hash,
      pdfUrl: info.pdfUrl,
      textContent: text,
      ownerType: user.role,
      status: 'processed'
    };

    const updatedDocs = [...libraryDocs, newDoc];
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDocs)
      });
      if (res.ok) {
        setLibraryDocs(updatedDocs);
        localStorage.setItem('libraryDocs', JSON.stringify(updatedDocs));
        setActiveDoc(newDoc);
        showMessage('Tài liệu mới đã được chia sẻ lên thư viện công cộng thành công!', false);
      } else {
        throw new Error('Lỗi server');
      }
    } catch (err) {
      console.error('Lỗi lưu tài liệu:', err);
      showMessage('Không thể lưu tài liệu vào thư viện dùng chung.');
    }
  };

  // XỬ LÝ KHI PHÁT HIỆN FILE TRÙNG MÃ HASH (Tải lại từ thư viện công cộng)
  const handleExistingDocumentFound = async (doc: DocumentItem) => {
    if (!user) return;
    await updateDocumentOnServer(doc.id, { lastOpenedAt: new Date().toISOString() }, true);
    showMessage('Tài liệu này đã tồn tại trong thư viện công cộng. Trình duyệt đã khôi phục dữ liệu đã lưu.', false);
  };

  // CHỌN MỞ TÀI LIỆU TỪ THƯ VIỆN CÔNG CỘNG
  const handleSelectDocument = async (doc: DocumentItem) => {
    await updateDocumentOnServer(doc.id, { lastOpenedAt: new Date().toISOString() }, true);
  };

  // CHỌN MỞ BÀI TẬP TỪ DANH SÁCH ÔN TẬP (Học sinh)
  const handleSelectAssignment = (asm: Assignment) => {
    setActiveAssignment(asm);
  };

  // XÓA TÀI LIỆU KHỎI THƯ VIỆN CÔNG CỘNG
  const handleDeleteDocument = async (docId: string) => {
    if (!user) return;
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này khỏi thư viện công cộng? Học sinh và giáo viên khác sẽ không thể nhìn thấy tài liệu này nữa.')) {
      return;
    }
    const docToDelete = libraryDocs.find(d => d.id === docId);
    const updatedDocs = libraryDocs.filter(d => d.id !== docId);
    
    try {
      // 1. Đồng bộ danh sách mới
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDocs)
      });
      
      if (res.ok) {
        // 2. Nếu tài liệu bị xóa có chứa pdfUrl (trên Vercel Blob), gọi API xóa file
        if (docToDelete?.pdfUrl) {
          try {
            await fetch('/api/documents', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pdfUrl: docToDelete.pdfUrl })
            });
          } catch (e) {
            console.error('Lỗi khi xóa PDF trên Blob:', e);
          }
        }
        setLibraryDocs(updatedDocs);
        localStorage.setItem('libraryDocs', JSON.stringify(updatedDocs));
        if (activeDoc?.id === docId) {
          setActiveDoc(null);
        }
        showMessage('Đã xóa tài liệu khỏi thư viện công cộng.', false);
      } else {
        throw new Error('Lỗi server');
      }
    } catch (err) {
      console.error('Lỗi khi xóa tài liệu:', err);
      showMessage('Không thể xóa tài liệu.');
    }
  };

  // TÓM TẮT TÀI LIỆU (Có cơ chế Cache)
  const handleSummarize = async (forceRegenerate = false) => {
    if (!pdfText || !activeDoc) return showMessage('Vui lòng mở hoặc tải lên tài liệu trước.');

    if (activeDoc.summary && !forceRegenerate) {
      setSummary(activeDoc.summary);
      setStreamingSummary(activeDoc.summary);
      showMessage('Đã tải bản tóm tắt đã lưu.', false);
      return;
    }

    setLoadingType('summary');
    setActiveTab('summary');
    
    startStreamingSummary('', {
      body: {
        pdfText,
        role: user?.role,
        fileName: activeDoc?.fileName,
        fileType: 'PDF'
      }
    });
  };

  // TẠO CÂU HỎI TRẮC NGHIỆM (Có cơ chế Cache)
  const handleGenerateQuiz = async (forceRegenerate = false) => {
    if (!pdfText || !activeDoc) return showMessage('Vui lòng mở hoặc tải lên tài liệu trước.');

    if (activeDoc.quiz && activeDoc.quiz.length > 0 && !forceRegenerate) {
      setQuestions(activeDoc.quiz);
      showMessage('Đã tải bộ câu hỏi trắc nghiệm đã lưu.', false);
      return;
    }

    setLoadingType('quiz');
    setActiveTab('quiz');
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfText, questionCount, role: user?.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await updateDocumentOnServer(activeDoc.id, { quiz: data.questions });
      setQuestions(data.questions);

      showMessage('Tạo câu hỏi trắc nghiệm ôn tập thành công!', false);
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Lỗi tạo trắc nghiệm');
    } finally {
      setLoadingType(null);
    }
  };

  // TẠO CÂU HỎI TỰ LUẬN (Có cơ chế Cache)
  const handleGenerateEssay = async (
    forceRegenerate = false,
    metadata?: {
      subject: string;
      gradeLevel: string;
      lessonTopic: string;
      examTime: string;
    }
  ) => {
    if (!pdfText || !activeDoc) return showMessage('Vui lòng mở tài liệu bài giảng trước.');

    if (activeDoc.essay && !forceRegenerate) {
      setEssay(activeDoc.essay);
      showMessage('Đã tải câu hỏi tự luận đã lưu.', false);
      return;
    }

    setLoadingType('essay');
    setActiveTab('essay');
    try {
      const res = await fetch('/api/essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfText,
          subject: metadata?.subject,
          gradeLevel: metadata?.gradeLevel,
          lessonTopic: metadata?.lessonTopic,
          examTime: metadata?.examTime
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await updateDocumentOnServer(activeDoc.id, { essay: data.essay });
      setEssay(data.essay);

      showMessage('AI đã soạn thảo đề tự luận thành công!', false);
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Lỗi tạo đề tự luận');
    } finally {
      setLoadingType(null);
    }
  };

  // Gửi câu hỏi chat và lưu lịch sử chat vào IndexedDB
  const handleSendMessage = async (updatedHistory: ChatMessage[]) => {
    if (!activeDoc) return;
    try {
      await updateDocumentOnServer(activeDoc.id, { chatHistory: updatedHistory });
      setChatHistory(updatedHistory);
    } catch (err) {
      console.error('Lỗi lưu lịch sử chat vào DB:', err);
    }
  };

  // Giáo viên giao bài trắc nghiệm đã tạo
  const handleAssignQuiz = async (title: string, targetRoom: string, startTime: string, endTime: string) => {
    if (!user || !activeDoc || !questions.length) return;

    const newAssignment: Assignment = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now().toString(),
      title,
      type: 'quiz',
      roomId: targetRoom,
      fileName: activeDoc.fileName,
      pdfText: pdfText,
      questions: questions,
      startTime,
      endTime
    };

    const updatedAssignments = [...assignments, newAssignment];

    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAssignments),
      });

      if (!res.ok) {
        throw new Error('Lỗi server khi đồng bộ đề thi.');
      }

      setAssignments(updatedAssignments);
      localStorage.setItem('assignments', JSON.stringify(updatedAssignments));
      showMessage(`Đã giao bài trắc nghiệm "${title}" thành công cho lớp ${targetRoom}!`, false);
      setDashboardClass(targetRoom);
      setActiveDoc(null);
    } catch (err) {
      console.error('Lỗi giao bài trắc nghiệm:', err);
      throw err;
    }
  };

  // Giáo viên giao bài tự luận đã tạo
  const handleAssignEssay = async (title: string, targetRoom: string, startTime: string, endTime: string) => {
    if (!user || !activeDoc || !essay) return;

    const newAssignment: Assignment = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now().toString(),
      title,
      type: 'essay',
      roomId: targetRoom,
      fileName: activeDoc.fileName,
      pdfText: pdfText,
      essay: essay,
      startTime,
      endTime
    };

    const updatedAssignments = [...assignments, newAssignment];

    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAssignments),
      });

      if (!res.ok) {
        throw new Error('Lỗi server khi đồng bộ đề tự luận.');
      }

      setAssignments(updatedAssignments);
      localStorage.setItem('assignments', JSON.stringify(updatedAssignments));
      showMessage(`Đã giao bài tự luận "${title}" thành công cho lớp ${targetRoom}!`, false);
      setDashboardClass(targetRoom);
      setActiveDoc(null);
    } catch (err) {
      console.error('Lỗi giao bài tự luận:', err);
      throw err;
    }
  };

  // === RENDER LOGIC ===

  // Tính toán chỉ số phân tích học tập của học sinh
  const studentHistoryList = quizHistory.filter(h => h.username === user?.username);
  const studentTotalDone = studentHistoryList.length;
  const studentAverageScore = studentTotalDone > 0
    ? (studentHistoryList.reduce((acc, h) => acc + parseFloat(h.scale10Score), 0) / studentTotalDone).toFixed(1)
    : '0.0';
  const studentMaxScore = studentTotalDone > 0
    ? Math.max(...studentHistoryList.map(h => parseFloat(h.scale10Score))).toFixed(1)
    : '0.0';

  // Lọc danh sách bài tập ôn thi của lớp hiện tại (đối với Học sinh) - hiển thị cả trắc nghiệm và tự luận
  const roomAssignments = (!isTeacher && user?.role === 'student' && user.room)
    ? assignments.filter(a => a.roomId === user.room)
    : [];

  // Lọc danh sách bài thi được giao của lớp học phụ trách (đối với Giáo viên)
  const teacherAssignments = (isTeacher && dashboardClass)
    ? assignments.filter(a => a.roomId === dashboardClass)
    : [];

  // Lấy trạng thái của bài ôn tập đang chọn
  const activeSubmission = activeAssignment
    ? quizHistory.find(h => h.assignmentId === activeAssignment.id && h.username === user?.username)
    : undefined;

  let canTakeActiveAssignment = true;
  let activeTimeMsg = '';
  if (activeAssignment) {
    const now = new Date();
    const start = new Date(activeAssignment.startTime);
    const end = new Date(activeAssignment.endTime);
    const hasSubmitted = !!activeSubmission;

    if (now < start) {
      canTakeActiveAssignment = false;
      activeTimeMsg = `Chưa đến giờ thi. Bắt đầu lúc: ${start.toLocaleString('vi-VN')}`;
    } else if (now > end) {
      canTakeActiveAssignment = false;
      activeTimeMsg = `Đã hết hạn làm bài lúc: ${end.toLocaleString('vi-VN')}`;
    } else {
      canTakeActiveAssignment = true;
      if (!hasSubmitted) {
        activeTimeMsg = `Đang trong thời gian làm bài (Hạn chót: ${end.toLocaleTimeString('vi-VN')} ngày ${end.toLocaleDateString('vi-VN')})`;
      } else {
        activeTimeMsg = `Đã nộp bài thành công (Hạn chót: ${end.toLocaleTimeString('vi-VN')} ngày ${end.toLocaleDateString('vi-VN')})`;
      }
    }
  }

  // Nếu chưa đăng nhập, hiển thị màn hình Login
  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const isLoading = loadingType !== null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-12 transition-all duration-300">

      {/* ===== HEADER ===== */}
      <header className="relative overflow-hidden mb-6 shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23fff%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M20%200L40%2020L20%2040L0%2020z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4.5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border border-white/20 p-1">
              <Image src="/logo.png" alt="Logo" width={44} height={44} className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                AI Study Assistant
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Trợ lý học tập thông minh | Vai trò: <span className="font-bold underline decoration-yellow-400 decoration-2">{isTeacher ? 'Giáo viên 👩‍🏫' : 'Học sinh 👨‍🎓'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {/* Accessibility Settings */}
            <AccessibilitySettings />
            
            {/* Dark Mode Switcher */}
            <ThemeToggle />

            {/* User Profile info */}
            <div className="text-right text-white hidden sm:block">
              <p className="text-sm font-semibold">{user.username}</p>
              <p className="text-blue-100 text-[10px] uppercase tracking-wider font-bold">
                {isTeacher ? `👩‍🏫 GV Lớp: ${user.room || 'Trống'}` : `👨‍🎓 Lớp: ${user.room || 'Trống'}`}
              </p>
            </div>

            {/* Mobile Avatar */}
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs uppercase sm:hidden" title={`${user.username} (${user.room})`}>
              {user.username.charAt(0)}
            </div>

            {isTeacher && user?.room && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowUserManagement(true)}
                className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-100 border-0 backdrop-blur-sm h-10 rounded-xl px-3 sm:px-4 text-xs font-medium flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Quản lý lớp</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm h-10 rounded-xl px-3 sm:px-4 text-xs font-medium flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ===== POPUPS & MODALS ===== */}
      {showUserManagement && user?.room && (
        <UserManagement 
          isOpen={showUserManagement} 
          onClose={() => setShowUserManagement(false)} 
          room={user.room} 
        />
      )}

      {/* ===== ALERTS (TOAST) ===== */}
      {error && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 px-4.5 py-3.5 rounded-2xl shadow-xl max-w-sm backdrop-blur-md flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed flex-1">{error}</p>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 px-4.5 py-3.5 rounded-2xl shadow-xl max-w-sm backdrop-blur-md flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed flex-1">{successMsg}</p>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* === CỘT TRÁI: Upload + Library === */}
          {(!activeDoc && !activeAssignment) && (
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">

            {/* Upload Component */}
            {isTeacher ? (
              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                onExistingDocumentFound={handleExistingDocumentFound}
                onError={(msg) => showMessage(msg)}
                isDisabled={isLoading}
                currentRole={user.role}
                existingDocuments={libraryDocs}
              />
            ) : (
              <div className="space-y-6">
                {/* Cho phép upload nếu học sinh không ở trong phòng thi/làm đề */}
                {!activeAssignment && (
                  <FileUpload
                    onUploadSuccess={handleUploadSuccess}
                    onExistingDocumentFound={handleExistingDocumentFound}
                    onError={(msg) => showMessage(msg)}
                    isDisabled={isLoading}
                    currentRole={user.role}
                    existingDocuments={libraryDocs}
                  />
                )}

                {/* Dashboard thống kê nhanh của học sinh */}
                <div className="bg-white/80 dark:bg-gray-900/80 p-4.5 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 space-y-3 animate-fade-in-up">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    📊 Thống kê học tập
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100/30 dark:border-blue-900/30">
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 block font-bold uppercase">GPA</span>
                      <span className="text-base font-black text-blue-700 dark:text-blue-300">{studentAverageScore}/10</span>
                    </div>
                    <div className="p-2 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100/30 dark:border-emerald-900/30">
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-bold uppercase">Luyện tập</span>
                      <span className="text-base font-black text-emerald-700 dark:text-emerald-300">{studentTotalDone} bài</span>
                    </div>
                  </div>
                </div>

                {/* Điểm số học sinh */}
                <div className="bg-white/80 dark:bg-gray-900/80 p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    📈 Lịch sử điểm số
                  </h3>
                  {studentHistoryList.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {[...studentHistoryList].reverse().map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-semibold text-gray-700 dark:text-gray-300 truncate" title={item.fileName}>
                              {item.fileName}
                            </p>
                            <span className="text-[9px] text-gray-400">{new Date(item.submittedAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded text-[10px] shrink-0">
                            {item.scale10Score}/10
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 text-center py-4">Chưa có điểm trắc nghiệm nào.</p>
                  )}
                </div>
              </div>
            )}

            {/* Document Library (Thư viện tài liệu) */}
            {!activeAssignment && (
              <DocumentLibrary
                documents={libraryDocs}
                activeDocId={null}
                onSelectDocument={handleSelectDocument}
                onDeleteDocument={handleDeleteDocument}
                currentRole={user.role}
              />
            )}
          </div>
          )}

          {/* === CỘT PHẢI: Workspace (Tabs) === */}
          <div className={(!activeDoc && !activeAssignment) ? "lg:col-span-8 xl:col-span-9" : "lg:col-span-12"}>

            {/* Active Document Header */}
            {activeDoc ? (
              <div className="mb-4.5 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center flex-wrap gap-3 animate-fade-in-up">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate" title={activeDoc.fileName}>
                      {activeDoc.fileName}
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Lịch sử mở: {new Date(activeDoc.lastOpenedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Đã lưu
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveDoc(null);
                    }}
                    className="h-8 rounded-lg text-xs border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold px-3 transition-all"
                  >
                    ✕ Đóng Workspace
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Active Assignment Header (Học sinh đang ôn tập bài giao) */}
            {activeAssignment ? (
              <div className="mb-4.5 p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/50 rounded-xl shadow-sm flex justify-between items-center flex-wrap gap-3 animate-fade-in-up">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Button
                    onClick={() => setActiveAssignment(null)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="min-w-0">
                    <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Bài kiểm tra trắc nghiệm
                    </span>
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate mt-1">
                      {activeAssignment.title}
                    </h2>
                  </div>
                </div>

                <div className="text-right text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {activeTimeMsg}
                </div>
              </div>
            ) : null}

            {/* Tabs Workspace */}
            {activeDoc || activeAssignment ? (
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* SPLIT VIEW: PDF/Word Viewer (Desktop only) */}
                {activeDoc?.pdfUrl && (
                  <div className="hidden lg:flex lg:w-7/12 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[700px] xl:h-[900px] animate-fade-in-up">
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-750 flex justify-between items-center shrink-0">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        📄 Bản gốc tài liệu ({activeDoc.fileName.endsWith('.docx') ? 'Word' : (activeDoc.fileName.match(/\.(png|jpe?g|webp)$/i) ? 'Image' : 'PDF')})
                      </span>
                    </div>
                    {activeDoc.fileName.endsWith('.docx') ? (
                      <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeDoc.pdfUrl)}`} className="w-full h-full border-0 bg-gray-50 dark:bg-gray-900" />
                    ) : activeDoc.fileName.match(/\.(png|jpe?g|webp)$/i) ? (
                      <div className="w-full h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={activeDoc.pdfUrl} alt="Document preview" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <iframe src={`${activeDoc.pdfUrl}#view=FitH`} className="w-full h-full border-0 bg-gray-50 dark:bg-gray-900" />
                    )}
                  </div>
                )}

                {/* SPLIT VIEW: Workspace Tabs */}
                <div className={`w-full ${activeDoc?.pdfUrl ? 'lg:w-5/12' : ''}`}>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800 p-1.5 rounded-2xl flex flex-row items-center justify-start overflow-x-auto scrollbar-none max-w-full !h-auto flex-nowrap gap-1 w-full">
                  {/* Mobile Document Tab (Hidden on desktop) */}
                  {activeDoc?.pdfUrl && (
                    <TabsTrigger
                      value="document"
                      className="lg:hidden flex-1 shrink-0 min-w-[110px] rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                    >
                      Tài liệu gốc
                    </TabsTrigger>
                  )}

                  <TabsTrigger
                    value="summary"
                    disabled={!!activeAssignment}
                    className="flex-1 shrink-0 min-w-[110px] rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                  >
                    Tóm tắt tài liệu
                  </TabsTrigger>

                  <TabsTrigger
                    value="chat"
                    disabled={!!activeAssignment}
                    className="flex-1 shrink-0 min-w-[110px] rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all"
                  >
                    Chat với AI
                  </TabsTrigger>

                  <TabsTrigger
                    value="quiz"
                    disabled={activeAssignment?.type === 'essay'}
                    className="flex-1 shrink-0 min-w-[110px] rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
                  >
                    Bài tập trắc nghiệm
                  </TabsTrigger>

                  {(isTeacher || activeAssignment?.type === 'essay') && (
                    <TabsTrigger
                      value="essay"
                      className="flex-1 shrink-0 min-w-[110px] rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all"
                    >
                      {isTeacher ? 'Đề thi tự luận' : 'Bài tập tự luận'}
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* === TAB CONTENT AREA: AnimatePresence cho transitions mượt === */}
                <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >

                 {/* === TAB 0: DOCUMENT PREVIEW (Mobile only) === */}
                 {activeDoc?.pdfUrl && (
                   <TabsContent value="document" className="mt-0 outline-none lg:hidden animate-fade-in-up">
                     <div className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[500px]">
                       <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
                         <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                           📄 Bản gốc tài liệu ({activeDoc.fileName.endsWith('.docx') ? 'Word' : (activeDoc.fileName.match(/\.(png|jpe?g|webp)$/i) ? 'Image' : 'PDF')})
                         </span>
                       </div>
                       {activeDoc.fileName.endsWith('.docx') ? (
                         <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeDoc.pdfUrl)}`} className="w-full h-full border-0 bg-gray-50 dark:bg-gray-900" />
                       ) : activeDoc.fileName.match(/\.(png|jpe?g|webp)$/i) ? (
                         <div className="w-full h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={activeDoc.pdfUrl} alt="Document preview" className="max-w-full max-h-full object-contain" />
                         </div>
                       ) : (
                         <iframe src={`${activeDoc.pdfUrl}#view=FitH`} className="w-full h-full border-0 bg-gray-50 dark:bg-gray-900" />
                       )}
                     </div>
                   </TabsContent>
                 )}

                {/* === TAB 1: SUMMARY === */}
                <TabsContent value="summary" className="mt-0 outline-none">
                  {!summary && !isSummaryStreaming && !isLoading && (
                    <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-md flex flex-col items-center">
                      <BookOpen className="w-12 h-12 text-blue-500 mb-3" />
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tài liệu chưa được tóm tắt</h4>
                      <p className="text-xs text-gray-400 mt-1 mb-4">AI sẽ phân tích văn bản để giúp bạn nắm bắt ý chính nhanh chóng.</p>
                      <Button onClick={() => handleSummarize(false)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs h-9 px-4 shadow-md">
                        Tạo bản tóm tắt bài giảng
                      </Button>
                    </div>
                  )}

                  {(streamingSummary || summary || isLoading) && (
                    <SummaryPanel summary={streamingSummary || summary} isLoading={isSummaryStreaming || loadingType === 'summary'} />
                  )}
                </TabsContent>

                {/* === TAB 2: CHAT === */}
                <TabsContent value="chat" className="mt-0 outline-none">
                  <ChatBox
                    key={activeDoc?.id || 'chat'}
                    pdfText={pdfText}
                    userRole={user.role}
                    onError={showMessage}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendMessage}
                  />
                </TabsContent>

                {/* === TAB 3: QUIZ === */}
                <TabsContent value="quiz" className="mt-0 outline-none">
                  {activeAssignment && !canTakeActiveAssignment && !activeSubmission ? (
                    <div className="p-12 text-center bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                      <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-300 text-sm font-medium">{activeTimeMsg}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isTeacher ? (
                        <div className="p-5 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">SỐ CÂU HỎI:</span>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={questionCount}
                              onChange={(e) => setQuestionCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                              disabled={isLoading}
                              className="w-16 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <Button
                            onClick={() => handleGenerateQuiz(true)}
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 shadow-sm shrink-0"
                          >
                            {questions.length > 0 ? '🔄 Soạn lại bộ đề thi mới (AI)' : '⚙️ Soạn câu hỏi trắc nghiệm (AI)'}
                          </Button>
                        </div>
                      ) : (
                        !activeAssignment && !questions.length && !isLoading && (
                          <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-md flex flex-col items-center">
                            <GraduationCap className="w-12 h-12 text-emerald-500 mb-3" />
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tự luyện trắc nghiệm</h4>
                            <p className="text-xs text-gray-400 mt-1 mb-4">AI sẽ tự động thiết kế đề thi gồm 5 câu trắc nghiệm bám sát bài học để bạn tự làm.</p>
                            <Button onClick={() => handleGenerateQuiz(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-4 shadow-md">
                              Bắt đầu ôn tập trắc nghiệm
                            </Button>
                          </div>
                        )
                      )}

                      {!isTeacher && !activeAssignment && questions.length > 0 && (
                        <div className="flex justify-end">
                          <Button
                            onClick={() => handleGenerateQuiz(true)}
                            disabled={isLoading}
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs h-9 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Làm đề thi khác
                          </Button>
                        </div>
                      )}

                      {(questions.length > 0 || isLoading) && (
                        <QuizPanel
                          questions={questions}
                          isLoading={loadingType === 'quiz'}
                          userRole={user.role}
                          userRoom={user?.room}
                          hasSubmitted={activeAssignment ? !!activeSubmission : false}
                          onScoreSubmit={handleScoreSubmit}
                          previousScoreInfo={activeSubmission ? { score: activeSubmission.score, scale10Score: activeSubmission.scale10Score } : undefined}
                          onAssignQuiz={handleAssignQuiz}
                        />
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* === TAB 4: ESSAY === */}
                {(isTeacher || activeAssignment?.type === 'essay') && (
                  <TabsContent value="essay" className="mt-0 outline-none">
                    <EssayPanel
                      essay={activeAssignment ? (activeAssignment.essay || '') : essay}
                      isLoading={loadingType === 'essay'}
                      onGenerate={(metadata) => handleGenerateEssay(essay ? true : false, metadata)}
                      userRole={user.role}
                      userRoom={user?.room}
                      onAssignEssay={handleAssignEssay}
                      fileName={activeDoc?.fileName || ''}

                      // Student submission props
                      hasSubmitted={activeAssignment ? !!activeSubmission : false}
                      onEssaySubmit={handleEssaySubmit}
                      previousSubmission={activeSubmission}
                      canTake={activeAssignment ? canTakeActiveAssignment : true}
                      timeMessage={activeTimeMsg}
                      isGrading={loadingType === 'grading-essay'}
                    />
                  </TabsContent>
                )}

                </motion.div>
                </AnimatePresence>
                  </Tabs>
                </div>
              </div>
            ) : (
              /* === EMPTY STATE (Chưa chọn tài liệu hoặc bài ôn thi) === */
              <div className="space-y-6">

                {/* 1. Kho đề thi được giao & Thống kê học tập dành riêng cho học sinh */}
                {!isTeacher && (
                  <div className="space-y-6 animate-fade-in-up">

                    {/* Thẻ Thống kê học tập chi tiết */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="p-4 border-0 shadow-md bg-gradient-to-br from-blue-500/10 to-indigo-500/5 dark:from-blue-950/40 dark:to-indigo-950/20 backdrop-blur-sm flex flex-col justify-between min-h-[90px]">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">GPA Trung Bình</span>
                        <span className="text-2xl font-black text-blue-800 dark:text-blue-300 mt-2">{studentAverageScore} / 10</span>
                      </Card>
                      <Card className="p-4 border-0 shadow-md bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/40 dark:to-teal-950/20 backdrop-blur-sm flex flex-col justify-between min-h-[90px]">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Bài Đã Hoàn Thành</span>
                        <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-2">{studentTotalDone} bài</span>
                      </Card>
                      <Card className="p-4 border-0 shadow-md bg-gradient-to-br from-purple-500/10 to-pink-500/5 dark:from-purple-950/40 dark:to-pink-950/20 backdrop-blur-sm flex flex-col justify-between min-h-[90px]">
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Điểm Cao Nhất</span>
                        <span className="text-2xl font-black text-purple-800 dark:text-purple-300 mt-2">{studentMaxScore} / 10</span>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-indigo-500" />
                        ✍️ Đề kiểm tra lớp {user.room} đã giao
                      </h3>

                      {roomAssignments.length === 0 ? (
                        <Card className="p-8 text-center text-gray-400 text-xs bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/60">
                          Lớp học chưa có bài kiểm tra trắc nghiệm nào được giao.
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {roomAssignments.map((asm) => {
                            const submission = quizHistory.find(h => h.assignmentId === asm.id && h.username === user.username);
                            const hasSubmitted = !!submission;

                            const now = new Date();
                            const start = new Date(asm.startTime);
                            const end = new Date(asm.endTime);

                            let statusText = '';
                            let statusColor = '';
                            if (now < start) {
                              statusText = 'Chưa diễn ra';
                              statusColor = 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
                            } else if (now > end) {
                              statusText = 'Đã kết thúc';
                              statusColor = 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400';
                            } else {
                              statusText = 'Đang mở';
                              statusColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
                            }

                            return (
                              <Card key={asm.id} className="p-5 border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col justify-between hover:shadow-lg transition-all duration-200">
                                <div>
                                  <div className="flex justify-between items-start gap-2">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColor}`}>
                                      {statusText}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                      {asm.type === 'quiz' ? '📝 Trắc nghiệm' : '✏️ Tự luận'}
                                    </span>
                                  </div>

                                  <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm mt-3 line-clamp-2 leading-snug">
                                    {asm.title}
                                  </h4>
                                  <p className="text-[10px] text-gray-400 truncate mt-1">
                                    📄 Tài liệu: {asm.fileName}
                                  </p>

                                  <div className="mt-4 text-[10px] text-gray-400 space-y-0.5 leading-relaxed bg-gray-50/50 dark:bg-gray-950/40 p-2 rounded-lg">
                                    <p>• Bắt đầu: {start.toLocaleString('vi-VN')}</p>
                                    <p>• Kết thúc: {end.toLocaleString('vi-VN')}</p>
                                  </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                                  {hasSubmitted ? (
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
                                      Điểm thi: {submission.scale10Score}/10
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-amber-500 font-semibold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">
                                      Chưa làm bài
                                    </span>
                                  )}

                                  <Button
                                    onClick={() => handleSelectAssignment(asm)}
                                    disabled={now < start}
                                    className={`text-[11px] h-8 px-4 rounded-lg font-bold transition-all ${now < start
                                        ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/10'
                                      }`}
                                  >
                                    {hasSubmitted ? 'Xem lại bài' : (now > end ? 'Xem đáp án' : 'Làm bài thi')}
                                  </Button>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Quản lý bài kiểm tra đã giao & Bảng điểm lớp dành riêng cho Giáo viên */}
                {isTeacher && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-indigo-500" />
                          📊 Bảng quản lý đề thi & Điểm số học sinh
                        </h3>
                        
                        <select
                          value={dashboardClass}
                          onChange={(e) => setDashboardClass(e.target.value)}
                          className="h-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 dark:text-indigo-400"
                        >
                          <option value="Lớp trống">Lớp trống</option>
                          {CLASSES.map((cls) => (
                            <option key={cls} value={cls}>Lớp {cls}</option>
                          ))}
                        </select>
                      </div>
                      <Button
                        onClick={fetchHistory}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs rounded-xl border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-1.5 font-semibold"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Làm mới điểm số
                      </Button>
                    </div>

                    {(() => {
                      // Tính toán thống kê tổng hợp theo lớp đang chọn
                      const classHistory = quizHistory.filter(h => h.roomId === dashboardClass);
                      const totalClassSubmissions = classHistory.length;
                      const passCount = classHistory.filter(h => parseFloat(h.scale10Score) >= 5.0).length;
                      const retakeCount = classHistory.filter(h => {
                        const s = parseFloat(h.scale10Score);
                        return s >= 3.0 && s < 5.0;
                      }).length;
                      const failCount = classHistory.filter(h => parseFloat(h.scale10Score) < 3.0).length;
                      const passRate = totalClassSubmissions > 0 ? ((passCount / totalClassSubmissions) * 100).toFixed(1) : '0.0';
                      const retakeRate = totalClassSubmissions > 0 ? ((retakeCount / totalClassSubmissions) * 100).toFixed(1) : '0.0';
                      const failRate = totalClassSubmissions > 0 ? ((failCount / totalClassSubmissions) * 100).toFixed(1) : '0.0';
                      const classAvgScore = totalClassSubmissions > 0
                        ? (classHistory.reduce((acc, h) => acc + parseFloat(h.scale10Score), 0) / totalClassSubmissions).toFixed(1)
                        : '0.0';

                      return (
                        <>
                          {/* Thống kê tổng hợp theo lớp */}
                          {totalClassSubmissions > 0 && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* Card: Tổng bài nộp */}
                                <div className="p-4 bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Tổng bài nộp</span>
                                  <span className="text-2xl font-black text-indigo-800 dark:text-indigo-300 mt-1">{totalClassSubmissions}</span>
                                  <span className="text-[10px] text-gray-400 mt-0.5">TB: {classAvgScore}/10</span>
                                </div>

                                {/* Card: Đạt */}
                                <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/20 rounded-xl shadow-md border border-emerald-100/60 dark:border-emerald-900/50 flex flex-col items-center justify-center text-center">
                                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">✅ Đạt (≥5.0)</span>
                                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{passCount}</span>
                                  <span className="text-[10px] text-emerald-500 dark:text-emerald-400 mt-0.5 font-bold">{passRate}%</span>
                                </div>

                                {/* Card: Thi lại */}
                                <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 rounded-xl shadow-md border border-amber-100/60 dark:border-amber-900/50 flex flex-col items-center justify-center text-center">
                                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">⚠️ Thi lại (3-5)</span>
                                  <span className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{retakeCount}</span>
                                  <span className="text-[10px] text-amber-500 dark:text-amber-400 mt-0.5 font-bold">{retakeRate}%</span>
                                </div>

                                {/* Card: Học lại */}
                                <div className="p-4 bg-red-50/80 dark:bg-red-950/20 rounded-xl shadow-md border border-red-100/60 dark:border-red-900/50 flex flex-col items-center justify-center text-center">
                                  <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">❌ Học lại ({'<'}3)</span>
                                  <span className="text-2xl font-black text-red-700 dark:text-red-300 mt-1">{failCount}</span>
                                  <span className="text-[10px] text-red-500 dark:text-red-400 mt-0.5 font-bold">{failRate}%</span>
                                </div>
                              </div>

                              {/* Progress Bar tỉ lệ xếp loại */}
                              <div className="bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">📊 Phân bố xếp loại lớp {dashboardClass}</p>
                                <div className="w-full h-5 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
                                  {parseFloat(passRate) > 0 && (
                                    <div
                                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500"
                                      style={{ width: `${passRate}%` }}
                                      title={`Đạt: ${passRate}%`}
                                    >
                                      {parseFloat(passRate) >= 12 ? `${passRate}%` : ''}
                                    </div>
                                  )}
                                  {parseFloat(retakeRate) > 0 && (
                                    <div
                                      className="bg-gradient-to-r from-amber-500 to-amber-400 h-full flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500"
                                      style={{ width: `${retakeRate}%` }}
                                      title={`Thi lại: ${retakeRate}%`}
                                    >
                                      {parseFloat(retakeRate) >= 12 ? `${retakeRate}%` : ''}
                                    </div>
                                  )}
                                  {parseFloat(failRate) > 0 && (
                                    <div
                                      className="bg-gradient-to-r from-red-500 to-red-400 h-full flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500"
                                      style={{ width: `${failRate}%` }}
                                      title={`Học lại: ${failRate}%`}
                                    >
                                      {parseFloat(failRate) >= 12 ? `${failRate}%` : ''}
                                    </div>
                                  )}
                                </div>
                                <div className="flex justify-between mt-2 text-[9px] text-gray-400">
                                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Đạt</div>
                                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Thi lại</div>
                                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span> Học lại</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {teacherAssignments.length === 0 ? (
                      <Card className="p-8 text-center text-gray-400 text-xs bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/60">
                        Lớp {user?.room} chưa có đề kiểm tra nào được giao. Hãy tải lên tài liệu học tập PDF để tạo bài trắc nghiệm hoặc tự luận.
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 gap-5">
                        {teacherAssignments.map((asm) => {
                          const asmHistory = quizHistory.filter(h => h.assignmentId === asm.id);
                          const totalSubmissions = asmHistory.length;
                          const classAverage = totalSubmissions > 0
                            ? (asmHistory.reduce((acc, h) => acc + parseFloat(h.scale10Score), 0) / totalSubmissions).toFixed(1)
                            : null;

                          const now = new Date();
                          const start = new Date(asm.startTime);
                          const end = new Date(asm.endTime);

                          let statusText = '';
                          let statusColor = '';
                          if (now < start) {
                            statusText = 'Chưa diễn ra';
                            statusColor = 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
                          } else if (now > end) {
                            statusText = 'Đã kết thúc';
                            statusColor = 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400';
                          } else {
                            statusText = 'Đang mở';
                            statusColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
                          }

                          const isQuiz = asm.type === 'quiz';

                          return (
                            <Card key={asm.id} className="border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all hover:shadow-xl duration-200 overflow-hidden">
                              {/* Header thẻ đề thi */}
                              <div className="p-5">
                                <div className="flex justify-between items-start gap-4 flex-wrap">
                                  <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColor}`}>
                                        {statusText}
                                      </span>
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${isQuiz ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
                                        }`}>
                                        {isQuiz ? '📝 Trắc nghiệm' : '✏️ Tự luận'}
                                      </span>
                                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                                        Lớp {asm.roomId}
                                      </span>
                                    </div>

                                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm mt-2 leading-snug truncate">
                                      {asm.title}
                                    </h4>
                                    <p className="text-[10px] text-gray-400 truncate">
                                      📄 Tài liệu: {asm.fileName}
                                    </p>

                                    <div className="text-[10px] text-gray-400 space-y-0.5 leading-relaxed bg-gray-50/60 dark:bg-gray-950/40 p-2 rounded-lg mt-1">
                                      <p>• Bắt đầu: {start.toLocaleString('vi-VN')}</p>
                                      <p>• Kết thúc: {end.toLocaleString('vi-VN')}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-2 shrink-0">
                                    {/* Hộp thống kê điểm nhanh */}
                                    <div className={`text-right p-3 rounded-xl border min-w-[130px] ${isQuiz
                                        ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100/60 dark:border-indigo-900/50'
                                        : 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-100/60 dark:border-purple-900/50'
                                      }`}>
                                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Đã nộp bài</p>
                                      <p className={`text-xl font-black mt-0.5 ${isQuiz ? 'text-indigo-700 dark:text-indigo-300' : 'text-purple-700 dark:text-purple-300'}`}>
                                        {totalSubmissions} <span className="text-xs font-semibold text-gray-400">học sinh</span>
                                      </p>
                                      {isQuiz && classAverage !== null && (
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                                          TB: {classAverage}/10
                                        </p>
                                      )}
                                    </div>

                                    <Button
                                      onClick={() => handleDeleteAssignment(asm.id)}
                                      variant="ghost"
                                      size="sm"
                                      className="text-[10px] h-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg font-bold border border-red-200/50 dark:border-red-900/50"
                                    >
                                      🗑️ Hủy & Xóa đề
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Bảng điểm học sinh - luôn hiển thị */}
                              <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-950/20">
                                <div className="px-5 py-3">
                                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    📋 Bảng điểm học sinh nộp bài
                                    <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold ${totalSubmissions > 0
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                      }`}>
                                      {totalSubmissions} đã nộp
                                    </span>
                                  </p>

                                  {asmHistory.length > 0 ? (
                                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                                      <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                                        <thead>
                                          <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                                            <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Học sinh</th>
                                            <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Điểm số</th>
                                            <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Xếp loại</th>
                                            {isQuiz ? (
                                              <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Số câu đúng</th>
                                            ) : (
                                              <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bài làm</th>
                                            )}
                                            <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thời gian nộp</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                                          {asmHistory.map((h, hIdx) => {
                                            const scoreNum = parseFloat(h.scale10Score);
                                            const scoreColor = scoreNum >= 8
                                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                                              : scoreNum >= 5
                                                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                                                : 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/50';

                                            // Xếp loại: Đạt / Thi lại / Học lại
                                            let classifyLabel = '';
                                            let classifyColor = '';
                                            if (scoreNum >= 5.0) {
                                              classifyLabel = '✅ Đạt';
                                              classifyColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50';
                                            } else if (scoreNum >= 3.0) {
                                              classifyLabel = '⚠️ Thi lại';
                                              classifyColor = 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50';
                                            } else {
                                              classifyLabel = '❌ Học lại';
                                              classifyColor = 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50';
                                            }

                                            return (
                                              <tr key={hIdx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                                <td className="py-2.5 px-4 font-semibold text-gray-800 dark:text-gray-200">
                                                  👤 {h.fullName || h.username || '(ẩn danh)'}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                  <span className={`font-bold px-2 py-0.5 rounded-lg text-[11px] ${scoreColor}`}>
                                                    {h.scale10Score}/10
                                                  </span>
                                                </td>
                                                <td className="py-2.5 px-4">
                                                  <span className={`font-bold px-2 py-0.5 rounded-lg text-[10px] ${classifyColor}`}>
                                                    {classifyLabel}
                                                  </span>
                                                </td>
                                                {isQuiz ? (
                                                  <td className="py-2.5 px-4 text-gray-500 dark:text-gray-400">
                                                    {h.score}/{h.totalQuestions} câu
                                                  </td>
                                                ) : (
                                                  <td className="py-2.5 px-4">
                                                    <Button
                                                      onClick={() => setSelectedEssaySubmission(h)}
                                                      variant="outline"
                                                      size="sm"
                                                      className="h-7 text-[10px] px-2 rounded-lg border-purple-200 dark:border-purple-900 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 font-semibold"
                                                    >
                                                      Xem bài làm & Nhận xét
                                                    </Button>
                                                  </td>
                                                )}
                                                <td className="py-2.5 px-4 text-gray-400 text-[10px]">
                                                  {new Date(h.submittedAt).toLocaleString('vi-VN')}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                        {totalSubmissions > 1 && classAverage !== null && (
                                          <tfoot>
                                            <tr className="bg-indigo-50/40 dark:bg-indigo-950/10 border-t border-indigo-100/50 dark:border-indigo-900/50">
                                              <td className="py-2 px-4 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider" colSpan={2}>
                                                Điểm trung bình
                                              </td>
                                              <td className="py-2 px-4" colSpan={3}>
                                                <span className="font-black text-sm text-indigo-700 dark:text-indigo-300">
                                                  {classAverage}/10
                                                </span>
                                              </td>
                                            </tr>
                                          </tfoot>
                                        )}
                                      </table>

                                      {/* Mini progress bar cho từng đề thi */}
                                      {totalSubmissions > 0 && (() => {
                                        const asmPass = asmHistory.filter(h => parseFloat(h.scale10Score) >= 5.0).length;
                                        const asmRetake = asmHistory.filter(h => { const s = parseFloat(h.scale10Score); return s >= 3.0 && s < 5.0; }).length;
                                        const asmFail = asmHistory.filter(h => parseFloat(h.scale10Score) < 3.0).length;
                                        const pPct = ((asmPass / totalSubmissions) * 100).toFixed(0);
                                        const rPct = ((asmRetake / totalSubmissions) * 100).toFixed(0);
                                        const fPct = ((asmFail / totalSubmissions) * 100).toFixed(0);
                                        return (
                                          <div className="mt-3 px-1">
                                            <div className="flex items-center gap-2 text-[9px] text-gray-400 mb-1">
                                              <span>Đạt: <strong className="text-emerald-600 dark:text-emerald-400">{asmPass}</strong></span>
                                              <span>Thi lại: <strong className="text-amber-600 dark:text-amber-400">{asmRetake}</strong></span>
                                              <span>Học lại: <strong className="text-red-500 dark:text-red-400">{asmFail}</strong></span>
                                            </div>
                                            <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
                                              {parseInt(pPct) > 0 && <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pPct}%` }}></div>}
                                              {parseInt(rPct) > 0 && <div className="bg-amber-500 h-full transition-all" style={{ width: `${rPct}%` }}></div>}
                                              {parseInt(fPct) > 0 && <div className="bg-red-500 h-full transition-all" style={{ width: `${fPct}%` }}></div>}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/30">
                                      <span className="text-2xl mb-2">🕐</span>
                                      <p className="text-xs text-gray-400 font-medium">Chưa có học sinh nào nộp bài</p>
                                      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">Bấm &quot;Làm mới điểm số&quot; để cập nhật</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Empty State giới thiệu chung về hệ thống */}
                <div className="p-16 text-center bg-white/70 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-md border border-gray-100 dark:border-gray-800/50 flex flex-col items-center justify-center min-h-[350px]">
                  <div className="w-24 h-24 mb-5 rounded-3xl overflow-hidden hover:scale-105 transition-all duration-300 shadow-md border border-white/20 dark:border-gray-800/30 p-1 bg-white dark:bg-gray-900">
                    <Image src="/logo.png" alt="AI Study Assistant Logo" width={96} height={96} className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Chào mừng đến với AI Study Assistant!
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed mb-6">
                    {isTeacher
                      ? "Bạn vui lòng tải lên tài liệu mới (PDF/Word) ở cột bên trái hoặc lựa chọn một tệp đã lưu trong Thư viện bài giảng để soạn bài."
                      : "Bạn có thể tự upload tài liệu học tập cá nhân ở trên để tóm tắt & chat với AI, hoặc chọn làm các bài kiểm tra được giao phía trên để luyện tập."
                    }
                  </p>
                  <div className="flex gap-3 flex-wrap justify-center">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 animate-fade-in-up">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Tóm tắt tự động
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 animate-fade-in-up [animation-delay:0.1s]">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Chat hỏi đáp PDF
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 animate-fade-in-up [animation-delay:0.2s]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Ôn luyện trắc nghiệm AI
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== OVERLAY MODAL: XEM CHI TIẾT BÀI LÀM TỰ LUẬN DÀNH CHO GIÁO VIÊN ===== */}
      {selectedEssaySubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-300" />
                  Bài làm tự luận & Nhận xét của AI
                </h3>
                <p className="text-purple-100 text-xs mt-0.5">
                  Học sinh: <span className="font-bold">{selectedEssaySubmission.username}</span> |
                  Nộp lúc: {new Date(selectedEssaySubmission.submittedAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedEssaySubmission(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Scrollable grid */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Student's Answer */}
              <div className="space-y-3 flex flex-col min-h-0">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <FileText className="w-4 h-4 text-purple-500" />
                  Bài làm của học sinh
                </h4>
                <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-200/50 dark:border-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed overflow-y-auto min-h-[250px] md:min-h-[400px]">
                  {selectedEssaySubmission.studentAnswer}
                </div>
              </div>

              {/* Right Column: AI Feedback & Score */}
              <div className="space-y-3 flex flex-col min-h-0">
                <div className="flex justify-between items-center shrink-0">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                    Nhận xét chi tiết của AI
                  </h4>
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-black border border-emerald-100 dark:border-emerald-900/50">
                    Điểm AI: {selectedEssaySubmission.scale10Score}/10
                  </span>
                </div>

                <div className="flex-1 p-4 bg-purple-50/30 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-900/50 rounded-xl overflow-y-auto min-h-[250px] md:min-h-[400px]
                  prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-gray-800 dark:prose-headings:text-gray-100
                  prose-h2:text-xs prose-h2:mt-3 prose-h2:mb-1.5 prose-h2:font-bold prose-h2:text-purple-700 dark:prose-h2:text-purple-400
                  prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-li:text-gray-600 dark:prose-li:text-gray-300
                  prose-strong:text-gray-800 dark:prose-strong:text-gray-100
                  prose-ul:space-y-0.5
                ">
                  <ReactMarkdown>{selectedEssaySubmission.aiFeedback || ''}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/20 flex justify-end shrink-0">
              <Button
                onClick={() => setSelectedEssaySubmission(null)}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs h-9 px-6 font-semibold shadow-md shadow-purple-500/20"
              >
                Đóng phản hồi
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
