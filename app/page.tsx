// app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Award, 
  Users, 
  LogOut,
  UploadCloud,
  Library,
  Settings,
  HelpCircle,
  Menu,
  X,
  TrendingUp,
  Search,
  Plus,
  MessageSquare,
  Lock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useCompletion } from 'ai/react';
import { motion, AnimatePresence } from 'framer-motion';

// Static imports - light, always visible
import ThemeToggle from '@/components/ThemeToggle';
import AccessibilitySettings from '@/components/AccessibilitySettings';
import AuthScreen from '@/components/AuthScreen';

// Dynamic imports - heavy, deferred loading
const FileUpload = dynamic(() => import('@/components/FileUpload'), { ssr: false });
const SummaryPanel = dynamic(() => import('@/components/SummaryPanel'), { ssr: false });
const ChatBox = dynamic(() => import('@/components/ChatBox'), { ssr: false });
const QuizPanel = dynamic(() => import('@/components/QuizPanel'), { ssr: false });
const EssayPanel = dynamic(() => import('@/components/EssayPanel'), { ssr: false });
const DocumentLibrary = dynamic(() => import('@/components/DocumentLibrary'), { ssr: false });
const UserManagement = dynamic(() => import('@/components/UserManagement'), { ssr: false });

import { FileInfo, QuizQuestion, User, Assignment, QuizHistoryItem, DocumentItem, ChatMessage } from '@/types';

// List of official classes
const CLASSES = ['64CTT1', '64CTT2', '64CTT3', '64CTT4', '64CTT5'];

// Bilingual Dictionary
const TRANSLATIONS = {
  vi: {
    dashboardTitle: "Bảng Phân Tích Lớp Học",
    studentDashboardTitle: "Bảng Điểm & Ôn Luyện Cá Nhân",
    realtimeAnalytics: "Phân tích học tập thời gian thực cho lớp",
    studentRealtimeAnalytics: "Thông tin ôn luyện và điểm số của học sinh",
    totalSubmissions: "Tổng bài nộp",
    passed: "Đạt (≥5.0)",
    retest: "Thi lại (3-5)",
    failed: "Học lại (<3)",
    avgScore: "Trung bình",
    gpa: "GPA TRUNG BÌNH",
    completedTests: "BÀI ĐÃ HOÀN THÀNH",
    highestScore: "ĐIỂM CAO NHẤT",
    assignedTests: "Đề kiểm tra lớp {room} đã giao",
    noTestsAssigned: "Lớp học {room} hiện chưa có bài kiểm tra nào được giao.",
    newDocument: "Tài liệu mới",
    uploadMaterials: "Tải lên tài liệu",
    documentLibrary: "Thư viện bài giảng",
    dashboard: "Trang chủ & Phân tích",
    settings: "Cài đặt tài khoản",
    helpCenter: "Trung tâm trợ giúp",
    searchLibrary: "Tìm kiếm thư viện...",
    welcomeTitle: "Chào mừng đến với AI Study Assistant!",
    welcomeSubtitleTeacher: "Hệ thống hỗ trợ soạn đề kiểm tra trắc nghiệm & tự luận tự động bằng trí tuệ nhân tạo. Hãy tải tài liệu mới lên hoặc sử dụng thư viện bài giảng để bắt đầu.",
    welcomeSubtitleStudent: "Tự học ôn tập hiệu quả với trợ lý AI. Bạn có thể tự tải lên tài liệu học tập của mình ở cột bên trái để tóm tắt và làm bài kiểm tra thử do AI soạn!",
    autoSummary: "Tóm tắt tự động",
    pdfChat: "Chat hỏi đáp PDF",
    aiQuiz: "Trắc nghiệm AI",
    recalculateScores: "Tính toán lại điểm",
    classManage: "Quản lý lớp",
    logout: "Đăng xuất",
    activeWorkspace: "Không gian làm việc",
    savedLibrary: "Đã lưu thư viện",
    closeWorkspace: "✕ Đóng Workspace",
    originalDoc: "Tài liệu gốc",
    docSummary: "Tóm tắt tài liệu",
    chatWithAi: "Chat với AI",
    practiceQuiz: "Bài tập trắc nghiệm",
    practiceEssay: "Bài tập tự luận",
    notSummarized: "Tài liệu chưa được tóm tắt",
    notSummarizedDesc: "AI sẽ phân tích văn bản để giúp bạn nắm bắt ý chính nhanh chóng.",
    createSummary: "Tạo bản tóm tắt bài giảng",
    noQuizGenerated: "Tự luyện trắc nghiệm",
    noQuizGeneratedDesc: "AI sẽ tự động thiết kế đề thi gồm 5 câu trắc nghiệm bám sát bài học để bạn tự làm.",
    startQuizPractice: "Bắt đầu ôn tập trắc nghiệm",
    otherQuiz: "Làm đề thi khác",
    classSelect: "Lớp {cls}",
    retestLabel: "Thi lại",
    passLabel: "Đạt",
    failLabel: "Học lại",
    notTaken: "Chưa làm bài",
    startTest: "Làm bài thi",
    reviewTest: "Xem lại bài",
    viewKey: "Xem đáp án",
    essayFeedbackTitle: "Bài làm tự luận & Nhận xét của AI",
    submittedAt: "Nộp lúc",
    aiFeedbackDetail: "Nhận xét chi tiết của AI",
    studentAnswer: "Bài làm của học sinh",
    points: "Điểm AI",
    closeFeedback: "Đóng phản hồi",
    systemSettings: "Cài đặt hệ thống",
    username: "Tên đăng nhập",
    role: "Vai trò",
    room: "Lớp học / Phòng",
    teacherRole: "Giáo viên 👩‍🏫",
    studentRole: "Học sinh 👨‍🎓",
    unassigned: "Chưa phân lớp",
    numQuestions: "SỐ CÂU HỎI",
    regenerateQuiz: "Soạn lại đề mới (AI)",
    generateQuiz: "Soạn trắc nghiệm (AI)",
    gradingEssay: "Đang chấm bài...",
    guidelineTitle: "Hướng dẫn nhanh",
    guidelineDesc: "Tải lên các tài liệu PDF/Word bài giảng của bạn. AI sẽ phân tích nội dung, cho phép bạn tự tạo câu hỏi trắc nghiệm, đề tự luận, tóm tắt bài giảng và thảo luận trực tiếp với AI.",
    gradeDistribution: "Phân bố xếp loại lớp",
    gpaScore: "GPA: {score}/10",
    completedCount: "{count} bài",
    highestScoreScore: "{score}/10",
    passRate: "Đạt",
    retestRate: "Thi lại",
    failRate: "Học lại",
    assignedExams: "Bài kiểm tra lớp {room}",
    languageAlert: "Đã chuyển đổi sang Tiếng Việt!",
    helpCenterAlert: "Trung tâm trợ giúp đang được xây dựng!",
    syncDone: "Đã đồng bộ dữ liệu mới nhất!",
    teacher: "Giáo viên",
    student: "Học sinh",
    scoreListTitle: "Lịch sử điểm số ôn luyện",
    noScoresYet: "Chưa có điểm trắc nghiệm nào.",
    noStudentDocs: "Thư viện chưa có tài liệu nào.",
    classHistoryTableHead: "Bảng điểm học sinh nộp bài",
    historyTableHeadName: "Học sinh",
    historyTableHeadScore: "Điểm số",
    historyTableHeadClassify: "Xếp loại",
    historyTableHeadDetails: "Bài làm / Số câu",
    historyTableHeadTime: "Thời gian nộp",
    classAvgFoot: "Điểm trung bình lớp",
    submittedClass: "đã nộp",
    deleteAssign: "Hủy & Xóa đề",
    noSubmissionsYet: "Chưa có học sinh nào nộp bài",
    noSubmissionsYetDesc: "Bấm nút Tính toán lại điểm để cập nhật",
    aiChatSidebar: "Trò chuyện AI",
    clearChatHistory: "Xóa lịch sử chat"
  },
  en: {
    dashboardTitle: "Class Performance Dashboard",
    studentDashboardTitle: "Grades & Personal Practice",
    realtimeAnalytics: "Real-time academic rigor analytics for class",
    studentRealtimeAnalytics: "Academic grades and practice info for student",
    totalSubmissions: "Total Submissions",
    passed: "Passed (≥5.0)",
    retest: "Retest (3-5)",
    failed: "Failed (<3)",
    avgScore: "Average",
    gpa: "GPA AVERAGE",
    completedTests: "COMPLETED TESTS",
    highestScore: "HIGHEST SCORE",
    assignedTests: "Assigned class {room} exams",
    noTestsAssigned: "No exams have been assigned to class {room} yet.",
    newDocument: "New Document",
    uploadMaterials: "Upload Materials",
    documentLibrary: "Document Library",
    dashboard: "Dashboard & Analytics",
    settings: "Settings",
    helpCenter: "Help Center",
    searchLibrary: "Search library...",
    welcomeTitle: "Welcome to AI Study Assistant!",
    welcomeSubtitleTeacher: "AI-powered automated generation of quizzes & essays. Upload new documents or select from the lecture library to begin.",
    welcomeSubtitleStudent: "Study efficiently with AI. Upload your personal documents on the left to summarize and take mock quizzes designed by AI!",
    autoSummary: "Auto Summary",
    pdfChat: "PDF Q&A Chat",
    aiQuiz: "AI Quiz Practice",
    recalculateScores: "Recalculate Scores",
    classManage: "Class Management",
    logout: "Log Out",
    activeWorkspace: "Workspace Active",
    savedLibrary: "Saved to Library",
    closeWorkspace: "✕ Close Workspace",
    originalDoc: "Original Doc",
    docSummary: "Doc Summary",
    chatWithAi: "Chat with AI",
    practiceQuiz: "Practice Quiz",
    practiceEssay: "Practice Essay",
    notSummarized: "No Summary Available",
    notSummarizedDesc: "AI will analyze the document to help you grasp main ideas quickly.",
    createSummary: "Generate Summary",
    noQuizGenerated: "Quiz Practice",
    noQuizGeneratedDesc: "AI will generate a 5-question practice quiz based on the document.",
    startQuizPractice: "Start Quiz Practice",
    otherQuiz: "Try Another Quiz",
    classSelect: "Class {cls}",
    retestLabel: "Retest",
    passLabel: "Pass",
    failLabel: "Fail",
    notTaken: "Not Taken",
    startTest: "Take Exam",
    reviewTest: "Review Exam",
    viewKey: "View Answer key",
    essayFeedbackTitle: "Essay Submission & AI Feedback",
    submittedAt: "Submitted at",
    aiFeedbackDetail: "Detailed AI Feedback",
    studentAnswer: "Student Response",
    points: "AI Score",
    closeFeedback: "Close Feedback",
    systemSettings: "System Settings",
    username: "Username",
    role: "Role",
    room: "Class Room",
    teacherRole: "Teacher 👩‍🏫",
    studentRole: "Student 👨‍🎓",
    unassigned: "Unassigned",
    numQuestions: "QUESTIONS",
    regenerateQuiz: "Regenerate Quiz (AI)",
    generateQuiz: "Generate Quiz (AI)",
    gradingEssay: "Grading essay...",
    guidelineTitle: "Quick Guide",
    guidelineDesc: "Upload your PDF/Word documents. AI will analyze the text, allowing you to generate quiz questions, essays, summaries, and chat directly with AI.",
    gradeDistribution: "Grade Distribution",
    gpaScore: "GPA: {score}/10",
    completedCount: "{count} tests",
    highestScoreScore: "{score}/10",
    passRate: "Pass",
    retestRate: "Retest",
    failRate: "Fail",
    assignedExams: "Class {room} Exams",
    languageAlert: "Language switched to English!",
    helpCenterAlert: "Help Center is under construction!",
    syncDone: "Data synced successfully!",
    teacher: "Teacher",
    student: "Student",
    scoreListTitle: "Score Practice History",
    noScoresYet: "No quiz scores submitted yet.",
    noStudentDocs: "No documents available in library.",
    classHistoryTableHead: "Student Submission Scores Table",
    historyTableHeadName: "Student",
    historyTableHeadScore: "Score",
    historyTableHeadClassify: "Rating",
    historyTableHeadDetails: "Details / Questions",
    historyTableHeadTime: "Submitted At",
    classAvgFoot: "Class Avg Score",
    submittedClass: "submitted",
    deleteAssign: "Delete & Cancel Exam",
    noSubmissionsYet: "No students have submitted this exam yet",
    noSubmissionsYetDesc: "Click Recalculate Scores to sync updates",
    aiChatSidebar: "AI Chat",
    clearChatHistory: "Clear Chat History"
  }
};

export default function Home() {
  // === STATE ===
  const [user, setUser] = useState<User | null>(null);
  
  // Ref for Tab Focus Sync
  const lastFetchTimeRef = useRef<number>(0);

  // Active document opened from personal library
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  // Assignment selected by student from class list
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);

  // Document list in library
  const [libraryDocs, setLibraryDocs] = useState<DocumentItem[]>([]);

  // Workspace States
  const [pdfText, setPdfText] = useState('');
  const [, setFileInfo] = useState<FileInfo | null>(null);
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [essay, setEssay] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Assignments & History
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);

  // Redesign Navigation States
  const [sidebarTab, setSidebarTab] = useState<'dashboard' | 'upload' | 'library' | 'settings' | 'chat'>('dashboard');
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // General Chat History State & Reset Counter
  const [generalChatHistory, setGeneralChatHistory] = useState<ChatMessage[]>([]);
  const [chatResetCount, setChatResetCount] = useState(0);

  // Class Management States
  const [classList, setClassList] = useState<Array<{ code: string; name: string; teacherUsername: string }>>([]);
  const [joinClassCode, setJoinClassCode] = useState('');
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showJoinClassModal, setShowJoinClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [createdClassCode, setCreatedClassCode] = useState('');

  // Password Change States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Language State (VI/EN)
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');

  // Streaming for summary
  const { completion: streamingSummary, complete: startStreamingSummary, isLoading: isSummaryStreaming, setCompletion: setStreamingSummary } = useCompletion({
    api: '/api/summarize',
    onFinish: async (prompt: string, result: string) => {
      if (activeDoc) {
        await updateDocumentOnServer(activeDoc.id, { summary: result });
        setSummary(result);
        showMessage(t.syncDone, false);
        setLoadingType(null);
      }
    },
    onError: (err: Error) => {
      showMessage(err.message || 'Lỗi tóm tắt');
      setLoadingType(null);
    }
  });

  // Selected essay details (Teacher only)
  const [selectedEssaySubmission, setSelectedEssaySubmission] = useState<QuizHistoryItem | null>(null);
  const [selectedQuizSubmission, setSelectedQuizSubmission] = useState<QuizHistoryItem | null>(null);

  // Class selected by teacher on dashboard
  const [dashboardClass, setDashboardClass] = useState<string>('64CTT1');

  // UI States
  const [activeTab, setActiveTab] = useState('summary');

  // Load active translations
  const t = TRANSLATIONS[language];

  // Restore tab on desktop resize when activeTab is document (mobile only tab)
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

  // Role helper
  const isTeacher = user?.role === 'teacher';

  // Mouse move blurs effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const blurs = document.querySelectorAll('.blur-decor');
      const x = (window.innerWidth / 2 - e.clientX) / 40;
      const y = (window.innerHeight / 2 - e.clientY) / 40;
      
      blurs.forEach((blur) => {
        (blur as HTMLElement).style.transform = `translate(${x}px, ${y}px)`;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 1. Sync activeDoc to workspace states when doc changes
  useEffect(() => {
    if (activeDoc) {
      setActiveAssignment(null); // Deselect assignment
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

  // 2. Sync activeAssignment to workspace states when assignment selected
  useEffect(() => {
    if (activeAssignment) {
      setActiveDoc(null); // Deselect document
      setPdfText(activeAssignment.pdfText);
      setFileInfo({
        fileName: activeAssignment.fileName,
        fileSize: 0,
        pages: Math.max(1, Math.ceil(activeAssignment.pdfText.length / 3000)),
        textLength: activeAssignment.pdfText.length
      });
      setQuestions(activeAssignment.questions || []);
      setEssay(activeAssignment.essay || '');
      setSummary('');
      setChatHistory([]);
      
      // Navigate to correct tab
      setActiveTab(activeAssignment.type === 'quiz' ? 'quiz' : 'essay');
    }
  }, [activeAssignment]);

  // Load public documents
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

  // Restore session & settings
  useEffect(() => {
    setIsMounted(true);
    const savedUser = localStorage.getItem('user');
    const savedAssignments = localStorage.getItem('assignments');
    const savedHistory = localStorage.getItem('quizHistory');
    const savedLibraryDocs = localStorage.getItem('libraryDocs');
    const savedLanguage = localStorage.getItem('language') as 'vi' | 'en';

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    if (savedAssignments) {
      try { setAssignments(JSON.parse(savedAssignments)); } catch { }
    }
    if (savedHistory) {
      try { setQuizHistory(JSON.parse(savedHistory)); } catch { }
    }
    if (savedLibraryDocs) {
      try { setLibraryDocs(JSON.parse(savedLibraryDocs)); } catch { }
    }
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes');
        if (res.ok) {
          const data = await res.json();
          setClassList(data);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách lớp học:', err);
      }
    };
    fetchClasses();

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        if (parsedUser.room) {
          const rooms = parsedUser.room.split(',').map(r => r.trim()).filter(Boolean);
          if (rooms.length > 0) setDashboardClass(rooms[0]);
        }
        loadLibraryDocuments();
      } catch { }
    }
  }, []);

  // Cập nhật lớp học mặc định khi danh sách lớp thay đổi hoặc giáo viên đăng nhập
  useEffect(() => {
    if (user && user.role === 'teacher' && classList.length > 0) {
      const myClasses = classList.filter(c => c.teacherUsername === user.username);
      if (myClasses.length > 0 && (!dashboardClass || !myClasses.some(c => c.code === dashboardClass))) {
        setDashboardClass(myClasses[0].code);
      }
    } else if (user && user.role === 'student' && user.room) {
      const rooms = user.room.split(',').map(r => r.trim()).filter(Boolean);
      if (rooms.length > 0 && !rooms.includes(dashboardClass)) {
        setDashboardClass(rooms[0]);
      }
    }
  }, [user, classList, dashboardClass]);

  // Fetch score history
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

  // Fetch assignments
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
    fetchHistory();
    loadLibraryDocuments();
  }, [user]);

  // Đồng bộ lịch sử trò chuyện AI chung theo từng user khi đăng nhập/đăng xuất
  useEffect(() => {
    if (user) {
      const savedChat = localStorage.getItem(`generalChatHistory_${user.username}`);
      setGeneralChatHistory(savedChat ? JSON.parse(savedChat) : []);
    } else {
      setGeneralChatHistory([]);
    }
  }, [user]);

  // Tab Focus Sync (auto sync backend data silently when tab becomes active)
  useEffect(() => {
    if (!user) return;
    
    lastFetchTimeRef.current = Date.now();

    const syncDataSilently = () => {
      const now = Date.now();
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

  const handleRefreshData = () => {
    if (!user) return;
    setLoadingType('refreshing');
    Promise.all([
      fetchAssignments(),
      fetchHistory(),
      loadLibraryDocuments()
    ]).finally(() => {
      setLoadingType(null);
      showMessage(t.syncDone, false);
    });
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    if (newUser.room) {
      const rooms = newUser.room.split(',').map(r => r.trim()).filter(Boolean);
      if (rooms.length > 0) setDashboardClass(rooms[0]);
    }
    localStorage.setItem('user', JSON.stringify(newUser));
    loadLibraryDocuments();
    setActiveDoc(null);
    setActiveAssignment(null);
    setSidebarTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setActiveDoc(null);
    setActiveAssignment(null);
    setLibraryDocs([]);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setChangePasswordError(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin.' : 'Please fill out all fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError(language === 'vi' ? 'Mật khẩu mới nhập lại không trùng khớp.' : 'Confirm password does not match.');
      return;
    }

    setIsChangingPassword(true);
    setChangePasswordError('');
    setChangePasswordSuccess('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'vi' ? 'Có lỗi xảy ra khi đổi mật khẩu.' : 'Failed to change password.'));
      }

      setChangePasswordSuccess(language === 'vi' ? 'Đổi mật khẩu thành công!' : 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setChangePasswordSuccess('');
      }, 1500);

    } catch (err: any) {
      setChangePasswordError(err.message || 'Lỗi kết nối.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const showMessage = (msg: string, isError = true) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const handleScoreSubmit = async (score: number, scale10Score: string, studentAnswers?: Record<number, string>, takenQuestions?: QuizQuestion[]) => {
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
      submittedAt: new Date().toISOString(),
      type: 'quiz',
      studentAnswer: studentAnswers ? JSON.stringify(studentAnswers) : undefined,
      questions: takenQuestions
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
    setSidebarTab('dashboard');
    showMessage(language === 'vi' ? `Đã nộp bài! Điểm của bạn là ${scale10Score}/10` : `Exam submitted! Your score is ${scale10Score}/10`, false);
  };

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
      setSidebarTab('dashboard');
      showMessage(language === 'vi' ? `Đã nộp bài tự luận! AI chấm bài làm của bạn là ${score.toFixed(1)}/10` : `Essay submitted! AI graded your response: ${score.toFixed(1)}/10`, false);
    } catch (err) {
      console.error('Lỗi khi nộp & chấm bài tự luận:', err);
      showMessage(err instanceof Error ? err.message : 'Lỗi chấm bài tự luận');
      throw err;
    } finally {
      setLoadingType(null);
    }
  };

  const handleDeleteAssignment = async (asmId: string) => {
    if (!user || !isTeacher) return;

    if (!confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa/hủy bài thi đã giao này? Học sinh sẽ không thể nhìn thấy bài thi này nữa.' : 'Are you sure you want to delete this assigned exam? Students will no longer be able to see it.')) {
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
      showMessage(language === 'vi' ? 'Đã xóa bài thi đã giao thành công!' : 'Assigned exam deleted successfully!', false);
    } catch (err) {
      console.error('Lỗi khi xóa bài thi:', err);
      showMessage('Không thể xóa bài thi.');
    }
  };

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

  const handleUploadSuccess = async (text: string, info: FileInfo, hash: string) => {
    if (!user) return;

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
        showMessage(language === 'vi' ? 'Tài liệu mới đã được chia sẻ lên thư viện công cộng thành công!' : 'New material uploaded and shared to public library!', false);
      } else {
        throw new Error('Lỗi server');
      }
    } catch (err) {
      console.error('Lỗi lưu tài liệu:', err);
      showMessage('Không thể lưu tài liệu vào thư viện dùng chung.');
    }
  };

  const handleExistingDocumentFound = async (doc: DocumentItem) => {
    if (!user) return;
    await updateDocumentOnServer(doc.id, { lastOpenedAt: new Date().toISOString() }, true);
    showMessage(language === 'vi' ? 'Tài liệu này đã tồn tại trong thư viện công cộng. Trình duyệt đã khôi phục dữ liệu đã lưu.' : 'This document already exists. Recovered saved data.', false);
  };

  const handleSelectDocument = async (doc: DocumentItem) => {
    await updateDocumentOnServer(doc.id, { lastOpenedAt: new Date().toISOString() }, true);
  };

  const handleSelectAssignment = (asm: Assignment) => {
    setActiveAssignment(asm);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!user) return;
    if (!confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa tài liệu này khỏi thư viện công cộng? Học sinh và giáo viên khác sẽ không thể nhìn thấy tài liệu này nữa.' : 'Are you sure you want to delete this document from the public library?')) {
      return;
    }
    const docToDelete = libraryDocs.find(d => d.id === docId);
    const updatedDocs = libraryDocs.filter(d => d.id !== docId);
    
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDocs)
      });
      
      if (res.ok) {
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
        showMessage(language === 'vi' ? 'Đã xóa tài liệu khỏi thư viện công cộng.' : 'Deleted document from library.', false);
      } else {
        throw new Error('Lỗi server');
      }
    } catch (err) {
      console.error('Lỗi khi xóa tài liệu:', err);
      showMessage('Không thể xóa tài liệu.');
    }
  };

  const handleSummarize = async (forceRegenerate = false) => {
    if (!pdfText || !activeDoc) return showMessage(language === 'vi' ? 'Vui lòng mở hoặc tải lên tài liệu trước.' : 'Please open or upload a document first.');

    if (activeDoc.summary && !forceRegenerate) {
      setSummary(activeDoc.summary);
      setStreamingSummary(activeDoc.summary);
      showMessage(language === 'vi' ? 'Đã tải bản tóm tắt đã lưu.' : 'Loaded saved summary.', false);
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

  const handleGenerateQuiz = async (forceRegenerate = false) => {
    if (!pdfText || !activeDoc) return showMessage(language === 'vi' ? 'Vui lòng mở hoặc tải lên tài liệu trước.' : 'Please open or upload a document first.');

    if (activeDoc.quiz && activeDoc.quiz.length > 0 && !forceRegenerate) {
      setQuestions(activeDoc.quiz);
      showMessage(language === 'vi' ? 'Đã tải bộ câu hỏi trắc nghiệm đã lưu.' : 'Loaded saved quiz questions.', false);
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

      showMessage(language === 'vi' ? 'Tạo câu hỏi trắc nghiệm ôn tập thành công!' : 'Quiz generated successfully!', false);
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Lỗi tạo trắc nghiệm');
    } finally {
      setLoadingType(null);
    }
  };

  const handleGenerateEssay = async (
    forceRegenerate = false,
    metadata?: {
      subject: string;
      gradeLevel: string;
      lessonTopic: string;
      examTime: string;
    }
  ) => {
    if (!pdfText || !activeDoc) return showMessage(language === 'vi' ? 'Vui lòng mở tài liệu bài giảng trước.' : 'Please open a lecture document first.');

    if (activeDoc.essay && !forceRegenerate) {
      setEssay(activeDoc.essay);
      showMessage(language === 'vi' ? 'Đã tải câu hỏi tự luận đã lưu.' : 'Loaded saved essay question.', false);
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

      showMessage(language === 'vi' ? 'AI đã soạn thảo đề tự luận thành công!' : 'AI has drafted the essay successfully!', false);
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Lỗi tạo đề tự luận');
    } finally {
      setLoadingType(null);
    }
  };

  const handleSendMessage = async (updatedHistory: ChatMessage[]) => {
    if (!activeDoc) return;
    try {
      await updateDocumentOnServer(activeDoc.id, { chatHistory: updatedHistory });
      setChatHistory(updatedHistory);
    } catch (err) {
      console.error('Lỗi lưu lịch sử chat vào DB:', err);
    }
  };

  const handleSendGeneralMessage = (updatedHistory: ChatMessage[]) => {
    if (!user) return;
    setGeneralChatHistory(updatedHistory);
    localStorage.setItem(`generalChatHistory_${user.username}`, JSON.stringify(updatedHistory));
  };

  const handleJoinClass = async () => {
    if (!user || !joinClassCode.trim()) return;
    const newCode = joinClassCode.trim().toUpperCase();
    
    // Kiểm tra đã tham gia lớp này chưa
    const currentRooms = (user.room || '').split(',').map(r => r.trim()).filter(Boolean);
    if (currentRooms.includes(newCode)) {
      showMessage(language === 'vi' ? 'Bạn đã tham gia lớp này rồi!' : 'You have already joined this class!');
      return;
    }
    
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          room: newCode,
          mode: 'add'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'vi' ? 'Mã lớp học không hợp lệ.' : 'Invalid classroom code.'));
      }
      
      // Append class to user's room list
      const updatedRooms = [...currentRooms, newCode];
      const updatedUser = { ...user, room: updatedRooms.join(',') };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setDashboardClass(newCode);
      
      // Load lại danh sách lớp học
      const classesRes = await fetch('/api/classes');
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClassList(classesData);
      }
      
      showMessage(language === 'vi' ? 'Đã tham gia lớp học thành công!' : 'Joined classroom successfully!', false);
      setJoinClassCode('');
      setShowJoinClassModal(false);
    } catch (err: any) {
      showMessage(err.message || 'Lỗi khi tham gia lớp');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newClassName.trim()) return;
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClassName.trim(),
          teacherUsername: user.username
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi tạo lớp học');
      }
      
      setClassList(prev => [...prev, data]);
      setDashboardClass(data.code);
      setCreatedClassCode(data.code);
      setNewClassName('');
      
      // Đồng bộ lại danh sách lớp
      handleRefreshData();
    } catch (err: any) {
      showMessage(err.message || 'Lỗi khi tạo lớp');
    }
  };

  const handleAssignQuiz = async (title: string, targetRoom: string, startTime: string, endTime: string) => {
    if (!user || !activeDoc || !questions.length) return;

    const newAssignment: Assignment = {
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
      showMessage(language === 'vi' ? `Đã giao bài trắc nghiệm "${title}" thành công cho lớp ${targetRoom}!` : `Quiz "${title}" assigned to class ${targetRoom} successfully!`, false);
      setDashboardClass(targetRoom);
      setActiveDoc(null);
      setSidebarTab('dashboard');
    } catch (err) {
      console.error('Lỗi giao bài trắc nghiệm:', err);
      throw err;
    }
  };

  const handleAssignEssay = async (title: string, targetRoom: string, startTime: string, endTime: string) => {
    if (!user || !activeDoc || !essay) return;

    const newAssignment: Assignment = {
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
      showMessage(language === 'vi' ? `Đã giao bài tự luận "${title}" thành công cho lớp ${targetRoom}!` : `Essay "${title}" assigned to class ${targetRoom} successfully!`, false);
      setDashboardClass(targetRoom);
      setActiveDoc(null);
      setSidebarTab('dashboard');
    } catch (err) {
      console.error('Lỗi giao bài tự luận:', err);
      throw err;
    }
  };

  const handleQuickSummary = () => {
    if (libraryDocs.length > 0) {
      handleSelectDocument(libraryDocs[0]);
      setActiveTab('summary');
      handleSummarize(false);
    } else {
      setSidebarTab('upload');
      showMessage(language === 'vi' ? 'Vui lòng tải lên tài liệu học tập của bạn trước.' : 'Please upload a document first.', false);
    }
  };

  const handleQuickChat = () => {
    if (libraryDocs.length > 0) {
      handleSelectDocument(libraryDocs[0]);
      setActiveTab('chat');
    } else {
      setSidebarTab('upload');
      showMessage(language === 'vi' ? 'Vui lòng tải lên tài liệu học tập của bạn trước.' : 'Please upload a document first.', false);
    }
  };

  const handleQuickQuiz = () => {
    if (libraryDocs.length > 0) {
      handleSelectDocument(libraryDocs[0]);
      setActiveTab('quiz');
      handleGenerateQuiz(false);
    } else {
      setSidebarTab('upload');
      showMessage(language === 'vi' ? 'Vui lòng tải lên tài liệu học tập của bạn trước.' : 'Please upload a document first.', false);
    }
  };

  // === RENDER PRE-PROCESSING ===

  // Dynamic class lists helper
  const teacherClasses = user && user.role === 'teacher'
    ? classList.filter(c => c.teacherUsername === user.username)
    : [];
  // Parse multi-room: user.room is comma-separated string
  const userRooms = user && user.role === 'student' && user.room
    ? user.room.split(',').map(r => r.trim()).filter(Boolean)
    : [];
  const studentClasses = userRooms
    .map(code => classList.find(c => c.code === code))
    .filter(Boolean) as Array<{ code: string; name: string; teacherUsername: string }>;

  const activeClassName = isTeacher 
    ? (teacherClasses.find(c => c.code === dashboardClass)?.name || dashboardClass)
    : (studentClasses.find(c => c.code === dashboardClass)?.name || dashboardClass || '');

  // Student analytics
  const studentHistoryList = quizHistory.filter(h => h.username === user?.username);
  const studentTotalDone = studentHistoryList.length;
  const studentAverageScore = studentTotalDone > 0
    ? (studentHistoryList.reduce((acc, h) => acc + parseFloat(h.scale10Score), 0) / studentTotalDone).toFixed(1)
    : '0.0';
  const studentMaxScore = studentTotalDone > 0
    ? Math.max(...studentHistoryList.map(h => parseFloat(h.scale10Score))).toFixed(1)
    : '0.0';

  // Room assignments (for Students) - show assignments from ALL joined classes
  const roomAssignments = (!isTeacher && userRooms.length > 0)
    ? assignments.filter(a => userRooms.includes(a.roomId))
    : [];

  // Teacher assignments (for Teachers)
  const teacherAssignments = (isTeacher && dashboardClass)
    ? assignments.filter(a => a.roomId === dashboardClass)
    : [];

  // Active submission
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
      activeTimeMsg = language === 'vi' 
        ? `Chưa đến giờ thi. Bắt đầu lúc: ${start.toLocaleString('vi-VN')}`
        : `Exam not started. Starts at: ${start.toLocaleString('en-US')}`;
    } else if (now > end) {
      canTakeActiveAssignment = false;
      activeTimeMsg = language === 'vi'
        ? `Đã hết hạn làm bài lúc: ${end.toLocaleString('vi-VN')}`
        : `Exam expired at: ${end.toLocaleString('en-US')}`;
    } else {
      canTakeActiveAssignment = true;
      if (!hasSubmitted) {
        activeTimeMsg = language === 'vi'
          ? `Đang trong thời gian làm bài (Hạn chót: ${end.toLocaleTimeString('vi-VN')} ngày ${end.toLocaleDateString('vi-VN')})`
          : `Exam active (Deadline: ${end.toLocaleTimeString('en-US')} on ${end.toLocaleDateString('en-US')})`;
      } else {
        activeTimeMsg = language === 'vi'
          ? `Đã nộp bài thành công (Hạn chót: ${end.toLocaleTimeString('vi-VN')} ngày ${end.toLocaleDateString('vi-VN')})`
          : `Exam submitted successfully (Deadline: ${end.toLocaleTimeString('en-US')} on ${end.toLocaleDateString('en-US')})`;
      }
    }
  }

  // Filter docs on sidebar search
  const filteredDocs = sidebarSearchQuery 
    ? libraryDocs.filter(doc => doc.fileName.toLowerCase().includes(sidebarSearchQuery.toLowerCase()))
    : libraryDocs;

  // Render AuthScreen if not logged in
  if (!user) {
    return <AuthScreen onLogin={handleLogin} language={language} setLanguage={setLanguage} />;
  }

  const isLoading = loadingType !== null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-background text-foreground transition-all duration-300">
      
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white dark:bg-[#0b0c10] border-r border-gray-300 dark:border-white/5 flex flex-col p-4 space-y-6 transition-all duration-300 z-40 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Main Actions */}
        <div className="space-y-2">
          <button 
            onClick={() => {
              setActiveDoc(null);
              setActiveAssignment(null);
              setSidebarTab('upload');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl primary-pill font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>{t.newDocument}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 space-y-1">
          <div className="text-xs font-bold text-gray-500 dark:text-outline px-4 py-2 uppercase tracking-widest opacity-70">Main Menu</div>
          
          <button 
            onClick={() => {
              setActiveDoc(null);
              setActiveAssignment(null);
              setSidebarTab('upload');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-205 ${sidebarTab === 'upload' && !activeDoc && !activeAssignment ? 'bg-primary-container/20 text-primary font-bold border-r-4 border-primary' : 'text-foreground hover:bg-gray-200/50 dark:hover:bg-sidebar-accent'}`}
          >
            <UploadCloud className="w-5.5 h-5.5 text-primary" />
            <span className="text-sm font-bold">{t.uploadMaterials}</span>
          </button>

          <button 
            onClick={() => {
              setActiveDoc(null);
              setActiveAssignment(null);
              setSidebarTab('library');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-205 ${sidebarTab === 'library' && !activeDoc && !activeAssignment ? 'bg-primary-container/20 text-primary font-bold border-r-4 border-primary' : 'text-foreground hover:bg-gray-200/50 dark:hover:bg-sidebar-accent'}`}
          >
            <Library className="w-5.5 h-5.5 text-primary" />
            <span className="text-sm font-bold">{t.documentLibrary}</span>
          </button>

          <button 
            onClick={() => {
              setActiveDoc(null);
              setActiveAssignment(null);
              setSidebarTab('chat');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-205 ${sidebarTab === 'chat' && !activeDoc && !activeAssignment ? 'bg-primary-container/20 text-primary font-bold border-r-4 border-primary' : 'text-foreground hover:bg-gray-200/50 dark:hover:bg-sidebar-accent'}`}
          >
            <MessageSquare className="w-5.5 h-5.5 text-primary" />
            <span className="text-sm font-bold">{t.aiChatSidebar}</span>
          </button>

          <button 
            onClick={() => {
              setActiveDoc(null);
              setActiveAssignment(null);
              setSidebarTab('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-205 ${sidebarTab === 'dashboard' && !activeDoc && !activeAssignment ? 'bg-primary-container/20 text-primary font-bold border-r-4 border-primary' : 'text-foreground hover:bg-gray-200/50 dark:hover:bg-sidebar-accent'}`}
          >
            <TrendingUp className="w-5.5 h-5.5 text-primary" />
            <span className="text-sm font-bold">{t.dashboard}</span>
          </button>

          <button 
            onClick={() => {
              setActiveDoc(null);
              setActiveAssignment(null);
              setSidebarTab('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-205 ${sidebarTab === 'settings' && !activeDoc && !activeAssignment ? 'bg-primary-container/20 text-primary font-bold border-r-4 border-primary' : 'text-foreground hover:bg-gray-200/50 dark:hover:bg-sidebar-accent'}`}
          >
            <Settings className="w-5.5 h-5.5 text-primary" />
            <span className="text-sm font-bold">{t.settings}</span>
          </button>
        </nav>

        {/* Search Feature & Help in Sidebar */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/5">
          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder={t.searchLibrary} 
              value={sidebarSearchQuery}
              onChange={(e) => {
                setSidebarSearchQuery(e.target.value);
                if (sidebarTab !== 'library') setSidebarTab('library');
              }}
              className="w-full bg-gray-100 dark:bg-surface-variant/10 border border-gray-300 dark:border-white/10 rounded-lg py-2.5 px-3 pl-10 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none text-foreground font-semibold"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          </div>
          <button 
            onClick={() => showMessage(t.helpCenterAlert, false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-gray-200/50 dark:hover:bg-sidebar-accent rounded-lg transition-all duration-200 text-left"
          >
            <HelpCircle className="w-5.5 h-5.5 text-primary" />
            <span className="text-xs font-bold">{t.helpCenter}</span>
          </button>

          {/* Mobile Profile & Logout */}
          <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-primary text-xs capitalize shrink-0">
                {user.username.charAt(0)}
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold leading-none truncate text-foreground">{user.username}</p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold truncate">
                  {isTeacher ? `${t.teacher}` : `${t.student} • ${userRooms.length > 0 ? userRooms.length + ' ' + (language === 'vi' ? 'lớp' : 'classes') : t.unassigned}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isTeacher && user?.room && (
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowUserManagement(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                  title={t.classManage}
                >
                  <Users className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden mt-16"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ===== MAIN CONTENT CANVAS ===== */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        {/* ===== TOP NAVIGATION BAR ===== */}
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 lg:px-margin-desktop py-4 h-16 bg-white/95 dark:bg-[#0b0c10]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3.5">
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-foreground transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>

            {/* Logo and App Title - Navigation Trigger */}
            <div 
              onClick={() => {
                setActiveDoc(null);
                setActiveAssignment(null);
                setSidebarTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3.5 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={48} 
                height={48} 
                className="w-12 h-12 rounded-xl shadow-md border border-gray-200 dark:border-white/10 p-0.5 bg-white" 
              />
              <div>
                <span className="text-base sm:text-lg font-black text-primary tracking-tight">
                  <span className="hidden sm:inline">AI Study Assistant</span>
                  <span className="sm:hidden">AI Study</span>
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 opacity-80 hidden md:block leading-none mt-1 font-bold">The Sophisticated Mentor</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bilingual and Theme Switcher Pill */}
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-gray-200/50 dark:bg-surface-variant/20 border border-gray-300/40 dark:border-white/5">
              <button 
                onClick={() => {
                  const nextLang = language === 'vi' ? 'en' : 'vi';
                  setLanguage(nextLang);
                  localStorage.setItem('language', nextLang);
                  showMessage(nextLang === 'vi' ? TRANSLATIONS.vi.languageAlert : TRANSLATIONS.en.languageAlert, false);
                }} 
                className="text-primary hover:scale-110 active:scale-95 transition-transform flex items-center"
                title={language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
              >
                <span className="material-symbols-outlined text-[22px] cursor-pointer">translate</span>
              </button>
              <ThemeToggle />
            </div>

            {/* Accessibility Settings */}
            <div className="bg-gray-200/50 dark:bg-surface-variant/10 rounded-full flex items-center justify-center">
              <AccessibilitySettings />
            </div>

            {/* User Profile info */}
            <div className="hidden lg:flex items-center gap-3 ml-2 border-l border-gray-200 dark:border-white/10 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user.username}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mt-1.5">
                  {isTeacher ? `${t.teacher}` : `${t.student} • ${userRooms.length > 0 ? userRooms.length + ' ' + (language === 'vi' ? 'lớp' : 'classes') : t.unassigned}`}
                </p>
              </div>
              
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-primary text-sm capitalize">
                {user.username.charAt(0)}
              </div>

              {isTeacher && user?.room && (
                <button 
                  onClick={() => setShowUserManagement(true)}
                  className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors flex items-center"
                  title={t.classManage}
                >
                  <Users className="w-4 h-4" />
                </button>
              )}

              <button 
                onClick={handleLogout}
                className="text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors flex items-center"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
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
        {/* CREATE CLASS ROOM MODAL (TEACHER) */}
        {showCreateClassModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  setShowCreateClassModal(false);
                  setCreatedClassCode('');
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {createdClassCode ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-foreground">
                    {language === 'vi' ? 'Đã tạo lớp học thành công!' : 'Class Created Successfully!'}
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    {language === 'vi' 
                      ? 'Hãy chia sẻ mã lớp học dưới đây cho học sinh để các em tham gia vào lớp học này.'
                      : 'Share the class code below with your students so they can join this class.'}
                  </p>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-dashed border-primary/30 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mã lớp học của bạn</p>
                    <p className="text-3xl font-black tracking-widest text-primary font-mono select-all">
                      {createdClassCode}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowCreateClassModal(false);
                      setCreatedClassCode('');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-violet text-white font-bold text-xs"
                  >
                    {language === 'vi' ? 'Hoàn thành' : 'Done'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateClass} className="space-y-4">
                  <h3 className="text-base font-black text-foreground">
                    {language === 'vi' ? 'Tạo lớp học mới' : 'Create New Class'}
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    {language === 'vi'
                      ? 'Nhập tên lớp học để tạo mã tham gia lớp học riêng cho học sinh của bạn.'
                      : 'Enter classroom name to generate a custom code for your students.'}
                  </p>

                  <div className="space-y-1.5 font-semibold text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Tên lớp học</label>
                    <input
                      type="text"
                      required
                      placeholder={language === 'vi' ? 'Ví dụ: Lớp Địa Lý 12A3, Giải Tích K64...' : 'E.g., Geography 12A3, Calculus K64...'}
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-10 mt-2 rounded-xl bg-gradient-to-r from-primary to-violet hover:brightness-110 text-white font-bold text-xs shadow-md transition-all"
                  >
                    {language === 'vi' ? 'Tạo lớp & Sinh mã' : 'Create Class & Generate Code'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* JOIN CLASS ROOM MODAL (STUDENT) */}
        {showJoinClassModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  setShowJoinClassModal(false);
                  setJoinClassCode('');
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <h3 className="text-base font-black text-foreground">
                  {language === 'vi' ? 'Thêm lớp học' : 'Add Class'}
                </h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  {language === 'vi'
                    ? 'Nhập mã lớp học do giáo viên cung cấp để thêm lớp mới vào danh sách của bạn. Bạn có thể tham gia nhiều lớp cùng lúc.'
                    : 'Enter the class code provided by your teacher to add a new class. You can join multiple classes at the same time.'}
                </p>

                {userRooms.length > 0 && (
                  <div className="text-xs p-3 bg-primary/5 border border-primary/10 rounded-xl space-y-1.5">
                    <p className="font-bold text-foreground">{language === 'vi' ? 'Lớp đã tham gia:' : 'Joined classes:'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {userRooms.map(code => {
                        const cls = classList.find(c => c.code === code);
                        return (
                          <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-lg font-bold text-[10px]">
                            {cls?.name || code}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 font-semibold text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    {language === 'vi' ? 'Mã lớp học' : 'Class Code'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'vi' ? 'Ví dụ: C8X9W2' : 'E.g., C8X9W2'}
                    value={joinClassCode}
                    onChange={(e) => setJoinClassCode(e.target.value.toUpperCase())}
                    className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono tracking-widest text-center"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowJoinClassModal(false);
                      setJoinClassCode('');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 hover:bg-gray-55 dark:hover:bg-gray-800 text-foreground font-bold text-xs transition-all"
                  >
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleJoinClass}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-violet hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-md transition-all"
                  >
                    {language === 'vi' ? 'Xác nhận' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHANGE PASSWORD MODAL */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setChangePasswordError('');
                  setChangePasswordSuccess('');
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  {language === 'vi' ? 'Đổi mật khẩu tài khoản' : 'Change Password'}
                </h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  {language === 'vi'
                    ? 'Nhập mật khẩu hiện tại của bạn và thiết lập mật khẩu mới.'
                    : 'Enter your current password and set a new one.'}
                </p>

                {changePasswordError && (
                  <div className="p-3 text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 text-red-500 rounded-xl font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{changePasswordError}</span>
                  </div>
                )}

                {changePasswordSuccess && (
                  <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 text-emerald-500 rounded-xl font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{changePasswordSuccess}</span>
                  </div>
                )}

                <div className="space-y-1.5 font-semibold text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    {language === 'vi' ? 'Mật khẩu hiện tại' : 'Current Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5 font-semibold text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    {language === 'vi' ? 'Mật khẩu mới' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5 font-semibold text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    {language === 'vi' ? 'Nhập lại mật khẩu mới' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setChangePasswordError('');
                      setChangePasswordSuccess('');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 hover:bg-gray-55 dark:hover:bg-gray-800 text-foreground font-bold text-xs transition-all"
                  >
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-violet hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    {isChangingPassword ? (language === 'vi' ? 'Đang cập nhật...' : 'Updating...') : (language === 'vi' ? 'Cập nhật' : 'Update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== ALERTS (TOAST) ===== */}
        {error && (
          <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 px-5 py-3.5 rounded-2xl shadow-xl max-w-sm backdrop-blur-md flex items-start gap-2.5">
              <AlertCircle className="w-5.5 h-5.5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold leading-relaxed flex-1">{error}</p>
            </div>
          </div>
        )}
        {successMsg && (
          <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 px-5 py-3.5 rounded-2xl shadow-xl max-w-sm backdrop-blur-md flex items-start gap-2.5">
              <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold leading-relaxed flex-1">{successMsg}</p>
            </div>
          </div>
        )}

        {/* ===== MAIN WORKSPACE OR DASHBOARD PANEL ===== */}
        <main className="pt-16 px-4 lg:px-margin-desktop py-8 bg-slate-50 dark:bg-[#0c0f0f] relative flex-1">
          {/* Ambient Decorative Blurs */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none blur-decor transition-transform duration-300"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none blur-decor transition-transform duration-300"></div>

          <div className="relative z-10 max-w-container-max mx-auto">
            
            {activeDoc || activeAssignment ? (
              /* ================== WORKSPACE ACTIVE STATE ================== */
              <div className="space-y-4">
                
                {/* Active Document Header */}
                {activeDoc && (
                  <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-300 dark:border-gray-800 flex justify-between items-center flex-wrap gap-3 animate-fade-in-up">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                        <FileText className="w-5.5 h-5.5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-foreground truncate" title={activeDoc.fileName}>
                          {activeDoc.fileName}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {language === 'vi' ? 'Lịch sử mở' : 'Last opened'}: {new Date(activeDoc.lastOpenedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        {t.savedLibrary}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveDoc(null);
                        }}
                        className="h-8 rounded-xl text-xs border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-foreground font-bold px-3 transition-all"
                      >
                        {t.closeWorkspace}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Active Assignment Header */}
                {activeAssignment && (
                  <div className="p-4 bg-primary/10 dark:bg-primary/5 border border-primary/20 rounded-2xl shadow-sm flex justify-between items-center flex-wrap gap-3 animate-fade-in-up">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Button
                        onClick={() => setActiveAssignment(null)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div className="min-w-0">
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {activeAssignment.type === 'quiz' ? t.practiceQuiz : t.practiceEssay}
                        </span>
                        <h2 className="text-base font-bold text-foreground truncate mt-1">
                          {activeAssignment.title}
                        </h2>
                      </div>
                    </div>

                    <div className="text-right text-xs text-primary font-bold">
                      {activeTimeMsg}
                    </div>
                  </div>
                )}

                {/* Workspace Panels (Split View on Desktop) */}
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* Left Column: PDF/Word Viewer (Desktop) */}
                  {activeDoc?.pdfUrl && (
                    <div className="hidden lg:flex lg:w-7/12 bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-300 dark:border-gray-800 overflow-hidden flex flex-col h-[700px] xl:h-[800px] animate-fade-in-up">
                      <div className="bg-gray-100 dark:bg-gray-800/80 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                          📄 {t.originalDoc} ({activeDoc.fileName.endsWith('.docx') ? 'Word' : (activeDoc.fileName.match(/\.(png|jpe?g|webp)$/i) ? 'Image' : 'PDF')})
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

                  {/* Right Column: AI tabs */}
                  <div className={`w-full ${activeDoc?.pdfUrl ? 'lg:w-5/12' : ''}`}>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300 dark:border-gray-800 p-1.5 rounded-2xl flex flex-row items-center justify-start overflow-x-auto scrollbar-none max-w-full !h-auto flex-nowrap gap-1 w-full">
                        {activeDoc?.pdfUrl && (
                          <TabsTrigger
                            value="document"
                            className="lg:hidden flex-1 shrink-0 min-w-[110px] rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                          >
                            {t.originalDoc}
                          </TabsTrigger>
                        )}

                        <TabsTrigger
                          value="summary"
                          disabled={!!activeAssignment}
                          className="flex-1 shrink-0 min-w-[110px] rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                        >
                          {t.docSummary}
                        </TabsTrigger>

                        <TabsTrigger
                          value="chat"
                          disabled={!!activeAssignment}
                          className="flex-1 shrink-0 min-w-[110px] rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                        >
                          {t.chatWithAi}
                        </TabsTrigger>

                        <TabsTrigger
                          value="quiz"
                          disabled={activeAssignment?.type === 'essay'}
                          className="flex-1 shrink-0 min-w-[110px] rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                        >
                          {t.practiceQuiz}
                        </TabsTrigger>

                        {(isTeacher || activeAssignment?.type === 'essay') && (
                          <TabsTrigger
                            value="essay"
                            className="flex-1 shrink-0 min-w-[110px] rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                          >
                            {isTeacher ? (language === 'vi' ? 'Đề thi tự luận' : 'Essay Exam') : t.practiceEssay}
                          </TabsTrigger>
                        )}
                      </TabsList>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                          {/* Tab: Document (Mobile) */}
                          {activeDoc?.pdfUrl && (
                            <TabsContent value="document" className="mt-0 outline-none lg:hidden animate-fade-in-up">
                              <div className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-300 dark:border-gray-800 overflow-hidden flex flex-col h-[500px]">
                                <div className="bg-gray-200 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center shrink-0">
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                                    📄 {t.originalDoc}
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

                          {/* Tab: Summary */}
                          <TabsContent value="summary" className="mt-0 outline-none">
                            {!summary && !isSummaryStreaming && !isLoading && (
                              <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-md flex flex-col items-center border border-gray-300 dark:border-gray-800">
                                <BookOpen className="w-12 h-12 text-primary mb-3" />
                                <h4 className="text-base font-bold text-foreground">{t.notSummarized}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">{t.notSummarizedDesc}</p>
                                <Button onClick={() => handleSummarize(false)} className="bg-primary hover:brightness-115 text-white rounded-xl text-sm h-10 px-6 shadow-md font-bold">
                                  {t.createSummary}
                                </Button>
                              </div>
                            )}
                            {(streamingSummary || summary || isLoading) && (
                              <SummaryPanel summary={streamingSummary || summary} isLoading={isSummaryStreaming || loadingType === 'summary'} />
                            )}
                          </TabsContent>

                          {/* Tab: Chat */}
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

                          {/* Tab: Quiz */}
                          <TabsContent value="quiz" className="mt-0 outline-none">
                            {activeAssignment && !canTakeActiveAssignment && !activeSubmission ? (
                              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 shadow-md">
                                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                                <p className="text-foreground text-sm font-bold">{activeTimeMsg}</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {isTeacher ? (
                                  <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-300 dark:border-gray-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.numQuestions}:</span>
                                      <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                                        disabled={isLoading}
                                        className="w-16 h-8 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                      />
                                    </div>

                                    <Button
                                      onClick={() => handleGenerateQuiz(true)}
                                      disabled={isLoading}
                                      className="bg-primary hover:brightness-110 text-white rounded-xl text-sm h-10 shadow-sm shrink-0 font-bold px-4"
                                    >
                                      {questions.length > 0 ? t.regenerateQuiz : t.generateQuiz}
                                    </Button>
                                  </div>
                                ) : (
                                  !activeAssignment && !questions.length && !isLoading && (
                                    <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-md flex flex-col items-center border border-gray-300 dark:border-gray-800">
                                      <GraduationCap className="w-12 h-12 text-primary mb-3" />
                                      <h4 className="text-base font-bold text-foreground">{t.noQuizGenerated}</h4>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">{t.noQuizGeneratedDesc}</p>
                                      <Button onClick={() => handleGenerateQuiz(false)} className="bg-primary hover:brightness-115 text-white rounded-xl text-sm h-10 px-6 shadow-md font-bold">
                                        {t.startQuizPractice}
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
                                      className="rounded-xl text-xs h-9 border-primary/45 text-primary flex items-center gap-1.5 font-bold"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" /> {t.otherQuiz}
                                    </Button>
                                  </div>
                                )}

                                {(questions.length > 0 || isLoading) && (
                                  <QuizPanel
                                    questions={activeSubmission?.questions || questions}
                                    isLoading={loadingType === 'quiz'}
                                    userRole={user.role}
                                    userRoom={user?.room}
                                    hasSubmitted={activeAssignment ? !!activeSubmission : false}
                                    onScoreSubmit={handleScoreSubmit}
                                    previousScoreInfo={activeSubmission ? { score: activeSubmission.score, scale10Score: activeSubmission.scale10Score } : undefined}
                                    onAssignQuiz={handleAssignQuiz}
                                    availableRooms={teacherClasses}
                                    previousAnswers={activeSubmission?.studentAnswer ? (() => {
                                      try {
                                        return JSON.parse(activeSubmission.studentAnswer) as Record<number, string>;
                                      } catch (e) {
                                        return undefined;
                                      }
                                    })() : undefined}
                                  />
                                )}
                              </div>
                            )}
                          </TabsContent>

                          {/* Tab: Essay */}
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
                                hasSubmitted={activeAssignment ? !!activeSubmission : false}
                                onEssaySubmit={handleEssaySubmit}
                                previousSubmission={activeSubmission}
                                canTake={activeAssignment ? canTakeActiveAssignment : true}
                                timeMessage={activeTimeMsg}
                                isGrading={loadingType === 'grading-essay'}
                                availableRooms={teacherClasses}
                              />
                            </TabsContent>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </Tabs>
                  </div>
                </div>
              </div>
            ) : (
              /* ================== GENERAL PANEL (DASHBOARD VIEWS) ================== */
              <div className="space-y-6 animate-fade-in-up">
                
                {/* 1. UPLOAD MATERIALS TAB */}
                {sidebarTab === 'upload' && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <FileUpload
                      onUploadSuccess={handleUploadSuccess}
                      onExistingDocumentFound={handleExistingDocumentFound}
                      onError={(msg) => showMessage(msg)}
                      isDisabled={isLoading}
                      currentRole={user.role}
                      existingDocuments={libraryDocs}
                      language={language}
                    />

                    {/* Quick welcome uploader helper */}
                    <div className="glass-card p-6 rounded-2xl text-center border border-gray-200 dark:border-white/5">
                      <h4 className="text-sm font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {t.guidelineTitle}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto font-medium">
                        {t.guidelineDesc}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. DOCUMENT LIBRARY TAB */}
                {sidebarTab === 'library' && (
                  <div className="max-w-4xl mx-auto">
                    <DocumentLibrary
                      documents={filteredDocs}
                      activeDocId={null}
                      onSelectDocument={handleSelectDocument}
                      onDeleteDocument={handleDeleteDocument}
                      currentRole={user.role}
                    />
                  </div>
                )}

                {/* 3. SETTINGS TAB */}
                {sidebarTab === 'settings' && (
                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="glass-card p-6 rounded-2xl border border-gray-200 dark:border-white/5 space-y-4">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-white/5 pb-3">
                        <Settings className="w-5 h-5" />
                        {t.systemSettings}
                      </h3>
                      
                      <div className="space-y-4 pt-1 text-sm font-semibold">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-foreground">{t.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Account login username</p>
                          </div>
                          <span className="bg-gray-200/50 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-foreground">{user.username}</span>
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-300 dark:border-gray-800 pt-3">
                          <div>
                            <p className="font-bold text-foreground">{t.role}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">User access permissions</p>
                          </div>
                          <span className="font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg capitalize">
                            {isTeacher ? t.teacherRole : t.studentRole}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-300 dark:border-gray-800">
                          <button
                            onClick={() => setShowChangePasswordModal(true)}
                            className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl shadow hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            <Lock className="w-4 h-4" />
                            {language === 'vi' ? 'Đổi mật khẩu' : 'Change Password'}
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex-1 px-4 py-2.5 bg-red-500 text-white font-bold rounded-xl shadow hover:bg-red-600 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            <LogOut className="w-4 h-4" />
                            {language === 'vi' ? 'Đăng xuất' : 'Log Out'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. AI CHAT TAB */}
                {sidebarTab === 'chat' && (
                  <div className="max-w-4xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-primary" />
                        {language === 'vi' ? 'Trợ lý học tập AI' : 'AI Study Assistant'}
                      </h2>
                      {generalChatHistory.length > 0 && (
                        <button 
                          onClick={() => {
                            if (confirm(language === 'vi' ? 'Bạn có muốn xóa toàn bộ lịch sử trò chuyện AI?' : 'Do you want to clear the entire AI chat history?')) {
                              setGeneralChatHistory([]);
                              if (user) {
                                localStorage.removeItem(`generalChatHistory_${user.username}`);
                              }
                              setChatResetCount(prev => prev + 1);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-xl transition-all"
                        >
                          {language === 'vi' ? 'Xóa lịch sử chat' : 'Clear Chat History'}
                        </button>
                      )}
                    </div>
                    <ChatBox
                      key={`general-chat-${user.username}-${chatResetCount}`}
                      pdfText=""
                      userRole={user.role}
                      onError={showMessage}
                      chatHistory={generalChatHistory}
                      onSendMessage={handleSendGeneralMessage}
                      className="h-[620px] sm:h-[680px] border border-gray-200 dark:border-white/5 rounded-2xl"
                      language={language}
                    />
                  </div>
                )}

                {/* 4. DASHBOARD TAB (ANALYTICS & ASSIGNMENTS) */}
                {sidebarTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                      <div>
                        {isTeacher ? (
                          <>
                            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
                              <GraduationCap className="w-8 h-8 text-primary" />
                              {t.dashboardTitle}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 font-semibold">
                              {t.realtimeAnalytics} <span className="font-black text-primary">{activeClassName}</span>
                            </p>
                          </>
                        ) : (
                          <>
                            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
                              <GraduationCap className="w-8 h-8 text-primary" />
                              {t.studentDashboardTitle}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 font-semibold">
                              {t.studentRealtimeAnalytics} <span className="font-black text-primary">{user.fullName || user.username}</span>
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {isTeacher && (
                          <div className="flex items-center gap-2">
                            {teacherClasses.length > 0 ? (
                              <select 
                                value={dashboardClass}
                                onChange={(e) => setDashboardClass(e.target.value)}
                                className="bg-white dark:bg-surface-container-highest border border-gray-300 dark:border-white/10 rounded-xl text-xs font-bold px-4 py-2.5 outline-none focus:border-primary text-foreground shadow-sm animate-in fade-in duration-200"
                              >
                                {teacherClasses.map((cls) => (
                                  <option key={cls.code} value={cls.code}>{cls.name} ({cls.code})</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                                {language === 'vi' ? 'Chưa có lớp học' : 'No classes created'}
                              </span>
                            )}
                            
                            <button
                              onClick={() => {
                                setCreatedClassCode('');
                                setShowCreateClassModal(true);
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-violet hover:brightness-110 active:scale-95 text-white transition-all text-xs font-bold shadow-sm"
                              title={language === 'vi' ? 'Tạo lớp học mới' : 'Create new class'}
                            >
                              <Plus className="w-4 h-4" />
                              <span>{language === 'vi' ? 'Tạo lớp' : 'Create Class'}</span>
                            </button>
                          </div>
                        )}

                        {!isTeacher && (
                          <button
                            onClick={() => {
                              setJoinClassCode('');
                              setShowJoinClassModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-violet hover:brightness-110 active:scale-95 text-white transition-all text-xs font-bold shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>
                              {language === 'vi' ? 'Thêm lớp học' : 'Add Class'}
                            </span>
                          </button>
                        )}
                        
                        <button 
                          onClick={handleRefreshData}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-surface-container-high border border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-surface-variant transition-all text-foreground text-xs font-bold shadow-sm"
                        >
                          <RefreshCw className={`w-4 h-4 text-primary ${loadingType === 'refreshing' ? 'animate-spin' : ''}`} />
                          <span>{t.recalculateScores}</span>
                        </button>
                      </div>
                    </div>

                    {/* Stats processing block */}
                    {(() => {
                      const classHistory = quizHistory.filter(h => isTeacher ? h.roomId === dashboardClass : userRooms.includes(h.roomId));
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
                        <div className="space-y-6">
                          
                          {/* TEACHER VIEW: Metrics Bento Grid & Grade Distribution chart */}
                          {isTeacher ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up [animation-delay:0.1s]">
                                {/* Card: Total Submissions */}
                                <div className="glass-card p-6 rounded-2xl border-l-4 border-primary hover:-translate-y-1 transition-transform duration-300">
                                  <div className="flex justify-between items-start mb-4">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.totalSubmissions}</p>
                                    <FileText className="w-5.5 h-5.5 text-primary" />
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-foreground">{totalClassSubmissions}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">{t.avgScore}: {classAvgScore}/10</span>
                                  </div>
                                </div>

                                {/* Card: Passed */}
                                <div className="glass-card p-6 rounded-2xl border-l-4 border-emerald-500 hover:-translate-y-1 transition-transform duration-300">
                                  <div className="flex justify-between items-start mb-4">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.passed}</p>
                                    <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500" />
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{passCount}</span>
                                    <span className="text-xs text-emerald-600 dark:text-emerald-450 font-black px-2 py-0.5 rounded bg-emerald-500/10">{passRate}%</span>
                                  </div>
                                </div>

                                {/* Card: Retest */}
                                <div className="glass-card p-6 rounded-2xl border-l-4 border-amber-500 hover:-translate-y-1 transition-transform duration-300">
                                  <div className="flex justify-between items-start mb-4">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.retest}</p>
                                    <AlertCircle className="w-5.5 h-5.5 text-amber-500" />
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-amber-600 dark:text-amber-450">{retakeCount}</span>
                                    <span className="text-xs text-amber-600 dark:text-amber-450 font-black px-2 py-0.5 rounded bg-amber-500/10">{retakeRate}%</span>
                                  </div>
                                </div>

                                {/* Card: Failed */}
                                <div className="glass-card p-6 rounded-2xl border-l-4 border-rose-500 hover:-translate-y-1 transition-transform duration-300">
                                  <div className="flex justify-between items-start mb-4">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.failed}</p>
                                    <AlertCircle className="w-5.5 h-5.5 text-rose-500" />
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-rose-600 dark:text-rose-450">{failCount}</span>
                                    <span className="text-xs text-rose-600 dark:text-rose-450 font-black px-2 py-0.5 rounded bg-rose-500/10">{failRate}%</span>
                                  </div>
                                </div>
                              </div>

                              {/* Grade Distribution Bar Chart */}
                              {totalClassSubmissions > 0 && (
                                <div className="glass-card p-6 rounded-2xl mb-6 animate-fade-in-up [animation-delay:0.15s] border border-gray-300 dark:border-white/5">
                                  <div className="flex items-center gap-2 mb-6">
                                    <TrendingUp className="w-5.5 h-5.5 text-primary" />
                                    <h3 className="text-sm font-bold text-foreground">{t.gradeDistribution} {dashboardClass}</h3>
                                  </div>
                                  <div className="h-10 w-full bg-gray-200/50 dark:bg-surface-variant/20 rounded-full overflow-hidden flex mb-4">
                                    {parseFloat(passRate) > 0 && (
                                      <div className="h-full bg-emerald-500/80 flex items-center justify-center text-[10px] font-bold text-white shadow-inner" style={{ width: `${passRate}%` }}>
                                        {passRate}%
                                      </div>
                                    )}
                                    {parseFloat(retakeRate) > 0 && (
                                      <div className="h-full bg-amber-500/80 flex items-center justify-center text-[10px] font-bold text-white shadow-inner" style={{ width: `${retakeRate}%` }}>
                                        {retakeRate}%
                                      </div>
                                    )}
                                    {parseFloat(failRate) > 0 && (
                                      <div className="h-full bg-rose-500/80 flex items-center justify-center text-[10px] font-bold text-white shadow-inner" style={{ width: `${failRate}%` }}>
                                        {failRate}%
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-6 mt-4 text-xs font-bold text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500"></div>
                                      <span>{t.passRate} ({passCount})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3.5 h-3.5 rounded-full bg-amber-500"></div>
                                      <span>{t.retestRate} ({retakeCount})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3.5 h-3.5 rounded-full bg-rose-500"></div>
                                      <span>{t.failRate} ({failCount})</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            /* STUDENT VIEW: Personal Grade statistics grid only */
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in-up [animation-delay:0.1s]">
                              {/* Card: GPA Average */}
                              <div className="glass-card p-6 rounded-2xl border-l-4 border-primary hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex justify-between items-start mb-4">
                                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.gpa}</p>
                                  <Award className="w-5.5 h-5.5 text-primary" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-black text-primary">{studentAverageScore}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">/ 10</span>
                                </div>
                              </div>

                              {/* Card: Completed Tests */}
                              <div className="glass-card p-6 rounded-2xl border-l-4 border-emerald-500 hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex justify-between items-start mb-4">
                                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.completedTests}</p>
                                  <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-450">{studentTotalDone}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                                    {language === 'vi' ? t.completedCount.replace('{count}', '') : 'exams'}
                                  </span>
                                </div>
                              </div>

                              {/* Card: Highest Score */}
                              <div className="glass-card p-6 rounded-2xl border-l-4 border-purple-500 hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex justify-between items-start mb-4">
                                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.highestScore}</p>
                                  <TrendingUp className="w-5.5 h-5.5 text-purple-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{studentMaxScore}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">/ 10</span>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })()}

                    {/* Content lists */}
                    <div className="space-y-6">
                      
                      {/* TEACHER ASSIGNMENT DASHBOARD */}
                      {isTeacher && (
                        <div className="space-y-6 animate-fade-in-up [animation-delay:0.2s]">
                          {teacherAssignments.length === 0 ? (
                            /* Info Alert + Welcome Intro when empty */
                            <div className="space-y-6">
                              <div className="glass-card bg-primary/5 border-primary/20 p-4.5 rounded-xl flex items-start gap-4">
                                <AlertCircle className="w-5.5 h-5.5 text-primary shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
                                  {t.noTestsAssigned.replace('{room}', dashboardClass)}
                                </p>
                              </div>

                              <div className="glass-card min-h-[380px] rounded-3xl flex flex-col items-center justify-center text-center p-10 overflow-hidden relative border border-gray-300 dark:border-white/5">
                                <div className="mb-6 mx-auto w-20 h-20 bg-gray-200/50 dark:bg-surface-container-highest rounded-2xl flex items-center justify-center shadow-lg border border-gray-300 dark:border-white/10 p-1 bg-white">
                                  <Image src="/logo.png" alt="AI Assistant Icon" width={64} height={64} className="w-16 h-16 object-contain" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black mb-4">Chào mừng đến với <span className="text-primary">AI Study Assistant!</span></h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed font-bold">
                                  {t.welcomeSubtitleTeacher}
                                </p>
                                <div className="flex flex-wrap justify-center gap-3.5">
                                  <button onClick={handleQuickSummary} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-300 dark:bg-surface-container-highest border border-gray-300 dark:border-white/5 hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-95 transition-all text-sm font-bold">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span>{t.autoSummary}</span>
                                  </button>
                                  <button onClick={handleQuickChat} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-300 dark:bg-surface-container-highest border border-gray-300 dark:border-white/5 hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-95 transition-all text-sm font-bold">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                    <span>{t.pdfChat}</span>
                                  </button>
                                  <button onClick={handleQuickQuiz} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-300 dark:bg-surface-container-highest border border-gray-300 dark:border-white/5 hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-95 transition-all text-sm font-bold">
                                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                                    <span>{t.aiQuiz}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-6">
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
                                  statusText = language === 'vi' ? 'Chưa diễn ra' : 'Upcoming';
                                  statusColor = 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
                                } else if (now > end) {
                                  statusText = language === 'vi' ? 'Đã kết thúc' : 'Ended';
                                  statusColor = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
                                } else {
                                  statusText = language === 'vi' ? 'Đang mở' : 'Active';
                                  statusColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
                                }

                                const isQuiz = asm.type === 'quiz';

                                return (
                                  <Card key={asm.id} className="border-0 shadow-md bg-white dark:bg-gray-900 backdrop-blur-sm transition-all hover:shadow-lg duration-200 overflow-hidden rounded-2xl border border-gray-300 dark:border-white/5">
                                    {/* Assignment Header Card */}
                                    <div className="p-5 border-b border-gray-300 dark:border-white/5">
                                      <div className="flex justify-between items-start gap-4 flex-wrap">
                                        <div className="space-y-2 flex-1 min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColor}`}>
                                              {statusText}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isQuiz ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'}`}>
                                              {isQuiz ? (language === 'vi' ? '📝 Trắc nghiệm' : '📝 Quiz') : (language === 'vi' ? '✏️ Tự luận' : '✏️ Essay')}
                                            </span>
                                            <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md">
                                              {language === 'vi' ? 'Lớp' : 'Class'} {asm.roomId}
                                            </span>
                                          </div>

                                          <h4 className="font-bold text-foreground text-base mt-2 leading-snug truncate" title={asm.title}>
                                            {asm.title}
                                          </h4>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            📄 {language === 'vi' ? 'Tài liệu' : 'Material'}: {asm.fileName}
                                          </p>

                                          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5 leading-relaxed bg-gray-200 dark:bg-gray-950/40 p-2.5 rounded-xl mt-1 max-w-sm font-semibold">
                                            <p>• {language === 'vi' ? 'Bắt đầu' : 'Start'}: {start.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</p>
                                            <p>• {language === 'vi' ? 'Kết thúc' : 'End'}: {end.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</p>
                                          </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                          <div className="text-right p-3 rounded-2xl border border-gray-300 dark:border-white/5 min-w-[130px] bg-primary/5">
                                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.submittedClass}</p>
                                            <p className="text-xl font-black text-primary mt-0.5">
                                              {totalSubmissions} <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{language === 'vi' ? 'học sinh' : 'students'}</span>
                                            </p>
                                            {isQuiz && classAverage !== null && (
                                              <p className="text-xs text-emerald-600 dark:text-emerald-450 font-bold mt-0.5">
                                                {language === 'vi' ? 'TB' : 'Avg'}: {classAverage}/10
                                              </p>
                                            )}
                                          </div>

                                          <Button
                                            onClick={() => handleDeleteAssignment(asm.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs h-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-bold border border-red-200/50 dark:border-red-900/50"
                                          >
                                            {t.deleteAssign}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Student Grades Table */}
                                    <div className="p-5 bg-gray-50/40 dark:bg-gray-950/20">
                                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        {t.classHistoryTableHead}
                                        <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold ${totalSubmissions > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-gray-200 text-gray-400 dark:bg-gray-800'}`}>
                                          {totalSubmissions} {t.submittedClass}
                                        </span>
                                      </p>

                                      {asmHistory.length > 0 ? (
                                        <div className="overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900">
                                          <table className="w-full text-left border-collapse text-sm min-w-[500px]">
                                            <thead>
                                              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-800">
                                                <th className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.historyTableHeadName}</th>
                                                <th className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.historyTableHeadScore}</th>
                                                <th className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.historyTableHeadClassify}</th>
                                                {isQuiz ? (
                                                  <th className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.historyTableHeadDetails}</th>
                                                ) : (
                                                  <th className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.historyTableHeadDetails}</th>
                                                )}
                                                <th className="py-2.5 px-4 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.historyTableHeadTime}</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
                                              {asmHistory.map((h, hIdx) => {
                                                const scoreNum = parseFloat(h.scale10Score);
                                                const scoreColor = scoreNum >= 8
                                                  ? 'text-emerald-650 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                                                  : scoreNum >= 5
                                                    ? 'text-amber-655 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                                                    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50';

                                                let classifyLabel = '';
                                                let classifyColor = '';
                                                if (scoreNum >= 5.0) {
                                                  classifyLabel = `✅ ${t.passLabel}`;
                                                  classifyColor = 'text-emerald-700 dark:text-emerald-450 bg-emerald-100 dark:bg-emerald-950/50';
                                                } else if (scoreNum >= 3.0) {
                                                  classifyLabel = `⚠️ ${t.retestLabel}`;
                                                  classifyColor = 'text-amber-700 dark:text-amber-450 bg-amber-100 dark:bg-amber-950/50';
                                                } else {
                                                  classifyLabel = `❌ ${t.failLabel}`;
                                                  classifyColor = 'text-red-700 dark:text-red-450 bg-red-100 dark:bg-red-950/50';
                                                }

                                                return (
                                                  <tr key={hIdx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                                    <td className="py-2.5 px-4 font-bold text-foreground">
                                                      👤 {h.fullName || h.username || (language === 'vi' ? '(ẩn danh)' : '(anonymous)')}
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                      <span className={`font-black px-2.5 py-0.5 rounded-lg text-xs ${scoreColor}`}>
                                                        {h.scale10Score}/10
                                                      </span>
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                      <span className={`font-bold px-2 py-0.5 rounded-lg text-xs ${classifyColor}`}>
                                                        {classifyLabel}
                                                      </span>
                                                    </td>
                                                    {isQuiz ? (
                                                      <td className="py-2.5 px-4">
                                                        <Button
                                                          onClick={() => setSelectedQuizSubmission(h)}
                                                          variant="outline"
                                                          size="sm"
                                                          className="h-7 text-xs px-2.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5 font-bold"
                                                        >
                                                           {language === 'vi' ? `Xem bài làm (${h.score}/${h.totalQuestions})` : `View Work (${h.score}/${h.totalQuestions})`}
                                                        </Button>
                                                      </td>
                                                    ) : (
                                                      <td className="py-2.5 px-4">
                                                        <Button
                                                          onClick={() => setSelectedEssaySubmission(h)}
                                                          variant="outline"
                                                          size="sm"
                                                          className="h-7 text-xs px-2.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5 font-bold"
                                                        >
                                                           {language === 'vi' ? 'Xem bài làm & Nhận xét' : 'View Work & Feedback'}
                                                        </Button>
                                                      </td>
                                                    )}
                                                    <td className="py-2.5 px-4 text-gray-500 dark:text-gray-400 text-xs">
                                                      {new Date(h.submittedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                            {totalSubmissions > 1 && classAverage !== null && (
                                              <tfoot>
                                                <tr className="bg-primary/5 border-t border-primary/10">
                                                  <td className="py-2.5 px-4 text-xs font-bold text-primary uppercase tracking-wider" colSpan={2}>
                                                    {t.classAvgFoot}
                                                  </td>
                                                  <td className="py-2.5 px-4" colSpan={3}>
                                                    <span className="font-black text-sm text-primary">
                                                      {classAverage}/10
                                                    </span>
                                                  </td>
                                                </tr>
                                              </tfoot>
                                            )}
                                          </table>

                                          {/* Mini progress stats */}
                                          {totalSubmissions > 0 && (() => {
                                            const asmPass = asmHistory.filter(h => parseFloat(h.scale10Score) >= 5.0).length;
                                            const asmRetake = asmHistory.filter(h => { const s = parseFloat(h.scale10Score); return s >= 3.0 && s < 5.0; }).length;
                                            const asmFail = asmHistory.filter(h => parseFloat(h.scale10Score) < 3.0).length;
                                            const pPct = ((asmPass / totalSubmissions) * 100).toFixed(0);
                                            const rPct = ((asmRetake / totalSubmissions) * 100).toFixed(0);
                                            const fPct = ((asmFail / totalSubmissions) * 100).toFixed(0);
                                            return (
                                              <div className="mt-3 p-3 bg-gray-100/50 dark:bg-gray-950/20 border-t border-gray-300 dark:border-white/5">
                                                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 mb-1.5 font-bold">
                                                  <span>{t.passRate}: <strong className="text-emerald-600 dark:text-emerald-450">{asmPass}</strong> ({pPct}%)</span>
                                                  <span>{t.retestRate}: <strong className="text-amber-600 dark:text-amber-450">{asmRetake}</strong> ({rPct}%)</span>
                                                  <span>{t.failRate}: <strong className="text-rose-500">{asmFail}</strong> ({fPct}%)</span>
                                                </div>
                                                <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-gray-300 dark:bg-gray-800">
                                                  {parseInt(pPct) > 0 && <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pPct}%` }}></div>}
                                                  {parseInt(rPct) > 0 && <div className="bg-amber-500 h-full transition-all" style={{ width: `${rPct}%` }}></div>}
                                                  {parseInt(fPct) > 0 && <div className="bg-rose-500 h-full transition-all" style={{ width: `${fPct}%` }}></div>}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-900/30">
                                          <span className="text-xl mb-1.5">🕐</span>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{t.noSubmissionsYet}</p>
                                          <p className="text-[10px] text-gray-400 mt-0.5">{t.noSubmissionsYetDesc}</p>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* STUDENT ASSIGNMENT DASHBOARD */}
                      {!isTeacher && (
                        <div className="space-y-6 animate-fade-in-up [animation-delay:0.2s]">
                          {userRooms.length === 0 ? (
                            /* Join class card for student */
                            <Card className="p-8 border border-gray-300 dark:border-white/5 bg-white dark:bg-gray-900 rounded-3xl shadow-lg relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-violet/10 rounded-bl-full"></div>
                              <h3 className="text-lg font-black text-foreground mb-2 flex items-center gap-2">
                                <GraduationCap className="w-6 h-6 text-primary" />
                                {language === 'vi' ? 'Tham gia lớp học mới' : 'Join a New Class'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-bold leading-relaxed">
                                {language === 'vi' 
                                  ? 'Bạn hiện chưa tham gia lớp học nào. Hãy nhập mã lớp học do giáo viên cung cấp để tham gia lớp và làm bài kiểm tra thử.'
                                  : 'You are not in any class yet. Enter the classroom code provided by your teacher to join and take tests.'}
                              </p>
                              
                              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                                <input
                                  type="text"
                                  placeholder={language === 'vi' ? 'Ví dụ: C8X9W2' : 'E.g., C8X9W2'}
                                  value={joinClassCode}
                                  onChange={(e) => setJoinClassCode(e.target.value.toUpperCase())}
                                  className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <button
                                  onClick={handleJoinClass}
                                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-violet hover:brightness-110 active:scale-95 text-white font-bold text-sm shadow-md transition-all whitespace-nowrap"
                                >
                                  {language === 'vi' ? 'Vào lớp' : 'Join Class'}
                                </button>
                              </div>
                            </Card>
                          ) : (
                            /* Old classroom exams list if student has a class */
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                <GraduationCap className="w-5.5 h-5.5 text-primary" />
                                {t.assignedExams.replace('{room}', studentClasses.map(c => c.name).join(', ') || activeClassName)}
                              </h3>

                              {roomAssignments.length === 0 ? (
                                /* Empty alert + Welcome Card when no tests */
                                <div className="space-y-6">
                                  <Card className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-300 dark:border-white/5 font-bold">
                                    {t.noTestsAssigned.replace('{room}', studentClasses.map(c => c.name).join(', ') || activeClassName)}
                                  </Card>

                                  <div className="glass-card min-h-[380px] rounded-3xl flex flex-col items-center justify-center text-center p-10 overflow-hidden relative border border-gray-300 dark:border-white/5">
                                    <div className="mb-6 mx-auto w-20 h-20 bg-gray-200/50 dark:bg-surface-container-highest rounded-2xl flex items-center justify-center shadow-lg border border-gray-300 dark:border-white/10 p-1 bg-white">
                                      <Image src="/logo.png" alt="AI Assistant Icon" width={64} height={64} className="w-16 h-16 object-contain" />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black mb-4">Chào mừng đến với <span className="text-primary">AI Study Assistant!</span></h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed font-bold">
                                      {t.welcomeSubtitleStudent}
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-3.5">
                                      <button onClick={handleQuickSummary} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-300 dark:bg-surface-container-highest border border-gray-300 dark:border-white/5 hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-95 transition-all text-sm font-bold">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <span>{t.autoSummary}</span>
                                      </button>
                                      <button onClick={handleQuickChat} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-300 dark:bg-surface-container-highest border border-gray-300 dark:border-white/5 hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-95 transition-all text-sm font-bold">
                                        <BookOpen className="w-4 h-4 text-primary" />
                                        <span>{t.pdfChat}</span>
                                      </button>
                                      <button onClick={handleQuickQuiz} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-300 dark:bg-surface-container-highest border border-gray-300 dark:border-white/5 hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-95 transition-all text-sm font-bold">
                                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                                        <span>{t.aiQuiz}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {roomAssignments.map((asm) => {
                                  const submission = quizHistory.find(h => h.assignmentId === asm.id && h.username === user.username);
                                  const hasSubmitted = !!submission;

                                  const now = new Date();
                                  const start = new Date(asm.startTime);
                                  const end = new Date(asm.endTime);

                                  let statusText = '';
                                  let statusColor = '';
                                  if (now < start) {
                                    statusText = language === 'vi' ? 'Chưa diễn ra' : 'Upcoming';
                                    statusColor = 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
                                  } else if (now > end) {
                                    statusText = language === 'vi' ? 'Đã kết thúc' : 'Ended';
                                    statusColor = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
                                  } else {
                                    statusText = language === 'vi' ? 'Đang mở' : 'Active';
                                    statusColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
                                  }

                                  return (
                                    <Card key={asm.id} className="p-5 border-0 shadow-md bg-white dark:bg-gray-900 backdrop-blur-sm flex flex-col justify-between hover:shadow-lg transition-all duration-200 rounded-2xl border border-gray-300 dark:border-white/5">
                                      <div>
                                        <div className="flex justify-between items-start gap-2">
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColor}`}>
                                            {statusText}
                                          </span>
                                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                                            {asm.type === 'quiz' ? (language === 'vi' ? '📝 Trắc nghiệm' : '📝 Quiz') : (language === 'vi' ? '✏️ Tự luận' : '✏️ Essay')}
                                          </span>
                                        </div>

                                        <h4 className="font-bold text-foreground text-sm mt-3 line-clamp-2 leading-snug">
                                          {asm.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                          📄 {language === 'vi' ? 'Tài liệu' : 'Material'}: {asm.fileName}
                                        </p>

                                        <div className="mt-4 text-xs text-gray-600 dark:text-gray-300 space-y-0.5 leading-relaxed bg-gray-200 dark:bg-gray-950/40 p-2.5 rounded-xl font-bold">
                                          <p>• {language === 'vi' ? 'Bắt đầu' : 'Start'}: {start.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</p>
                                          <p>• {language === 'vi' ? 'Kết thúc' : 'End'}: {end.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</p>
                                        </div>
                                      </div>

                                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 dark:border-white/5 pt-3">
                                        {hasSubmitted ? (
                                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
                                            {language === 'vi' ? 'Điểm thi' : 'Exam score'}: {submission.scale10Score}/10
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">
                                            {t.notTaken}
                                          </span>
                                        )}

                                        <Button
                                          onClick={() => handleSelectAssignment(asm)}
                                          disabled={now < start}
                                          className={`text-xs h-9 px-4.5 rounded-xl font-bold transition-all ${now < start
                                              ? 'bg-gray-200 text-gray-400 dark:bg-gray-800 cursor-not-allowed border border-transparent'
                                              : 'bg-primary hover:brightness-110 text-white shadow-sm shadow-primary/15'
                                            }`}
                                        >
                                          {hasSubmitted ? t.reviewTest : (now > end ? t.viewKey : t.startTest)}
                                        </Button>
                                      </div>
                                    </Card>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                          {/* Student Score History List */}
                          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-md border border-gray-300 dark:border-gray-800/80">
                            <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3.5">
                              📈 {t.scoreListTitle}
                            </h3>
                            {studentHistoryList.length > 0 ? (
                              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {[...studentHistoryList].reverse().map((item, idx) => (
                                  <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center text-sm">
                                    <div className="min-w-0 flex-1 pr-2">
                                      <p className="font-bold text-gray-700 dark:text-gray-200 truncate" title={item.fileName}>
                                        {item.fileName}
                                      </p>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                                        {new Date(item.submittedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                                      </span>
                                    </div>
                                    <span className="font-black text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-lg text-xs shrink-0">
                                      {item.scale10Score}/10
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-6 font-bold">{t.noScoresYet}</p>
                            )}
                          </div>

                        </div>
                      )}

                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        </main>
      </div>

      {/* ===== MOBILE CONTEXTUAL FAB ===== */}
      {sidebarTab !== 'upload' && !activeDoc && !activeAssignment && (
        <button 
          onClick={() => {
            setActiveDoc(null);
            setActiveAssignment(null);
            setSidebarTab('upload');
          }}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full primary-pill text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 lg:hidden border border-white/10"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* ===== OVERLAY MODAL: READ ESSAY DETAIL AND FEEDBACK (Teacher only) ===== */}
      {selectedEssaySubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-primary to-violet text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-300" />
                  {t.essayFeedbackTitle}
                </h3>
                <p className="text-primary-foreground text-xs mt-0.5 font-medium opacity-90">
                  {t.historyTableHeadName}: <span className="font-bold">{selectedEssaySubmission.fullName || selectedEssaySubmission.username}</span> |
                  {t.submittedAt}: {new Date(selectedEssaySubmission.submittedAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedEssaySubmission(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Student Answer */}
              <div className="space-y-3 flex flex-col min-h-0">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                  {t.studentAnswer}
                </h4>
                <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm text-foreground whitespace-pre-wrap leading-relaxed overflow-y-auto min-h-[250px] md:min-h-[400px]">
                  {selectedEssaySubmission.studentAnswer}
                </div>
              </div>

              {/* Right Column: AI Feedback & Score */}
              <div className="space-y-3 flex flex-col min-h-0">
                <div className="flex justify-between items-center shrink-0">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    {t.aiFeedbackDetail}
                  </h4>
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450 px-3 py-1 rounded-full font-black border border-emerald-100 dark:border-emerald-900/50">
                    {t.points}: {selectedEssaySubmission.scale10Score}/10
                  </span>
                </div>

                <div className="flex-1 p-4 bg-primary/5 border border-primary/10 rounded-2xl overflow-y-auto min-h-[250px] md:min-h-[400px]
                  prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-foreground
                  prose-h2:text-xs prose-h2:mt-3 prose-h2:mb-1.5 prose-h2:font-bold prose-h2:text-primary
                  prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-li:text-gray-700 dark:prose-li:text-gray-300
                  prose-strong:text-foreground
                  prose-ul:space-y-0.5
                ">
                  <ReactMarkdown>{selectedEssaySubmission.aiFeedback || ''}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/20 flex justify-end shrink-0">
              <Button
                onClick={() => setSelectedEssaySubmission(null)}
                className="bg-primary hover:brightness-110 text-white rounded-xl text-sm h-10 px-6 font-bold shadow-md shadow-primary/20"
              >
                {t.closeFeedback}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== OVERLAY MODAL: REVIEW STUDENT QUIZ SUBMISSION (Teacher only) ===== */}
      {selectedQuizSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-300" />
                  {language === 'vi' ? 'Chi tiết bài trắc nghiệm của học sinh' : 'Student Quiz Submission Review'}
                </h3>
                <p className="text-primary-foreground text-xs mt-0.5 font-medium opacity-90">
                  {t.historyTableHeadName}: <span className="font-bold">{selectedQuizSubmission.fullName || selectedQuizSubmission.username}</span> |
                  {language === 'vi' ? 'Điểm số' : 'Grade'}: <span className="font-bold">{selectedQuizSubmission.scale10Score}/10 ({selectedQuizSubmission.score}/{selectedQuizSubmission.totalQuestions} câu)</span> |
                  {t.submittedAt}: {new Date(selectedQuizSubmission.submittedAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuizSubmission(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {(() => {
                // Parse student answers from JSON
                let studentAnswers: Record<number, string> = {};
                try {
                  if (selectedQuizSubmission.studentAnswer) {
                    studentAnswers = JSON.parse(selectedQuizSubmission.studentAnswer);
                  }
                } catch (e) {
                  console.error('Error parsing student quiz answers:', e);
                }

                // Get questions list to display. If saved questions are in history, use them. Otherwise, fall back to assignment questions.
                let quizQuestions: QuizQuestion[] = selectedQuizSubmission.questions || [];
                if (quizQuestions.length === 0) {
                  const matchingAsm = assignments.find(a => a.id === selectedQuizSubmission.assignmentId);
                  quizQuestions = matchingAsm?.questions || [];
                }

                if (quizQuestions.length === 0) {
                  return (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                      {language === 'vi' ? 'Không tìm thấy dữ liệu câu hỏi cho bài thi này.' : 'No question data found for this quiz.'}
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {quizQuestions.map((q, index) => {
                      const studentAnswerLetter = studentAnswers[index];
                      const isCorrect = studentAnswerLetter === q.answer;

                      return (
                        <div key={index} className="p-5 bg-gray-50/50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800/80 rounded-2xl space-y-3">
                          <div className="flex items-start gap-2.5">
                            <span className="shrink-0 w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xs font-bold font-mono">
                              {index + 1}
                            </span>
                            <h4 className="font-bold text-sm text-foreground pt-0.5 leading-relaxed">
                              {q.question}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 ml-9">
                            {q.options.map((option, optIdx) => {
                              // Extract option letter (A, B, C, D)
                              const match = option.trim().match(/^([A-D])\s*\.?\s*/i);
                              const letter = match ? match[1].toUpperCase() : ['A', 'B', 'C', 'D'][optIdx];
                              
                              const isCorrectOption = letter === q.answer;
                              const isStudentSelected = studentAnswerLetter === letter;

                              let optionClass = 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300';
                              if (isCorrectOption) {
                                optionClass = 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-350';
                              } else if (isStudentSelected && !isCorrectOption) {
                                optionClass = 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-350';
                              }

                              return (
                                <div key={optIdx} className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${optionClass}`}>
                                  <span>{option}</span>
                                  {isCorrectOption && (
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-black">Correct</span>
                                  )}
                                  {isStudentSelected && !isCorrectOption && (
                                    <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-black">Student Answer</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="ml-9 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs space-y-1">
                            <p className="font-bold text-blue-700 dark:text-blue-400">
                              {language === 'vi' ? 'Đáp án đúng: ' : 'Correct Answer: '} {q.answer}
                            </p>
                            <p className="text-gray-600 dark:text-gray-350 leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/20 flex justify-end shrink-0">
              <Button
                onClick={() => setSelectedQuizSubmission(null)}
                className="bg-primary hover:brightness-110 text-white rounded-xl text-sm h-10 px-6 font-bold shadow-md shadow-primary/20"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
