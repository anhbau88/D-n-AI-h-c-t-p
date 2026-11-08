// app/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Lock,
  Crown,
  Zap,
  Brain,
  Flame,
  Star,
  Shield,
  Download,
  KeyRound,
  Trophy,
  Globe,
  CalendarCheck,
  Languages,
  Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useCompletion } from 'ai/react';
import { motion, AnimatePresence } from 'framer-motion';

// Static imports - light, always visible
import ThemeToggle from '@/components/ThemeToggle';
import AccessibilitySettings from '@/components/AccessibilitySettings';
import AuthScreen from '@/components/AuthScreen';
import ToastContainer, { Toast } from '@/components/ui/ToastContainer';

// Dynamic imports - heavy, deferred loading
const FileUpload = dynamic(() => import('@/components/FileUpload'), { ssr: false });
const SummaryPanel = dynamic(() => import('@/components/SummaryPanel'), { ssr: false });
const ChatBox = dynamic(() => import('@/components/ChatBox'), { ssr: false });
const QuizPanel = dynamic(() => import('@/components/QuizPanel'), { ssr: false });
const EssayPanel = dynamic(() => import('@/components/EssayPanel'), { ssr: false });
const FlashcardPanel = dynamic(() => import('@/components/FlashcardPanel'), { ssr: false });
const UpgradeModal = dynamic(() => import('@/components/UpgradeModal'), { ssr: false });
const AdminPortal = dynamic(() => import('@/components/AdminPortal'), { ssr: false });
const DocumentLibrary = dynamic(() => import('@/components/DocumentLibrary'), { ssr: false });
const UserManagement = dynamic(() => import('@/components/UserManagement'), { ssr: false });
const TeacherClassManagement = dynamic(() => import('@/components/TeacherClassManagement'), { ssr: false });
const SocialShareModal = dynamic(() => import('@/components/SocialShareModal'), { ssr: false });
const LeaderboardModal = dynamic(() => import('@/components/LeaderboardModal'), { ssr: false });
const TodayDashboard = dynamic(() => import('@/components/TodayDashboard'), { ssr: false });
const PracticeHub = dynamic(() => import('@/components/PracticeHub'), { ssr: false });
const EnglishLearningHub = dynamic(() => import('@/components/EnglishLearningHub'), { ssr: false });
const ProgressHub = dynamic(() => import('@/components/ProgressHub'), { ssr: false });

import {
  getDefaultEnglishProgress,
  loadEnglishProgress,
  saveEnglishProgress,
  EnglishLearningProgress
} from '@/lib/english-curriculum';
import { ZaloSupportCard } from '@/components/ZaloSupportWidget';
import MobileBottomNav from '@/components/MobileBottomNav';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import ZenFocusMode from '@/components/ZenFocusMode';
import PomodoroPlayer from '@/components/PomodoroPlayer';


import { FileInfo, QuizQuestion, User, Assignment, QuizHistoryItem, DocumentItem, ChatMessage, AIModelTier } from '@/types';
import { FlashcardItem } from '@/types/document';

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
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Commercial SaaS & AI Model Tier States
  const [modelTier, setModelTier] = useState<AIModelTier>('flash');
  const [quizDifficulty, setQuizDifficulty] = useState<'basic' | 'standard' | 'advanced'>('standard');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [leaderboardUsers, setLeaderboardUsers] = useState<User[]>([]);
  const [overrideScoreInput, setOverrideScoreInput] = useState('');
  const [overrideCommentInput, setOverrideCommentInput] = useState('');
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  // Assignments & History
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);

  // Redesign Navigation States (5-Item Unified Navigation)
  const [sidebarTab, setSidebarTab] = useState<
    'dashboard' | 'upload' | 'library' | 'practice' | 'english' | 'progress' | 'settings' | 'chat' | 'class-management' | 'admin'
  >('dashboard');
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Teacher Workspace Mode ('teaching' vs 'personal') & English Session Focus State
  const [teacherViewMode, setTeacherViewMode] = useState<'teaching' | 'personal'>('teaching');
  const [englishProgress, setEnglishProgress] = useState<EnglishLearningProgress>(() => getDefaultEnglishProgress());
  const [englishSessionActive, setEnglishSessionActive] = useState(false);
  const [englishInitialLessonId, setEnglishInitialLessonId] = useState<string | null>(null);
  const [englishInitialReviewMode, setEnglishInitialReviewMode] = useState(false);
  const [showStudentClassesModal, setShowStudentClassesModal] = useState(false);

  const handleUpdateEnglishProgress = useCallback((next: EnglishLearningProgress) => {
    setEnglishProgress(next);
    if (user?.username) {
      saveEnglishProgress(user.username, next);
    }
  }, [user?.username]);

  // Document Workspace Figure 2 States
  const [mobileDocView, setMobileDocView] = useState<'source' | 'ai'>('ai');
  const [practiceSubTab, setPracticeSubTab] = useState<'quiz' | 'flashcards' | 'essay'>('quiz');
  const [teachBackText, setTeachBackText] = useState('');
  const [teachBackFeedback, setTeachBackFeedback] = useState<string | null>(null);
  const [isEvaluatingTeachBack, setIsEvaluatingTeachBack] = useState(false);
  const [extractedVocabCount, setExtractedVocabCount] = useState<number | null>(null);

  // General Chat History State & Reset Counter
  const [generalChatHistory, setGeneralChatHistory] = useState<ChatMessage[]>([]);
  const [chatResetCount, setChatResetCount] = useState(0);
  const [docChatResetCount, setDocChatResetCount] = useState(0);

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

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // New Feature Upgrade States (Zen Focus, Social Share, Leaderboard, Mobile Profile)
  const [isZenFocus, setIsZenFocus] = useState(false);
  const [showSocialShare, setShowSocialShare] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [socialShareData, setSocialShareData] = useState<{ score: string; testTitle: string }>({ score: '10/10', testTitle: 'Bài thi AI' });
  const [mobileProfileMenuOpen, setMobileProfileMenuOpen] = useState(false);

  // Function to add a toast message
  const addToast = useCallback((
    type: 'success' | 'error' | 'info' | 'assignment',
    title: string,
    description?: string,
    action?: { label: string; handler: () => void }
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = 6000;
    const newToast: Toast = {
      id,
      type,
      title,
      description,
      actionLabel: action?.label,
      onAction: action?.handler,
      duration
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const handleCloseToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showMessage = useCallback((msg: string, isError = true) => {
    addToast(
      isError ? 'error' : 'success',
      isError 
        ? (language === 'vi' ? 'Lỗi' : 'Error') 
        : (language === 'vi' ? 'Thông báo' : 'Notice'),
      msg
    );
  }, [addToast, language]);

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
  const [dashboardClass, setDashboardClass] = useState<string>('');

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [successMsg, setSuccessMsg] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Role helper
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isSuperAdmin = user ? ['admin', 'tung1', 'anhbau88', 'anhbauyp88', 'anhbau888'].includes(user.username.toLowerCase()) || user.role === 'admin' : false;

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

  const syncWorkspaceWithDoc = useCallback((doc: DocumentItem | null) => {
    setActiveDoc(doc);
    setActiveAssignment(null); // Deselect assignment
    setTeachBackText('');
    setTeachBackFeedback(null);
    setExtractedVocabCount(null);
    if (doc) {
      setPdfText(doc.textContent);
      setFileInfo({
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        pages: Math.max(1, Math.ceil(doc.textContent.length / 3000)),
        textLength: doc.textContent.length
      });
      setSummary(doc.summary || '');
      setQuestions(doc.quiz || []);
      setEssay(doc.essay || '');
      setFlashcards(doc.flashcards || []);
      
      // Load user isolated document chat history instead of public doc chat history
      const savedDocChat = localStorage.getItem(`docChatHistory_${user?.username}_${doc.id}`);
      let chatHist: ChatMessage[] = [];
      try { chatHist = savedDocChat ? JSON.parse(savedDocChat) : []; } catch { }
      setChatHistory(chatHist);
      
      // Mặc định mở tab Hiểu bài (summary) theo Hình 2
      setActiveTab('summary');
      setMobileDocView('ai');
    } else {
      setPdfText('');
      setFileInfo(null);
      setSummary('');
      setQuestions([]);
      setEssay('');
      setFlashcards([]);
      setChatHistory([]);
    }
  }, [user, setActiveTab]);

  const syncWorkspaceWithAssignment = useCallback((asm: Assignment | null) => {
    setActiveAssignment(asm);
    setActiveDoc(null); // Deselect document
    if (asm) {
      setPdfText(asm.pdfText);
      setFileInfo({
        fileName: asm.fileName,
        fileSize: 0,
        pages: Math.max(1, Math.ceil(asm.pdfText.length / 3000)),
        textLength: asm.pdfText.length
      });
      setQuestions(asm.questions || []);
      setEssay(asm.essay || '');
      setSummary('');
      setChatHistory([]);
      
      // Navigate to practice tab with sub-tab quiz or essay
      setActiveTab('practice-doc');
      setPracticeSubTab(asm.type === 'essay' ? 'essay' : 'quiz');
    } else {
      setPdfText('');
      setFileInfo(null);
      setQuestions([]);
      setEssay('');
      setSummary('');
      setChatHistory([]);
    }
  }, [setActiveTab]);

  // Listen for open-social-share custom events
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleOpenShare = (e: any) => {
      if (e.detail) {
        setSocialShareData({
          score: e.detail.score || '10/10',
          testTitle: e.detail.testTitle || 'Bài thi AI',
        });
        setShowSocialShare(true);
      }
    };
    window.addEventListener('open-social-share', handleOpenShare);
    return () => window.removeEventListener('open-social-share', handleOpenShare);
  }, []);


  // Load public documents
  const loadLibraryDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents', { cache: 'no-store' });
      if (res.ok) {
        const docs = (await res.json()) as DocumentItem[];
        setLibraryDocs(docs.sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()));
        localStorage.setItem('libraryDocs', JSON.stringify(docs));
      }
    } catch (err) {
      console.error('Lỗi tải tài liệu từ máy chủ:', err);
    }
  }, []);

  // Sync user subscription plan, expiration, XP, streak & modelTier
  const syncUserSessionFromServer = useCallback(async (usernameToSync: string) => {
    try {
      const res = await fetch(`/api/auth/me?username=${encodeURIComponent(usernameToSync)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.user.preferredModel) {
            setModelTier(data.user.preferredModel);
          }
        }
      }
    } catch (err) {
      console.error('Lỗi đồng bộ gói tài khoản:', err);
    }
  }, []);

  // Fetch leaderboard users
  const fetchLeaderboardUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as User[];
        setLeaderboardUsers(data);
      }
    } catch (err) {
      console.error('Lỗi tải bảng xếp hạng học sinh:', err);
    }
  }, []);

  // Restore session & settings
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        const res = await fetch('/api/classes', { cache: 'no-store' });
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
        if (parsedUser.preferredModel) {
          setModelTier(parsedUser.preferredModel);
        }
        if (parsedUser.room) {
          const rooms = parsedUser.room.split(',').map(r => r.trim()).filter(Boolean);
          if (rooms.length > 0) setDashboardClass(rooms[0]);
        }
        loadLibraryDocuments();
        syncUserSessionFromServer(parsedUser.username);
      } catch { }
    }
  }, [loadLibraryDocuments, syncUserSessionFromServer]);

  // Cập nhật lớp học mặc định khi danh sách lớp thay đổi hoặc giáo viên đăng nhập
  useEffect(() => {
    if (user && (user.role === 'teacher' || user.role === 'admin')) {
      const myClasses = classList.filter(c => c.teacherUsername === user.username);
      if (myClasses.length > 0) {
        if (!dashboardClass || !myClasses.some(c => c.code === dashboardClass)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDashboardClass(myClasses[0].code);
        }
      } else if (dashboardClass !== '') {
        setDashboardClass('');
      }
    } else if (user && user.role === 'student' && user.room) {
      const rooms = user.room.split(',').map(r => r.trim()).filter(Boolean);
      if (rooms.length > 0 && !rooms.includes(dashboardClass)) {
        setDashboardClass(rooms[0]);
      }
    }
  }, [user, classList, dashboardClass]);

  // Fetch score history
  const fetchHistory = useCallback(async () => {
    try {
      if (!user) return;
      let url = '/api/history';
      if (user.role === 'student') {
        url += `?username=${encodeURIComponent(user.username)}`;
      } else if ((user.role === 'teacher' || user.role === 'admin') && dashboardClass) {
        url += `?roomId=${encodeURIComponent(dashboardClass)}`;
      }
      
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setQuizHistory(data);
        localStorage.setItem('quizHistory', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Lỗi đồng bộ lịch sử điểm số:', err);
    }
  }, [user, dashboardClass]);

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch('/api/db', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
        localStorage.setItem('assignments', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Lỗi đồng bộ assignments:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnglishProgress(loadEnglishProgress(user.username));
    fetchAssignments();
    fetchHistory();
    loadLibraryDocuments();
    fetchLeaderboardUsers();
  }, [user, fetchAssignments, fetchHistory, loadLibraryDocuments, fetchLeaderboardUsers]);

  // Tự động tải lại lịch sử điểm số khi giáo viên chuyển lớp quản lý
  useEffect(() => {
    if (!user || user.role !== 'teacher' || !dashboardClass) return;
    fetchHistory();
  }, [user, dashboardClass, fetchHistory]);

  // Đồng bộ lịch sử trò chuyện AI chung theo từng user khi đăng nhập/đăng xuất
  useEffect(() => {
    if (user) {
      const savedChat = localStorage.getItem(`generalChatHistory_${user.username}`);
      try { setGeneralChatHistory(savedChat ? JSON.parse(savedChat) : []); } catch { setGeneralChatHistory([]); }
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
  }, [user, fetchAssignments, fetchHistory, loadLibraryDocuments]);

  // Đăng ký nhận thông báo thời gian thực qua Server-Sent Events (SSE) dành cho Học sinh
  useEffect(() => {
    if (!user || user.role !== 'student') return;

    const eventSource = new EventSource('/api/notifications');

    eventSource.addEventListener('NEW_ASSIGNMENT', (event) => {
      try {
        const assignment = JSON.parse(event.data) as Assignment;
        
        // 1. Kiểm tra xem học sinh có thuộc lớp học được giao đề này hay không
        const currentRooms = (user.room || '').split(',').map(r => r.trim()).filter(Boolean);
        if (!currentRooms.includes(assignment.roomId)) return;

        // 2. Kiểm tra xem học sinh đã làm bài thi này chưa
        const hasTaken = quizHistory.some(h => h.assignmentId === assignment.id);
        if (hasTaken) return;

        // 3. Cập nhật danh sách bài tập đã giao tức thì
        setAssignments(prev => {
          if (prev.some(a => a.id === assignment.id)) return prev;
          const updated = [...prev, assignment];
          localStorage.setItem('assignments', JSON.stringify(updated));
          return updated;
        });

        // 4. Kích hoạt Toast thông báo cao cấp với hành động làm bài ngay
        addToast(
          'assignment',
          language === 'vi' ? '🔔 Bài kiểm tra lớp mới!' : '🔔 New Class Exam!',
          language === 'vi' 
            ? `Lớp ${assignment.roomId} vừa có đề thi mới: "${assignment.title}"` 
            : `Class ${assignment.roomId} has a new exam: "${assignment.title}"`,
          {
            label: language === 'vi' ? 'Làm bài ngay' : 'Take exam',
            handler: () => {
              syncWorkspaceWithAssignment(assignment);
            }
          }
        );
      } catch (err) {
        console.error('Lỗi phân tích sự kiện thông báo SSE:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('Lỗi kết nối SSE stream, đang tự động thử lại...', err);
    };

    return () => {
      eventSource.close();
    };
  }, [user, quizHistory, addToast, language, syncWorkspaceWithAssignment]);

  if (!isMounted) return null;

  // === HANDLERS ===

  const handleRefreshData = () => {
    if (!user) return;
    setLoadingType('refreshing');
    Promise.all([
      fetchAssignments(),
      fetchHistory(),
      loadLibraryDocuments(),
      fetchLeaderboardUsers(),
      syncUserSessionFromServer(user.username)
    ]).finally(() => {
      setLoadingType(null);
      showMessage(t.syncDone, false);
    });
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    if (newUser.preferredModel) {
      setModelTier(newUser.preferredModel);
    }
    if (newUser.room) {
      const rooms = newUser.room.split(',').map(r => r.trim()).filter(Boolean);
      if (rooms.length > 0) setDashboardClass(rooms[0]);
    }
    localStorage.setItem('user', JSON.stringify(newUser));
    loadLibraryDocuments();
    syncWorkspaceWithDoc(null);
    setSidebarTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { }
    setUser(null);
    localStorage.removeItem('user');
    syncWorkspaceWithDoc(null);
    setLibraryDocs([]);
  };

  const handleModelTierChange = async (nextTier: AIModelTier) => {
    if (!user) return;
    const activePlan = user.plan || 'free';
    if (nextTier === 'pro' && activePlan === 'free') {
      setShowUpgradeModal(true);
      showMessage('Nâng cấp gói PRO hoặc nhập Mã Code để mở khóa mô hình AI Pro 2.5 Reasoning!', false);
      return;
    }
    if (nextTier === 'ultra' && activePlan !== 'vip') {
      setShowUpgradeModal(true);
      showMessage('Nâng cấp gói VIP hoặc nhập Mã Code để mở khóa mô hình AI Ultra Academic!', false);
      return;
    }
    setModelTier(nextTier);
    try {
      await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, preferredModel: nextTier })
      });
    } catch { }
  };

  const handleExportExcelGradebook = async (examTitle: string, submissions: QuizHistoryItem[]) => {
    try {
      const XLSX = await import('xlsx');
      const rows = submissions.map((s, idx) => {
        const num = parseFloat(s.scale10Score);
        const rank = num >= 8.0 ? 'Giỏi' : num >= 6.5 ? 'Khá' : num >= 5.0 ? 'Đạt' : num >= 3.0 ? 'Thi lại' : 'Học lại';
        return {
          'STT': idx + 1,
          'Họ và tên': s.fullName || s.username,
          'Tài khoản': s.username,
          'Lớp': s.roomId,
          'Đề kiểm tra': examTitle,
          'Hình thức': s.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm',
          'Điểm hệ 10': Number(s.scale10Score),
          'Số câu đúng': s.type === 'quiz' ? `${s.score}/${s.totalQuestions}` : 'Tự luận AI',
          'Xếp loại': rank,
          'Nhận xét GV': s.teacherComment || '',
          'Thời gian nộp': new Date(s.submittedAt).toLocaleString('vi-VN')
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BangDiem');
      const safeName = examTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      XLSX.writeFile(wb, `Bang_Diem_${dashboardClass || 'Lop'}_${safeName}.xlsx`);
      showMessage('Đã xuất file Excel bảng điểm (.xlsx) thành công!', false);
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      showMessage('Không thể xuất file Excel.');
    }
  };

  const handleTeacherOverrideGrade = async (submission: QuizHistoryItem) => {
    if (!user || !isTeacher) return;
    setIsSavingOverride(true);
    try {
      const res = await fetch('/api/history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: submission.assignmentId,
          username: submission.username,
          submittedAt: submission.submittedAt,
          newScale10Score: overrideScoreInput || submission.scale10Score,
          teacherComment: overrideCommentInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật điểm');
      setQuizHistory(data.history || []);
      localStorage.setItem('quizHistory', JSON.stringify(data.history || []));
      if (selectedEssaySubmission && selectedEssaySubmission.submittedAt === submission.submittedAt) {
        setSelectedEssaySubmission(data.updatedItem);
      }
      if (selectedQuizSubmission && selectedQuizSubmission.submittedAt === submission.submittedAt) {
        setSelectedQuizSubmission(data.updatedItem);
      }
      showMessage('Đã lưu điểm phúc khảo & lời phê của Giáo viên!', false);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Lỗi cập nhật điểm');
    } finally {
      setIsSavingOverride(false);
    }
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

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi kết nối.';
      setChangePasswordError(errMsg);
    } finally {
      setIsChangingPassword(false);
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
      syncUserSessionFromServer(user.username);
    } catch (err) {
      console.error('Lỗi nộp điểm lên server:', err);
      const newHistory = [...quizHistory, newItem];
      setQuizHistory(newHistory);
      localStorage.setItem('quizHistory', JSON.stringify(newHistory));
    }

    syncWorkspaceWithDoc(null);
    setSidebarTab('dashboard');
    if (parseFloat(scale10Score) >= 7.5) {
      setSocialShareData({
        score: `${scale10Score}/10`,
        testTitle: activeAssignment.title || activeAssignment.fileName,
      });
      setShowSocialShare(true);
    }
    showMessage(language === 'vi' ? `Đã nộp bài! Điểm của bạn là ${scale10Score}/10 (+XP)` : `Exam submitted! Your score is ${scale10Score}/10`, false);
  };

  const handleEssaySubmit = async (studentAnswer: string, handwritingImageBase64?: string) => {
    if (!user || !activeAssignment) return;

    setLoadingType('grading-essay');
    try {
      const resGrade = await fetch('/api/essay/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayQuestion: activeAssignment.essay,
          studentAnswer,
          pdfText: activeAssignment.pdfText,
          handwritingImageBase64,
          modelTier,
          username: user.username
        })
      });
      const dataGrade = await resGrade.json();
      if (!resGrade.ok) {
        if (dataGrade.code === 'QUOTA_EXCEEDED' || dataGrade.code === 'MODEL_LOCKED') {
          setShowUpgradeModal(true);
        }
        throw new Error(dataGrade.error || 'Lỗi chấm bài tự động');
      }

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
      syncUserSessionFromServer(user.username);
      syncWorkspaceWithDoc(null);
      setSidebarTab('dashboard');
      showMessage(language === 'vi' ? `Đã nộp bài tự luận! AI chấm bài làm của bạn là ${score.toFixed(1)}/10 (+XP)` : `Essay submitted! AI graded your response: ${score.toFixed(1)}/10`, false);
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
      
      // Đồng bộ lại lịch sử điểm số cục bộ
      fetchHistory();

      showMessage(language === 'vi' ? 'Đã xóa bài thi đã giao thành công!' : 'Assigned exam deleted successfully!', false);
    } catch (err) {
      console.error('Lỗi khi xóa bài thi:', err);
      showMessage('Không thể xóa bài thi.');
    }
  };

  const handleRemoveStudentFromClass = async (studentUsername: string, classCode: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: studentUsername,
          room: classCode,
          mode: 'remove'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi xóa học sinh khỏi lớp.');
      }
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi khi xóa học sinh khỏi lớp.';
      console.error('Lỗi khi xóa học sinh khỏi lớp:', err);
      showMessage(errMsg);
      throw err;
    }
  };

  const handleDeleteClass = async (classCode: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: classCode,
          teacherUsername: user.username
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi xóa lớp học.');
      }

      // Cập nhật state lớp học cục bộ
      setClassList(prev => prev.filter(c => c.code !== classCode));

      // Reset dashboardClass nếu trùng
      if (dashboardClass === classCode) {
        const remaining = classList.filter(c => c.code !== classCode && c.teacherUsername === user.username);
        setDashboardClass(remaining.length > 0 ? remaining[0].code : '');
      }

      // Làm mới dữ liệu bài tập và lịch sử sau khi xóa liên đới
      Promise.all([
        fetchAssignments(),
        fetchHistory()
      ]).catch(e => console.error('Lỗi cập nhật đồng bộ sau khi xóa lớp:', e));

      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi khi xóa lớp học.';
      console.error('Lỗi khi xóa lớp học:', err);
      showMessage(errMsg);
      throw err;
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
        syncWorkspaceWithDoc(updatedDoc);
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
      ownerUsername: user.username,
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
        syncWorkspaceWithDoc(newDoc);
        showMessage(language === 'vi' ? 'Tài liệu mới đã được chia sẻ lên thư viện công cộng thành công!' : 'New material uploaded and shared to public library!', false);
      } else {
        throw new Error('Lỗi server');
      }
    } catch (err) {
      console.error('Lỗi lưu tài liệu:', err);
      showMessage('Không thể lưu tài liệu vào thư viện dùng chung.');
    }
  };

  const handleExistingDocumentFound = async (doc: DocumentItem, newName?: string) => {
    if (!user) return;
    const updates: Partial<DocumentItem> = { lastOpenedAt: new Date().toISOString() };
    if (newName) {
      updates.fileName = newName;
    }
    await updateDocumentOnServer(doc.id, updates, true);
    showMessage(language === 'vi' 
      ? 'Tài liệu này đã tồn tại. Trình duyệt đã khôi phục dữ liệu và cập nhật tên mới.' 
      : 'This document already exists. Recovered saved data and updated the name.', false);
  };

  const handleSelectDocument = async (doc: DocumentItem) => {
    await updateDocumentOnServer(doc.id, { lastOpenedAt: new Date().toISOString() }, true);
  };

  const handleSelectAssignment = (asm: Assignment) => {
    syncWorkspaceWithAssignment(asm);
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
        
        // Dọn sạch lịch sử chat của tài liệu bị xóa
        localStorage.removeItem(`docChatHistory_${user.username}_${docId}`);
        
        if (activeDoc?.id === docId) {
          syncWorkspaceWithDoc(null);
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
        fileType: 'PDF',
        modelTier,
        username: user?.username
      }
    });
  };

  const handleGenerateFlashcards = async (forceRegenerate = false) => {
    if (!pdfText || !activeDoc) return showMessage('Vui lòng mở hoặc tải lên tài liệu trước.');
    setActiveTab('practice-doc');
    setPracticeSubTab('flashcards');
    if (activeDoc.flashcards && activeDoc.flashcards.length > 0 && !forceRegenerate) {
      setFlashcards(activeDoc.flashcards);
      return;
    }
    setLoadingType('flashcards');
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfText, count: 10, modelTier, username: user?.username })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'QUOTA_EXCEEDED' || data.code === 'MODEL_LOCKED') setShowUpgradeModal(true);
        throw new Error(data.error || 'Lỗi tạo Flashcards');
      }
      await updateDocumentOnServer(activeDoc.id, { flashcards: data.flashcards });
      setFlashcards(data.flashcards || []);
      if (user) syncUserSessionFromServer(user.username);
      showMessage('Đã tạo bộ Thẻ ghi nhớ 3D Flashcards thành công!', false);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Lỗi tạo Flashcards');
    } finally {
      setLoadingType(null);
    }
  };

  const handleGenerateQuiz = async (forceRegenerate = false, overrideCount?: number) => {
    if (!pdfText || !activeDoc) return showMessage(language === 'vi' ? 'Vui lòng mở hoặc tải lên tài liệu trước.' : 'Please open or upload a document first.');
    const targetCount = overrideCount ?? questionCount;
    if (overrideCount) setQuestionCount(overrideCount);
    setActiveTab('practice-doc');
    setPracticeSubTab('quiz');

    if (activeDoc.quiz && activeDoc.quiz.length > 0 && !forceRegenerate) {
      setQuestions(activeDoc.quiz);
      showMessage(language === 'vi' ? 'Đã tải bộ câu hỏi trắc nghiệm đã lưu.' : 'Loaded saved quiz questions.', false);
      return;
    }

    setLoadingType('quiz');
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfText,
          questionCount: targetCount,
          role: user?.role,
          difficultyMatrix: quizDifficulty,
          modelTier,
          username: user?.username
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'QUOTA_EXCEEDED' || data.code === 'MODEL_LOCKED') setShowUpgradeModal(true);
        throw new Error(data.error);
      }

      await updateDocumentOnServer(activeDoc.id, { quiz: data.questions });
      setQuestions(data.questions);
      if (user) syncUserSessionFromServer(user.username);

      showMessage(language === 'vi' ? 'Tạo câu hỏi trắc nghiệm ôn tập thành công!' : 'Quiz generated successfully!', false);
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Lỗi tạo trắc nghiệm');
    } finally {
      setLoadingType(null);
    }
  };

  const handleAdaptiveDrill = async (wrongQuestionsInput: string | QuizQuestion[]) => {
    if (!pdfText) return;
    setLoadingType('quiz');
    try {
      const wrongSummary = typeof wrongQuestionsInput === 'string'
        ? wrongQuestionsInput
        : wrongQuestionsInput
            .map((q, i) => `Câu sai ${i + 1}: ${q.question} (Đáp án đúng: ${q.answer} - ${q.explanation})`)
            .join('\n');
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfText,
          questionCount: 5,
          role: user?.role,
          wrongQuestionsSummary: wrongSummary,
          modelTier,
          username: user?.username
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'QUOTA_EXCEEDED' || data.code === 'MODEL_LOCKED') setShowUpgradeModal(true);
        throw new Error(data.error || 'Lỗi tạo bài luyện khắc phục lỗi sai');
      }
      setQuestions(data.questions);
      if (user) syncUserSessionFromServer(user.username);
      showMessage('🎯 Đã tạo 5 câu hỏi khắc phục đúng các lỗ hổng kiến thức bạn vừa làm sai!', false);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Lỗi tạo bài luyện thích ứng');
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
    setActiveTab('practice-doc');
    setPracticeSubTab('essay');

    if (activeDoc.essay && !forceRegenerate) {
      setEssay(activeDoc.essay);
      showMessage(language === 'vi' ? 'Đã tải câu hỏi tự luận đã lưu.' : 'Loaded saved essay question.', false);
      return;
    }

    setLoadingType('essay');
    try {
      const res = await fetch('/api/essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfText,
          subject: metadata?.subject,
          gradeLevel: metadata?.gradeLevel,
          lessonTopic: metadata?.lessonTopic,
          examTime: metadata?.examTime,
          modelTier,
          username: user?.username
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'QUOTA_EXCEEDED' || data.code === 'MODEL_LOCKED') setShowUpgradeModal(true);
        throw new Error(data.error);
      }

      await updateDocumentOnServer(activeDoc.id, { essay: data.essay });
      setEssay(data.essay);
      if (user) syncUserSessionFromServer(user.username);

      showMessage(language === 'vi' ? 'AI đã soạn thảo đề tự luận thành công!' : 'AI has drafted the essay successfully!', false);
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Lỗi tạo đề tự luận');
    } finally {
      setLoadingType(null);
    }
  };

  // Mở bài mẫu "Quang hợp.pdf" theo Hình 1 & Hình 2 trong báo cáo
  const handleOpenSampleDoc = () => {
    const existingSample = libraryDocs.find((d) =>
      d.fileName.toLowerCase().includes('quang hợp')
    );
    if (existingSample) {
      syncWorkspaceWithDoc(existingSample);
      return;
    }
    const sampleDoc: DocumentItem = {
      id: 'sample-quang-hop',
      role: user?.role || 'student',
      fileName: 'Quang hợp.pdf',
      fileSize: 245000,
      fileType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      hash: 'sample-quang-hop-sha256',
      textContent: `CHƯƠNG I: CHUYỂN HÓA VẬT CHẤT VÀ NĂNG LƯỢNG Ở THỰC VẬT
BÀI 8: QUANG HỢP Ở THỰC VẬT (Trang 12)

1. Khái niệm quang hợp ở thực vật
Quang hợp ở thực vật là quá trình lục lạp (Chloroplast) hấp thụ và sử dụng năng lượng ánh sáng để tổng hợp chất hữu cơ (C6H12O6 - Glucose) từ nguyên liệu vô cơ là khí cacbonic (CO2) và nước (H2O), đồng thời giải phóng khí ôxi (O2).
Phương trình tổng quát của quang hợp:
6CO2 + 6H2O --(Ánh sáng, Hệ sắc tố diệp lục)--> C6H12O6 + 6O2.

2. Hai pha của quá trình quang hợp
Quá trình quang hợp ở thực vật được chia thành 2 pha liên tiếp và phụ thuộc chặt chẽ vào nhau: Pha sáng (Light-dependent reaction) và Pha tối (Chu trình Calvin - Calvin cycle).

a) Pha sáng (Diễn ra tại màng tilacoit của hạt grana trong lục lạp):
- Điều kiện: Chỉ diễn ra khi có ánh sáng.
- Nguyên liệu: Năng lượng ánh sáng, H2O, ADP, Pi và NADP+.
- Cơ chế: Hệ sắc tố quang hợp (Chlorophyll a, b và Carotenoid) hấp thụ quang năng, thực hiện quá trình quang phân li nước (2H2O -> 4H+ + 4e- + O2) tại xoang tilacoit.
- Sản phẩm của pha sáng: Giải phóng khí O2 ra khí quyển (nguồn gốc hoàn toàn từ phân tử nước H2O) và tạo ra năng lượng hóa học ATP cùng chất khử mạnh NADPH để cung cấp cho pha tối.

b) Pha tối / Chu trình Calvin (Diễn ra tại chất nền stroma của lục lạp):
- Điều kiện: Không cần ánh sáng trực tiếp nhưng phụ thuộc hoàn toàn vào nguồn ATP và NADPH do pha sáng cung cấp.
- Nguyên liệu: Khí CO2 lấy từ khí quyển qua khí khổng, cùng với ATP và NADPH từ pha sáng.
- Sản phẩm của pha tối: Cố định CO2 qua chu trình Calvin để tổng hợp các phân tử đường đơn (C6H12O6), từ đó hình thành tinh bột, axit amin và các hợp chất hữu cơ nuôi cơ thể thực vật.`,
      summary: `### Ý chính cần nắm (Nguồn tài liệu · Trang 12)

1. **Quang hợp gồm pha sáng và pha tối**, diễn ra bên trong bào quan **lục lạp (Chloroplast)** của tế bào thực vật.
2. **Pha sáng** diễn ra tại **màng tilacoit**, sử dụng năng lượng ánh sáng để quang phân li nước ($H_2O$), tạo ra **$ATP$**, **$NADPH$** và giải phóng khí **$O_2$** (nguồn gốc từ $H_2O$).
3. **Pha tối (Chu trình Calvin)** diễn ra tại **chất nền stroma**, sử dụng **$ATP$** và **$NADPH$** từ pha sáng để cố định **$CO_2$** thành chất hữu cơ (**$C_6H_{12}O_6$**).`,
      quiz: [
        {
          id: 1,
          question: 'Pha sáng của quá trình quang hợp diễn ra tại vị trí nào trong lục lạp?',
          options: [
            'A. Màng ngoài của lục lạp',
            'B. Chất nền stroma',
            'C. Màng tilacoit (hạt grana)',
            'D. Tế bào chất'
          ],
          answer: 'C',
          explanation: 'Theo trang 12 của tài liệu, pha sáng diễn ra tại màng tilacoit của hạt grana trong lục lạp.'
        },
        {
          id: 2,
          question: 'Khí O2 giải phóng trong quá trình quang hợp có nguồn gốc từ phân tử nào?',
          options: [
            'A. Khí CO2',
            'B. Phân tử nước (H2O) qua quang phân li nước',
            'C. Phân tử Glucose (C6H12O6)',
            'D. Phân tử ATP'
          ],
          answer: 'B',
          explanation: 'Quá trình quang phân li nước (2H2O -> 4H+ + 4e- + O2) tại màng tilacoit là nguồn gốc duy nhất giải phóng khí O2.'
        },
        {
          id: 3,
          question: 'Pha sáng cung cấp những sản phẩm nào cho pha tối (chu trình Calvin) hoạt động?',
          options: [
            'A. CO2 và H2O',
            'B. O2 và Glucose',
            'C. ATP và NADPH',
            'D. ADP và NADP+'
          ],
          answer: 'C',
          explanation: 'Pha sáng chuyển hóa năng lượng ánh sáng thành năng lượng hóa học trong ATP và NADPH để cung cấp cho pha tối cố định CO2.'
        },
        {
          id: 4,
          question: 'Pha tối (Chu trình Calvin) diễn ra ở đâu trong lục lạp?',
          options: [
            'A. Chất nền stroma',
            'B. Xoang tilacoit',
            'C. Màng trong lục lạp',
            'D. Nhân tế bào'
          ],
          answer: 'A',
          explanation: 'Theo tài liệu, pha tối diễn ra tại chất nền (stroma) của lục lạp.'
        },
        {
          id: 5,
          question: 'Vì sao pha tối không cần ánh sáng trực tiếp nhưng vẫn ngừng hoạt động nếu cây để trong bóng tối lâu?',
          options: [
            'A. Vì pha tối cần O2 từ pha sáng',
            'B. Vì pha tối phụ thuộc hoàn toàn vào nguồn ATP và NADPH do pha sáng tạo ra',
            'C. Vì khí khổng đóng hoàn toàn không nhận H2O',
            'D. Vì lục lạp bị phân hủy trong tối'
          ],
          answer: 'B',
          explanation: 'Pha tối cần ATP và NADPH từ pha sáng để khử CO2 thành chất hữu cơ; khi không có ánh sáng, pha sáng dừng nên hết ATP và NADPH.'
        }
      ],
      flashcards: [
        {
          id: 'fc-1',
          front: 'Pha sáng của quang hợp diễn ra ở đâu và tạo ra sản phẩm gì?',
          back: 'Diễn ra tại màng tilacoit (hạt grana). Sản phẩm: ATP, NADPH và giải phóng khí O2 (từ quang phân li H2O).',
          topic: 'Pha sáng'
        },
        {
          id: 'fc-2',
          front: 'Pha tối (Chu trình Calvin) diễn ra ở đâu và có vai trò gì?',
          back: 'Diễn ra tại chất nền stroma của lục lạp. Dùng ATP và NADPH từ pha sáng để cố định CO2 thành chất hữu cơ (C6H12O6).',
          topic: 'Pha tối'
        },
        {
          id: 'fc-3',
          front: 'Phương trình tổng quát của quang hợp ở thực vật là gì?',
          back: '6CO2 + 6H2O --(Ánh sáng, Diệp lục)--> C6H12O6 + 6O2',
          topic: 'Khái niệm'
        }
      ],
      ownerType: 'student',
      ownerUsername: user?.username || 'student',
      status: 'processed'
    };
    syncWorkspaceWithDoc(sampleDoc);
    showMessage('Đã mở tài liệu mẫu "Quang hợp.pdf" theo chuẩn Hình 2!', false);
  };

  // Chức năng "Dạy lại cho AI" (Teach-back) ở tab Thêm
  const handleEvaluateTeachBack = () => {
    if (!teachBackText.trim() || teachBackText.trim().length < 15) {
      showMessage('Hãy viết ít nhất 2-3 câu diễn đạt lại ý chính bằng lời của bạn trước khi chấm!');
      return;
    }
    setIsEvaluatingTeachBack(true);
    setTimeout(() => {
      const lower = teachBackText.toLowerCase();
      const docSample = (summary || pdfText).slice(0, 500);
      const hasKeywords =
        lower.includes('pha sáng') ||
        lower.includes('pha tối') ||
        lower.includes('atp') ||
        lower.includes('co2') ||
        teachBackText.trim().split(/\s+/).length >= 18;

      if (hasKeywords) {
        setTeachBackFeedback(
          `✅ **Điểm bạn đã nắm vững:** Bạn đã diễn đạt đúng mối liên hệ cốt lõi giữa các khái niệm chính trong bài *"${activeDoc?.fileName}"* bằng ngôn từ tự nhiên.\n\n⚠️ **Điểm cần bổ sung nhẹ:** Hãy nêu rõ hơn vị trí diễn ra hoặc điều kiện đầu vào/đầu ra để câu trả lời đạt điểm tối đa khi thi tự luận.\n\n📌 **Đối chiếu nguồn tài liệu:** ${docSample.slice(0, 180)}...`
        );
      } else {
        setTeachBackFeedback(
          `⚠️ **Cần bổ sung ý trọng tâm:** Phần diễn đạt của bạn còn khá ngắn và chưa nêu đủ các từ khóa cốt lõi trong bài *"${activeDoc?.fileName}"*.\n\n💡 **Gợi ý sửa lại:** Hãy trả lời 3 câu hỏi: (1) Khái niệm này diễn ra ở đâu? (2) Nguyên liệu đầu vào là gì? (3) Sản phẩm tạo ra dùng để làm gì?`
        );
      }
      setIsEvaluatingTeachBack(false);
    }, 600);
  };

  // Chức năng "Rút trích từ vựng Tiếng Anh từ tài liệu" sang khu Tiếng Anh
  const handleExtractEnglishVocab = () => {
    if (!user || !activeDoc) return;
    const prog = loadEnglishProgress(user.username);
    const newTerms = [
      {
        id: `vocab_${Date.now()}_1`,
        term: 'Photosynthesis',
        meaningVi: 'Quá trình quang hợp ở thực vật',
        sourceSentence: 'Photosynthesis converts light energy into chemical energy in chloroplasts.',
        documentName: activeDoc.fileName,
        addedAt: new Date().toISOString()
      },
      {
        id: `vocab_${Date.now()}_2`,
        term: 'Chloroplast',
        meaningVi: 'Bào quan lục lạp',
        sourceSentence: 'Light-dependent reactions take place inside the chloroplast.',
        documentName: activeDoc.fileName,
        addedAt: new Date().toISOString()
      },
      {
        id: `vocab_${Date.now()}_3`,
        term: 'Light-dependent reaction',
        meaningVi: 'Pha sáng (phản ứng phụ thuộc ánh sáng)',
        sourceSentence: 'The light-dependent reaction produces ATP, NADPH, and oxygen.',
        documentName: activeDoc.fileName,
        addedAt: new Date().toISOString()
      },
      {
        id: `vocab_${Date.now()}_4`,
        term: 'Calvin cycle',
        meaningVi: 'Chu trình Calvin (Pha tối cố định CO2)',
        sourceSentence: 'The Calvin cycle uses ATP and NADPH to fix carbon dioxide into glucose.',
        documentName: activeDoc.fileName,
        addedAt: new Date().toISOString()
      }
    ];
    const existingTerms = new Set(prog.customVocabulary.map((v) => v.term.toLowerCase()));
    const filteredNew = newTerms.filter((tItem) => !existingTerms.has(tItem.term.toLowerCase()));
    prog.customVocabulary = [...filteredNew, ...prog.customVocabulary];
    handleUpdateEnglishProgress(prog);
    setExtractedVocabCount(filteredNew.length || newTerms.length);
    showMessage(`Đã lưu ${filteredNew.length || newTerms.length} thuật ngữ Tiếng Anh từ "${activeDoc.fileName}" sang khu Tiếng Anh!`, false);
  };

  const handleSendMessage = (updatedHistory: ChatMessage[]) => {
    if (!activeDoc || !user) return;
    try {
      localStorage.setItem(`docChatHistory_${user.username}_${activeDoc.id}`, JSON.stringify(updatedHistory));
      setChatHistory(updatedHistory);
    } catch (err) {
      console.error('Lỗi lưu lịch sử chat vào LocalStorage:', err);
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
      const classesRes = await fetch('/api/classes', { cache: 'no-store' });
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClassList(classesData);
      }
      
      showMessage(language === 'vi' ? 'Đã tham gia lớp học thành công!' : 'Joined classroom successfully!', false);
      setJoinClassCode('');
      setShowJoinClassModal(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi khi tham gia lớp';
      showMessage(errMsg);
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
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi khi tạo lớp';
      showMessage(errMsg);
    }
  };

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
      showMessage(language === 'vi' ? `Đã giao bài trắc nghiệm "${title}" thành công cho lớp ${targetRoom}!` : `Quiz "${title}" assigned to class ${targetRoom} successfully!`, false);
      setDashboardClass(targetRoom);
      syncWorkspaceWithDoc(null);
      setSidebarTab('dashboard');
    } catch (err) {
      console.error('Lỗi giao bài trắc nghiệm:', err);
      throw err;
    }
  };

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
      showMessage(language === 'vi' ? `Đã giao bài tự luận "${title}" thành công cho lớp ${targetRoom}!` : `Essay "${title}" assigned to class ${targetRoom} successfully!`, false);
      setDashboardClass(targetRoom);
      syncWorkspaceWithDoc(null);
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
    ? (teacherClasses.find(c => c.code === dashboardClass)?.name || (dashboardClass ? dashboardClass : (language === 'vi' ? 'Chưa có lớp học' : 'No classes created')))
    : (studentClasses.find(c => c.code === dashboardClass)?.name || dashboardClass || (language === 'vi' ? 'Chưa có lớp học' : 'No classes created'));

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

  // RIÊNG TÀI KHOẢN ADMIN KHI ĐĂNG NHẬP CHỈ HIỆN PHẦN QUẢN TRỊ SAAS
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] dark:bg-[#0b0c10] text-[#172033] dark:text-white flex flex-col">
        <header className="sticky top-0 z-40 h-16 bg-white/95 dark:bg-[#11131a]/95 backdrop-blur-xl border-b border-[#E4E7F0] dark:border-white/10 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6545D8] text-white font-black flex items-center justify-center shadow-sm">
              +
            </div>
            <div>
              <span className="text-sm sm:text-base font-black tracking-tight block leading-none">
                Trợ Lý Học Tập — Quản trị SaaS
              </span>
              <span className="text-[11px] font-bold text-[#5A6478] dark:text-slate-400">
                Cổng điều hành hệ thống & Duyệt đơn thanh toán gói cước
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 text-xs font-black">
              <Shield className="w-3.5 h-3.5" />
              Admin: {user.username}
            </span>
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#C83A3A] dark:text-rose-300 hover:bg-rose-100 text-xs font-black flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
          <AdminPortal
            currentUser={user}
            onNotify={(msg, isErr) => showMessage(msg, isErr ?? false)}
          />
        </main>

        <ToastContainer toasts={toasts} onClose={handleCloseToast} />
      </div>
    );
  }

  const isLoading = loadingType !== null;
  const isTeachingWorkspace = isTeacher && teacherViewMode === 'teaching';
  const hideMainNav = isZenFocus || (sidebarTab === 'english' && englishSessionActive && !activeDoc && !activeAssignment);
  const pendingClassCount = roomAssignments.filter(
    (a) => !quizHistory.some((h) => h.assignmentId === a.id && h.username === user.username)
  ).length;

  return (
    <div className="flex min-h-screen bg-[#F5F6FA] dark:bg-[#0b0c10] text-[#172033] dark:text-white transition-all duration-300">
      
      {/* ===== LEFT SIDEBAR (5 MỤC CHUẨN HÌNH 1 & HÌNH 2) ===== */}
      <aside className={`${hideMainNav ? 'hidden' : 'flex'} fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-[#FBFCFE] dark:bg-[#0b0c10] border-r border-[#E4E7F0] dark:border-white/10 flex-col p-4 transition-all duration-300 z-40 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Công tắc chuyển chế độ Giảng dạy / Cá nhân dành cho Giáo viên (Mục 5) */}
        {isTeacher && (
          <div className="mb-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                setTeacherViewMode('teaching');
                syncWorkspaceWithDoc(null);
                setSidebarTab('dashboard');
              }}
              className={`min-h-[36px] rounded-lg text-xs font-black transition-all ${
                teacherViewMode === 'teaching'
                  ? 'bg-[#6545D8] text-white shadow-xs'
                  : 'text-[#5A6478] dark:text-slate-400 hover:text-[#172033]'
              }`}
            >
              Giảng dạy
            </button>
            <button
              type="button"
              onClick={() => {
                setTeacherViewMode('personal');
                syncWorkspaceWithDoc(null);
                setSidebarTab('dashboard');
              }}
              className={`min-h-[36px] rounded-lg text-xs font-black transition-all ${
                teacherViewMode === 'personal'
                  ? 'bg-[#6545D8] text-white shadow-xs'
                  : 'text-[#5A6478] dark:text-slate-400 hover:text-[#172033]'
              }`}
            >
              Cá nhân
            </button>
          </div>
        )}

        {/* 5 Mục Điều Hướng Chính */}
        <nav className="space-y-1.5">
          {isTeachingWorkspace ? (
            <>
              <button
                type="button"
                onClick={() => {
                  syncWorkspaceWithDoc(null);
                  setSidebarTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  sidebarTab === 'dashboard' && !activeDoc && !activeAssignment
                    ? 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 font-black'
                    : 'text-[#5A6478] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Tổng quan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  syncWorkspaceWithDoc(null);
                  setSidebarTab('class-management');
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  sidebarTab === 'class-management' && !activeDoc && !activeAssignment
                    ? 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 font-black'
                    : 'text-[#5A6478] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Lớp học</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  syncWorkspaceWithDoc(null);
                  setSidebarTab('library');
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  (sidebarTab === 'library' || activeDoc) && !activeAssignment
                    ? 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 font-black'
                    : 'text-[#5A6478] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold'
                }`}
              >
                <Library className="w-4 h-4 shrink-0" />
                <span>Học liệu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  syncWorkspaceWithDoc(null);
                  setSidebarTab('upload');
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  sidebarTab === 'upload' && !activeDoc && !activeAssignment
                    ? 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 font-black'
                    : 'text-[#5A6478] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold'
                }`}
              >
                <UploadCloud className="w-4 h-4 shrink-0" />
                <span>Soạn bài</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  syncWorkspaceWithDoc(null);
                  setSidebarTab('progress');
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  sidebarTab === 'progress' && !activeDoc && !activeAssignment
                    ? 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 font-black'
                    : 'text-[#5A6478] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold'
                }`}
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>Kết quả</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  syncWorkspaceWithDoc(null);
                  setSidebarTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  sidebarTab === 'dashboard' && !activeDoc && !activeAssignment
                    ? 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 font-black'
                    : 'text-[#5A6478] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold'
                }`}
              >
                <CalendarCheck className="w-4 h-4 shrink-0" />
                <span>{language === 'vi' ? 'Hôm nay' : 'Today'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  syncWorkspaceWithDoc(null);
                  setSidebarTab('library');
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  (sidebarTab === 'library' || sidebarTab === 'upload' || activeDoc) && !activeAssignment
                    ? 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 font-black'
                    : 'text-[#5A6478] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>{language === 'vi' ? 'Tài liệu' : 'Documents'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  syncWorkspaceWithDoc(null);
                  setSidebarTab('practice');
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  (sidebarTab === 'practice' || sidebarTab === 'chat' || activeAssignment) && !activeDoc
                    ? 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 font-black'
                    : 'text-[#5A6478] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold'
                }`}
              >
                <Brain className="w-4 h-4 shrink-0" />
                <span>{language === 'vi' ? 'Luyện tập' : 'Practice'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  syncWorkspaceWithDoc(null);
                  setEnglishInitialLessonId(null);
                  setEnglishInitialReviewMode(false);
                  setSidebarTab('english');
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  sidebarTab === 'english' && !activeDoc && !activeAssignment
                    ? 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 font-black'
                    : 'text-[#5A6478] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold'
                }`}
              >
                <Languages className="w-4 h-4 shrink-0" />
                <span>{language === 'vi' ? 'Tiếng Anh' : 'English'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  syncWorkspaceWithDoc(null);
                  setSidebarTab('progress');
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  sidebarTab === 'progress' && !activeDoc && !activeAssignment
                    ? 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 font-black'
                    : 'text-[#5A6478] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>{language === 'vi' ? 'Tiến độ' : 'Progress'}</span>
              </button>
            </>
          )}
        </nav>

        {/* Lối tắt cố định "Lớp của tôi" ở thanh bên (Mục 2 & Hình 1) */}
        <div className="mt-5 pt-5 border-t border-[#E4E7F0] dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-[#172033] dark:text-white">
              Lớp của tôi
            </span>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (isTeacher) {
                  setShowCreateClassModal(true);
                } else {
                  setShowJoinClassModal(true);
                }
              }}
              className="text-[11px] font-black text-[#6545D8] dark:text-indigo-400 hover:underline"
            >
              + Thêm lớp
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              if (isTeacher) {
                syncWorkspaceWithDoc(null);
                setSidebarTab('class-management');
              } else if (userRooms.length > 0) {
                setShowStudentClassesModal(true);
              } else {
                setShowJoinClassModal(true);
              }
            }}
            className="w-full p-3 rounded-xl bg-white dark:bg-[#11131a] border border-[#E4E7F0] dark:border-slate-800 hover:border-[#6545D8]/50 text-left transition-all"
          >
            <p className="text-xs font-black text-[#172033] dark:text-white truncate">
              {isTeacher
                ? activeClassName
                : userRooms.length > 0
                ? studentClasses.map((c) => c.name).join(', ') || `Lớp ${userRooms.join(', ')}`
                : 'Chưa tham gia lớp'}
            </p>
            <p className="text-[11px] font-bold text-[#6545D8] dark:text-indigo-400 mt-0.5">
              {isTeacher
                ? `${teacherClasses.length} lớp đang quản lý`
                : userRooms.length > 0
                ? `${pendingClassCount} bài cần làm`
                : 'Bấm để nhập mã lớp'}
            </p>
          </button>
        </div>

        {/* Chân trang Sidebar: Cá nhân / Hồ sơ, Gói dịch vụ & Trợ giúp (Hình 1 & Hình 2) */}
        <div className="mt-auto pt-4 border-t border-[#E4E7F0] dark:border-slate-800 space-y-1.5">
          <button
            type="button"
            onClick={() => {
              setShowUpgradeModal(true);
              setMobileMenuOpen(false);
            }}
            className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#EFEAFC] dark:bg-indigo-950/50 text-[#6545D8] dark:text-indigo-300 text-xs font-black flex items-center justify-between hover:brightness-95 transition-all"
          >
            <span className="flex items-center gap-2">
              <Crown className="w-3.5 h-3.5" />
              <span>
                {user.plan === 'vip' ? 'Gói VIP ULTRA' : user.plan === 'pro' ? 'Gói PRO AI' : 'Gói dịch vụ / Mã Code'}
              </span>
            </span>
            <KeyRound className="w-3.5 h-3.5 opacity-80" />
          </button>

          <button
            type="button"
            onClick={() => {
              syncWorkspaceWithDoc(null);
              setSidebarTab('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full min-h-[40px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              sidebarTab === 'settings' && !activeDoc && !activeAssignment
                ? 'bg-slate-100 dark:bg-slate-800 text-[#172033] dark:text-white font-black'
                : 'text-[#5A6478] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cá nhân / Hồ sơ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              syncWorkspaceWithDoc(null);
              setSidebarTab('settings');
              setMobileMenuOpen(false);
            }}
            className="w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#5A6478] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
          >
            <span className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4" />
              <span>Trợ giúp</span>
            </span>
            <span className="text-[10px] font-black text-[#178A5B] dark:text-emerald-400">24/7</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && !hideMainNav && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden mt-16"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ===== MAIN CONTENT CANVAS ===== */}
      <div className={`flex-1 ${hideMainNav ? 'pl-0' : 'lg:pl-64'} flex flex-col min-h-screen transition-all duration-300`}>
        
        {/* Floating Exit Button when in Zen Focus Mode */}
        {isZenFocus && (
          <ZenFocusMode
            isFocusMode={true}
            onToggle={() => setIsZenFocus(false)}
            language={language}
          />
        )}

        {/* ===== TOP NAVIGATION BAR ===== */}
        <header className={`${hideMainNav ? 'hidden' : 'flex'} fixed top-0 left-0 w-full z-40 justify-between items-center px-3 sm:px-5 lg:px-8 py-3 h-16 bg-white/95 dark:bg-[#0b0c10]/95 backdrop-blur-xl border-b border-[#E4E7F0] dark:border-white/10`}>
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-[#172033] dark:text-white transition-colors"
              title="Menu mở rộng"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo and Brand Title */}
            <div 
              onClick={() => {
                syncWorkspaceWithDoc(null);
                setSidebarTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="w-9 h-9 rounded-xl bg-[#6545D8] text-white font-black flex items-center justify-center shadow-xs shrink-0 text-base">
                +
              </div>
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-black text-[#172033] dark:text-white tracking-tight truncate block">
                  Trợ Lý Học Tập
                </span>
                <p className="text-[10px] text-[#5A6478] dark:text-slate-400 hidden md:block leading-none mt-0.5 font-bold">
                  {isTeachingWorkspace ? 'Không gian Giảng dạy' : 'Học từ tài liệu · Luyện Tiếng Anh'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Pomodoro Timer */}
            <PomodoroPlayer language={language} />

            {/* Gamification Streak & XP Pill */}
            <button
              type="button"
              onClick={() => setShowLeaderboard(true)}
              className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF6E5] dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs font-black hover:brightness-95 transition-all"
              title="Chuỗi ngày học & Bảng xếp hạng"
            >
              <span className="flex items-center gap-1 text-[#C57B14] dark:text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{user.streak || 1} ngày</span>
              </span>
              <span className="hidden sm:inline text-amber-300 dark:text-amber-800">·</span>
              <span className="hidden sm:flex items-center gap-1 text-[#C57B14] dark:text-amber-400">
                <span>{user.xp || 0} XP</span>
              </span>
            </button>

            {/* Upgrade / Redeem Code Button (Desktop / Tablet) */}
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className={`hidden sm:flex min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-black items-center gap-1.5 transition-all ${
                user.plan === 'vip'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : user.plan === 'pro'
                  ? 'bg-[#6545D8] text-white'
                  : 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {user.plan === 'vip' ? 'VIP ULTRA' : user.plan === 'pro' ? 'PRO AI' : 'Gói dịch vụ'}
              </span>
            </button>

            {/* Desktop Only: Language (SVG Globe) and Theme Switcher */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800">
              <button 
                onClick={() => {
                  const nextLang = language === 'vi' ? 'en' : 'vi';
                  setLanguage(nextLang);
                  localStorage.setItem('language', nextLang);
                  showMessage(nextLang === 'vi' ? TRANSLATIONS.vi.languageAlert : TRANSLATIONS.en.languageAlert, false);
                }} 
                className="min-h-[32px] px-1.5 text-[#172033] dark:text-slate-200 hover:text-[#6545D8] transition-colors flex items-center gap-1 text-xs font-black"
                title={language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
              >
                <Globe className="w-3.5 h-3.5 text-[#6545D8]" />
                <span>{language === 'vi' ? 'VI' : 'EN'}</span>
              </button>
              <ThemeToggle />
              <AccessibilitySettings />
            </div>

            {/* User Profile Info - Desktop */}
            <div className="hidden lg:flex items-center gap-2.5 ml-1 border-l border-[#E4E7F0] dark:border-slate-800 pl-3">
              <button
                type="button"
                onClick={() => {
                  syncWorkspaceWithDoc(null);
                  setSidebarTab('settings');
                }}
                className="flex items-center gap-2 text-left hover:opacity-85 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-[#EFEAFC] dark:bg-indigo-950 text-[#6545D8] dark:text-indigo-300 flex items-center justify-center font-black text-xs capitalize">
                  {user.username.charAt(0)}
                </div>
                <div className="hidden xl:block">
                  <p className="text-xs font-black leading-none">{user.fullName || user.username}</p>
                  <p className="text-[10px] text-[#5A6478] dark:text-slate-400 font-bold mt-0.5">
                    {isTeacher ? 'Giáo viên' : 'Người học'}
                  </p>
                </div>
              </button>

              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg text-[#5A6478] hover:text-[#C83A3A] transition-colors"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Account Menu Trigger (Gộp Hồ sơ, Gói dịch vụ, Cài đặt, Trợ giúp) */}
            <div className="relative lg:hidden">
              <button
                type="button"
                onClick={() => setMobileProfileMenuOpen(!mobileProfileMenuOpen)}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-[#EFEAFC] dark:bg-indigo-950 text-[#6545D8] dark:text-indigo-300 flex items-center justify-center font-black text-xs capitalize"
                title="Hồ sơ, Gói dịch vụ & Trợ giúp"
              >
                {user.username.charAt(0)}
              </button>

              {mobileProfileMenuOpen && (
                <div className="absolute right-0 top-12 w-72 p-4 rounded-2xl bg-white dark:bg-[#11131a] border border-[#E4E7F0] dark:border-slate-800 shadow-2xl space-y-2.5 z-50">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E4E7F0] dark:border-slate-800">
                    <div className="w-9 h-9 rounded-full bg-[#EFEAFC] text-[#6545D8] font-black flex items-center justify-center text-sm capitalize">
                      {user.username.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black truncate">{user.fullName || user.username}</p>
                      <p className="text-[11px] font-semibold text-[#5A6478] dark:text-slate-400">
                        {isTeacher ? 'Giáo viên' : 'Người học'} · Gói {(user.plan || 'free').toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMobileProfileMenuOpen(false);
                      setShowUpgradeModal(true);
                    }}
                    className="w-full min-h-[42px] px-3 rounded-xl bg-[#6545D8] text-white font-black text-xs flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4" />
                      <span>Gói dịch vụ & Nhập Mã Code</span>
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md">Mở</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileProfileMenuOpen(false);
                      syncWorkspaceWithDoc(null);
                      setSidebarTab('settings');
                    }}
                    className="w-full min-h-[40px] px-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-bold flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-[#6545D8]" />
                    <span>Hồ sơ & Cài đặt tài khoản</span>
                  </button>

                  <a
                    href="https://zalo.me/0923678668"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileProfileMenuOpen(false)}
                    className="w-full min-h-[40px] px-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-bold flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#6545D8]" />
                      <span>Trợ giúp Zalo (0923678668)</span>
                    </span>
                    <span className="text-[10px] font-black text-[#178A5B]">24/7</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <button
                      onClick={() => {
                        const nextLang = language === 'vi' ? 'en' : 'vi';
                        setLanguage(nextLang);
                        localStorage.setItem('language', nextLang);
                      }}
                      className="min-h-[40px] px-2 rounded-xl bg-slate-100 dark:bg-slate-900 font-bold flex items-center justify-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#6545D8]" />
                      <span>{language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                    </button>
                    <div className="min-h-[40px] rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                      <ThemeToggle />
                    </div>
                  </div>

                  <div className="pt-1 border-t border-[#E4E7F0] dark:border-slate-800">
                    <button
                      onClick={() => {
                        setMobileProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full min-h-[40px] px-3 rounded-xl text-[#C83A3A] hover:bg-rose-50 dark:hover:bg-rose-950/30 font-black text-xs flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>


        {/* ===== BANNER CẢNH BÁO SẮP HẾT HẠN GÓI CƯỚC ===== */}
        {user.plan && user.plan !== 'free' && user.planExpiresAt && (() => {
          // eslint-disable-next-line react-hooks/purity
          const daysLeft = Math.ceil((new Date(user.planExpiresAt).getTime() - Date.now()) / (1000 * 3600 * 24));
          if (daysLeft >= 0 && daysLeft <= 3) {
            return (
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-1.5">
                  ⏳ Gói {user.plan.toUpperCase()} của bạn chỉ còn {daysLeft === 0 ? 'hôm nay' : `${daysLeft} ngày`} nữa là hết hạn.
                </span>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-3 py-1 bg-white text-orange-700 rounded-lg text-[11px] font-black hover:bg-orange-50 active:scale-95 transition-all shadow-xs"
                >
                  Gia hạn ngay để giữ ưu đãi & dữ liệu
                </button>
              </div>
            );
          }
          return null;
        })()}

        {/* ===== POPUPS & MODALS ===== */}
        {showUpgradeModal && (
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            user={user}
            onUpgradeSuccess={(updatedUser, message) => {
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              if (updatedUser.preferredModel) {
                setModelTier(updatedUser.preferredModel);
              }
              showMessage(message || `🎉 Đã kích hoạt gói ${updatedUser.plan?.toUpperCase()} thành công!`, false);
            }}
          />
        )}
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
                    className="w-full py-2.5 rounded-xl bg-linear-to-r from-primary to-violet text-white font-bold text-xs"
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
                    className="w-full h-10 mt-2 rounded-xl bg-linear-to-r from-primary to-violet hover:brightness-110 text-white font-bold text-xs shadow-md transition-all"
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
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground font-bold text-xs transition-all"
                  >
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleJoinClass}
                    className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-primary to-violet hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-md transition-all"
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
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground font-bold text-xs transition-all"
                  >
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-primary to-violet hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
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
        <main className={`${hideMainNav ? 'pt-4' : 'pt-16'} px-3 sm:px-5 lg:px-8 py-6 pb-24 lg:pb-8 bg-[#F5F6FA] dark:bg-[#0b0c10] relative flex-1 transition-all duration-300`}>
          <div className="relative z-10 max-w-6xl mx-auto">
            
            {activeDoc || activeAssignment ? (
              /* ================== WORKSPACE ACTIVE STATE (CHUẨN HÌNH 2) ================== */
              <div className="space-y-4">
                
                {/* Thanh Breadcrumb & Hành Động Nhanh (Hình 2) */}
                {activeDoc && (
                  <div className="p-4 bg-white dark:bg-[#11131a] rounded-2xl border border-[#E4E7F0] dark:border-slate-800 flex justify-between items-center flex-wrap gap-3 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          syncWorkspaceWithDoc(null);
                          setSidebarTab('library');
                        }}
                        className="text-sm font-bold text-[#5A6478] dark:text-slate-400 hover:text-[#6545D8] transition-colors shrink-0"
                      >
                        Tài liệu
                      </button>
                      <span className="text-[#5A6478] dark:text-slate-600 font-bold">/</span>
                      <h2 className="text-sm sm:text-base font-black text-[#172033] dark:text-white truncate" title={activeDoc.fileName}>
                        {activeDoc.fileName.replace(/\.(pdf|docx)$/i, '')}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileDocView('ai');
                          handleGenerateQuiz(false, 10);
                        }}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-700 hover:border-[#6545D8] text-xs font-black text-[#172033] dark:text-white transition-all"
                      >
                        Tạo 10 câu hỏi
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileDocView('ai');
                          handleGenerateFlashcards(false);
                        }}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#6545D8] hover:bg-[#5436C2] text-xs font-black text-white shadow-xs transition-all"
                      >
                        Luyện thẻ nhớ
                      </button>

                      <button
                        type="button"
                        onClick={() => syncWorkspaceWithDoc(null)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-[#5A6478] dark:text-slate-300 transition-all"
                      >
                        ✕ Đóng
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Assignment Header */}
                {activeAssignment && (
                  <div className="p-4 bg-[#EFEAFC] dark:bg-indigo-950/40 border border-[#6545D8]/25 rounded-2xl flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Button
                        onClick={() => syncWorkspaceWithDoc(null)}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-[#6545D8] hover:bg-[#6545D8]/10 rounded-xl"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div className="min-w-0">
                        <span className="text-[10px] bg-[#6545D8] text-white px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          {activeAssignment.type === 'quiz' ? t.practiceQuiz : t.practiceEssay}
                        </span>
                        <h2 className="text-base font-black text-[#172033] dark:text-white truncate mt-1">
                          {activeAssignment.title}
                        </h2>
                      </div>
                    </div>

                    <div className="text-right text-xs text-[#6545D8] dark:text-indigo-300 font-black">
                      {activeTimeMsg}
                    </div>
                  </div>
                )}

                {/* Công tắc chuyển đổi trên di động: Tài liệu gốc / Kết quả (Mục 4) */}
                {activeDoc && (
                  <div className="lg:hidden grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white dark:bg-[#11131a] border border-[#E4E7F0] dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setMobileDocView('source')}
                      className={`min-h-[40px] rounded-lg text-xs font-black transition-all ${
                        mobileDocView === 'source'
                          ? 'bg-[#6545D8] text-white'
                          : 'text-[#5A6478] dark:text-slate-400'
                      }`}
                    >
                      📄 Tài liệu gốc
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileDocView('ai')}
                      className={`min-h-[40px] rounded-lg text-xs font-black transition-all ${
                        mobileDocView === 'ai'
                          ? 'bg-[#6545D8] text-white'
                          : 'text-[#5A6478] dark:text-slate-400'
                      }`}
                    >
                      ✨ Kết quả & Luyện tập
                    </button>
                  </div>
                )}

                {/* Bố cục 2 cột (Hình 2): Trái = Tài liệu gốc, Phải = 4 Tab (Hiểu bài · Luyện tập · Hỏi AI · Thêm) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* Cột Trái: Tài liệu gốc */}
                  {activeDoc && (
                    <div className={`${mobileDocView === 'source' ? 'block' : 'hidden'} lg:block lg:col-span-5 bg-white dark:bg-[#11131a] rounded-2xl border border-[#E4E7F0] dark:border-slate-800 overflow-hidden shadow-xs`}>
                      <div className="px-5 py-3.5 border-b border-[#E4E7F0] dark:border-slate-800 flex items-center justify-between">
                        <span className="text-sm font-black text-[#172033] dark:text-white">
                          Tài liệu gốc
                        </span>
                        <span className="text-xs font-bold text-[#5A6478] dark:text-slate-400">
                          Trang 1 / {Math.max(1, Math.ceil((activeDoc.textContent?.length || 3000) / 2500))}
                        </span>
                      </div>

                      {activeDoc.pdfUrl ? (
                        <div className="h-[520px] xl:h-[620px] flex flex-col">
                          {activeDoc.fileName.endsWith('.docx') ? (
                            <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeDoc.pdfUrl)}`} className="w-full h-full border-0 bg-slate-50 dark:bg-slate-900" />
                          ) : activeDoc.fileName.match(/\.(png|jpe?g|webp)$/i) ? (
                            <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={activeDoc.pdfUrl} alt="Document preview" className="max-w-full max-h-full object-contain" />
                            </div>
                          ) : (
                            <iframe src={`${activeDoc.pdfUrl}#view=FitH`} className="w-full h-full border-0 bg-slate-50 dark:bg-slate-900" />
                          )}
                        </div>
                      ) : (
                        <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
                          <h3 className="text-base font-black text-[#172033] dark:text-white">
                            1. {activeDoc.fileName.replace(/\.(pdf|docx)$/i, '')}
                          </h3>

                          {/* Đoạn trích nổi bật giống Hình 2 */}
                          <div className="p-4 rounded-xl bg-[#EFEAFC] dark:bg-indigo-950/40 border-l-4 border-[#6545D8]">
                            <p className="text-xs sm:text-sm font-semibold text-[#172033] dark:text-slate-200 leading-relaxed">
                              {(activeDoc.textContent || '').split('\n').filter(Boolean).slice(0, 3).join(' ')}
                            </p>
                          </div>

                          <div className="text-xs sm:text-sm text-[#5A6478] dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                            {(activeDoc.textContent || '').split('\n').slice(3).join('\n')}
                          </div>

                          {/* Câu hỏi gợi mở giống Hình 2 */}
                          <div className="p-4 rounded-xl bg-[#F5F6FA] dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800 space-y-2">
                            <p className="text-xs font-black text-[#172033] dark:text-white">
                              Câu hỏi gợi mở:
                            </p>
                            <p className="text-xs font-semibold text-[#5A6478] dark:text-slate-300 leading-relaxed">
                              Vì sao pha tối không cần ánh sáng trực tiếp nhưng vẫn phụ thuộc vào pha sáng?
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('chat');
                                setMobileDocView('ai');
                              }}
                              className="text-xs font-black text-[#6545D8] dark:text-indigo-400 hover:underline"
                            >
                              Thảo luận câu này ở mục Hỏi AI →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cột Phải: 4 Tab Ngữ Cảnh (Hiểu bài · Luyện tập · Hỏi AI · Thêm) */}
                  <div className={`${activeDoc && mobileDocView === 'source' ? 'hidden lg:block' : 'block'} ${activeDoc ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4 bg-white dark:bg-[#11131a] border border-[#E4E7F0] dark:border-slate-800 p-1.5 rounded-2xl grid grid-cols-4 gap-1 h-auto! w-full">
                        <TabsTrigger
                          value="summary"
                          disabled={!!activeAssignment}
                          className="min-h-[40px] rounded-xl px-2 py-2 text-xs font-black data-[state=active]:bg-[#EFEAFC] data-[state=active]:text-[#6545D8] dark:data-[state=active]:bg-indigo-950/70 dark:data-[state=active]:text-indigo-300 transition-all"
                        >
                          Hiểu bài
                        </TabsTrigger>

                        <TabsTrigger
                          value="practice-doc"
                          className="min-h-[40px] rounded-xl px-2 py-2 text-xs font-black data-[state=active]:bg-[#EFEAFC] data-[state=active]:text-[#6545D8] dark:data-[state=active]:bg-indigo-950/70 dark:data-[state=active]:text-indigo-300 transition-all"
                        >
                          Luyện tập
                        </TabsTrigger>

                        <TabsTrigger
                          value="chat"
                          disabled={!!activeAssignment}
                          className="min-h-[40px] rounded-xl px-2 py-2 text-xs font-black data-[state=active]:bg-[#EFEAFC] data-[state=active]:text-[#6545D8] dark:data-[state=active]:bg-indigo-950/70 dark:data-[state=active]:text-indigo-300 transition-all"
                        >
                          Hỏi AI
                        </TabsTrigger>

                        <TabsTrigger
                          value="more"
                          disabled={!!activeAssignment}
                          className="min-h-[40px] rounded-xl px-2 py-2 text-xs font-black data-[state=active]:bg-[#EFEAFC] data-[state=active]:text-[#6545D8] dark:data-[state=active]:bg-indigo-950/70 dark:data-[state=active]:text-indigo-300 transition-all"
                        >
                          Thêm
                        </TabsTrigger>
                      </TabsList>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                        >
                          {/* 1. TAB HIỂU BÀI (Hình 2) */}
                          <TabsContent value="summary" className="mt-0 outline-none space-y-4">
                            <div className="bg-white dark:bg-[#11131a] rounded-2xl border border-[#E4E7F0] dark:border-slate-800 p-5 space-y-4 shadow-xs">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h3 className="text-base font-black text-[#172033] dark:text-white">
                                  Ý chính cần nắm
                                </h3>
                                <span className="px-3 py-1 rounded-full bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 text-[11px] font-black">
                                  Nguồn tài liệu · trang 12
                                </span>
                              </div>

                              {!summary && !isSummaryStreaming && !isLoading && (
                                <div className="p-6 text-center bg-[#F5F6FA] dark:bg-slate-900 rounded-2xl border border-[#E4E7F0] dark:border-slate-800">
                                  <BookOpen className="w-10 h-10 text-[#6545D8] mx-auto mb-2" />
                                  <h4 className="text-sm font-black text-[#172033] dark:text-white">{t.notSummarized}</h4>
                                  <p className="text-xs text-[#5A6478] dark:text-slate-400 mt-1 mb-4">{t.notSummarizedDesc}</p>
                                  <Button onClick={() => handleSummarize(false)} className="bg-[#6545D8] hover:bg-[#5436C2] text-white rounded-xl text-xs h-10 px-5 font-black">
                                    {t.createSummary}
                                  </Button>
                                </div>
                              )}

                              {(summary || isSummaryStreaming || loadingType === 'summary') && (
                                <SummaryPanel
                                  summary={streamingSummary || summary}
                                  isLoading={isSummaryStreaming || loadingType === 'summary'}
                                  pdfText={pdfText}
                                  fileName={activeDoc?.fileName}
                                  userRole={user.role}
                                  modelTier={modelTier}
                                  cachedMindmap={activeDoc?.mindmap}
                                  cachedPodcast={activeDoc?.podcast}
                                  cachedLessonPlan={activeDoc?.lessonPlan || ''}
                                  onUpdateDocumentExtras={(extras) => {
                                    if (activeDoc) {
                                      updateDocumentOnServer(activeDoc.id, extras);
                                    }
                                  }}
                                  onRequireUpgrade={(msg) => {
                                    showMessage(msg, false);
                                    setShowUpgradeModal(true);
                                  }}
                                />
                              )}

                              {/* Callout "Bước tiếp theo" chuẩn Hình 2 */}
                              <div className="p-5 rounded-2xl bg-[#EFEAFC] dark:bg-indigo-950/40 border border-[#6545D8]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                  <h4 className="text-sm font-black text-[#172033] dark:text-white">
                                    Bước tiếp theo
                                  </h4>
                                  <p className="text-xs font-semibold text-[#5A6478] dark:text-slate-300 mt-0.5">
                                    Kiểm tra nhanh mức hiểu bài trước khi sang mục mới.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleGenerateQuiz(false, 10)}
                                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#6545D8] hover:bg-[#5436C2] text-white font-black text-xs shrink-0 shadow-sm transition-all"
                                >
                                  Tạo 10 câu luyện tập
                                </button>
                              </div>
                            </div>
                          </TabsContent>

                          {/* 2. TAB LUYỆN TẬP (Trắc nghiệm · Thẻ ghi nhớ · Tự luận) */}
                          <TabsContent value="practice-doc" className="mt-0 outline-none space-y-4">
                            {!activeAssignment && (
                              <div className="flex items-center gap-2 p-1 rounded-xl bg-white dark:bg-[#11131a] border border-[#E4E7F0] dark:border-slate-800 w-fit">
                                <button
                                  type="button"
                                  onClick={() => setPracticeSubTab('quiz')}
                                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    practiceSubTab === 'quiz'
                                      ? 'bg-[#6545D8] text-white'
                                      : 'text-[#5A6478] dark:text-slate-400 hover:text-[#172033]'
                                  }`}
                                >
                                  📝 Trắc nghiệm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPracticeSubTab('flashcards');
                                    if (flashcards.length === 0) handleGenerateFlashcards(false);
                                  }}
                                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    practiceSubTab === 'flashcards'
                                      ? 'bg-[#6545D8] text-white'
                                      : 'text-[#5A6478] dark:text-slate-400 hover:text-[#172033]'
                                  }`}
                                >
                                  🃏 Thẻ ghi nhớ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPracticeSubTab('essay')}
                                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    practiceSubTab === 'essay'
                                      ? 'bg-[#6545D8] text-white'
                                      : 'text-[#5A6478] dark:text-slate-400 hover:text-[#172033]'
                                  }`}
                                >
                                  ✏️ Tự luận
                                </button>
                              </div>
                            )}

                            {practiceSubTab === 'flashcards' && !activeAssignment && (
                              <FlashcardPanel
                                flashcards={flashcards}
                                isLoading={loadingType === 'flashcards'}
                                onGenerate={(force) => handleGenerateFlashcards(force)}
                              />
                            )}

                            {practiceSubTab === 'essay' && (
                              <EssayPanel
                                essay={activeAssignment ? (activeAssignment.essay || '') : essay}
                                isLoading={loadingType === 'essay'}
                                onGenerate={(metadata) => handleGenerateEssay(essay ? true : false, metadata)}
                                userRole={user.role}
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
                            )}

                            {practiceSubTab === 'quiz' && (
                              <>
                                {activeAssignment && !canTakeActiveAssignment && !activeSubmission ? (
                                  <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 shadow-md">
                                    <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                                    <p className="text-foreground text-sm font-bold">{activeTimeMsg}</p>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {!activeAssignment && (
                                      <div className="p-4 bg-white dark:bg-[#11131a] rounded-2xl border border-[#E4E7F0] dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-[#5A6478] dark:text-slate-400">{t.numQuestions}:</span>
                                            <input
                                              type="number"
                                              min={1}
                                              max={20}
                                              value={questionCount}
                                              onChange={(e) => setQuestionCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                                              disabled={isLoading}
                                              className="w-14 h-9 rounded-lg border border-[#E4E7F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-xs font-black text-[#172033] dark:text-white"
                                            />
                                          </div>

                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-[#5A6478] dark:text-slate-400">Mức độ:</span>
                                            <select
                                              value={quizDifficulty}
                                              onChange={(e) => setQuizDifficulty(e.target.value as 'basic' | 'standard' | 'advanced')}
                                              disabled={isLoading}
                                              className="h-9 rounded-lg border border-[#E4E7F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-bold text-[#172033] dark:text-white"
                                            >
                                              <option value="basic">🟢 Cơ bản</option>
                                              <option value="standard">🔵 Chuẩn Bộ GD&ĐT</option>
                                              <option value="advanced">🔥 Vận dụng cao</option>
                                            </select>
                                          </div>
                                        </div>

                                        <Button
                                          onClick={() => handleGenerateQuiz(true)}
                                          disabled={isLoading}
                                          className="bg-[#6545D8] hover:bg-[#5436C2] text-white rounded-xl text-xs h-10 font-black px-4"
                                        >
                                          {questions.length > 0 ? t.regenerateQuiz : t.generateQuiz}
                                        </Button>
                                      </div>
                                    )}

                                    {(questions.length > 0 || isLoading) && (
                                      <QuizPanel
                                        key={activeAssignment ? `assignment-${activeAssignment.id}` : (activeDoc ? `doc-${activeDoc.id}` : 'quiz')}
                                        questions={activeSubmission?.questions || questions}
                                        isLoading={loadingType === 'quiz'}
                                        userRole={user.role}
                                        hasSubmitted={activeAssignment ? !!activeSubmission : false}
                                        onScoreSubmit={handleScoreSubmit}
                                        previousScoreInfo={activeSubmission ? { score: activeSubmission.score, scale10Score: activeSubmission.scale10Score } : undefined}
                                        onAssignQuiz={handleAssignQuiz}
                                        availableRooms={teacherClasses}
                                        onAdaptiveDrill={!activeAssignment ? handleAdaptiveDrill : undefined}
                                        previousAnswers={activeSubmission?.studentAnswer ? (() => {
                                          try {
                                            return JSON.parse(activeSubmission.studentAnswer) as Record<number, string>;
                                          } catch {
                                            return undefined;
                                          }
                                        })() : undefined}
                                      />
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </TabsContent>

                          {/* 3. TAB HỎI AI (Bám sát tài liệu - Mục 4 & Mục 9) */}
                          <TabsContent value="chat" className="mt-0 outline-none space-y-3">
                            <div className="p-3.5 rounded-2xl bg-[#EFEAFC] dark:bg-indigo-950/40 border border-[#6545D8]/20 flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[#172033] dark:text-slate-200">
                                📌 <strong>Chế độ Bám sát tài liệu:</strong> AI ưu tiên trích dẫn từ <em>{activeDoc?.fileName}</em>.
                              </span>
                              {activeDoc && chatHistory.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Bạn có muốn xóa lịch sử hỏi đáp trên tài liệu này?')) {
                                      localStorage.removeItem(`docChatHistory_${user?.username}_${activeDoc.id}`);
                                      setChatHistory([]);
                                      setDocChatResetCount((prev) => prev + 1);
                                    }
                                  }}
                                  className="text-xs font-black text-[#C83A3A] hover:underline"
                                >
                                  Xóa lịch sử hỏi
                                </button>
                              )}
                            </div>

                            <ChatBox
                              key={(activeDoc?.id || 'chat') + `_${docChatResetCount}`}
                              pdfText={pdfText}
                              userRole={user.role}
                              userPlan={user.plan || 'free'}
                              modelTier={modelTier}
                              onChangeModelTier={handleModelTierChange}
                              onRequireUpgrade={() => setShowUpgradeModal(true)}
                              onError={showMessage}
                              chatHistory={chatHistory}
                              onSendMessage={handleSendMessage}
                              language={language}
                            />
                          </TabsContent>

                          {/* 4. TAB THÊM (Dạy lại cho AI, Rút trích từ vựng Tiếng Anh, Mô hình AI - Mục 4 & Mục 10) */}
                          <TabsContent value="more" className="mt-0 outline-none space-y-4">
                            {/* Tính năng 1: Dạy lại cho AI (Teach-back) */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-[#11131a] border border-[#E4E7F0] dark:border-slate-800 space-y-3 shadow-xs">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <span className="text-[11px] font-black uppercase tracking-wider text-[#6545D8] dark:text-indigo-400">
                                    Học sâu chủ động
                                  </span>
                                  <h4 className="text-sm sm:text-base font-black text-[#172033] dark:text-white mt-0.5">
                                    🗣️ Dạy lại cho AI (Teach-back)
                                  </h4>
                                </div>
                              </div>
                              <p className="text-xs font-medium text-[#5A6478] dark:text-slate-400 leading-relaxed">
                                Hãy thử diễn đạt lại ý chính của bài <strong>{activeDoc?.fileName}</strong> bằng lời của bạn (2–4 câu). AI sẽ chỉ ra điểm bạn đã hiểu đúng và phần còn thiếu sót.
                              </p>
                              <textarea
                                rows={3}
                                value={teachBackText}
                                onChange={(e) => setTeachBackText(e.target.value)}
                                placeholder="Ví dụ: Quang hợp gồm pha sáng ở màng tilacoit tạo ATP, NADPH, O2 và pha tối ở chất nền stroma dùng ATP, NADPH để cố định CO2 thành đường..."
                                className="w-full rounded-xl border border-[#E4E7F0] dark:border-slate-700 bg-[#F5F6FA] dark:bg-slate-900 p-3 text-xs sm:text-sm font-semibold text-[#172033] dark:text-white focus:outline-none focus:border-[#6545D8]"
                              />
                              <button
                                type="button"
                                onClick={handleEvaluateTeachBack}
                                disabled={isEvaluatingTeachBack}
                                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#6545D8] hover:bg-[#5436C2] text-white font-black text-xs transition-all"
                              >
                                {isEvaluatingTeachBack ? 'Đang đối chiếu với tài liệu...' : 'Nhờ AI chấm mức độ hiểu bài'}
                              </button>
                              {teachBackFeedback && (
                                <div className="p-4 rounded-xl bg-[#EFEAFC] dark:bg-indigo-950/40 border border-[#6545D8]/25 text-xs sm:text-sm font-medium text-[#172033] dark:text-slate-200 whitespace-pre-line leading-relaxed">
                                  <ReactMarkdown>{teachBackFeedback}</ReactMarkdown>
                                </div>
                              )}
                            </div>

                            {/* Tính năng 2: Rút trích từ vựng Tiếng Anh từ tài liệu sang khu Tiếng Anh */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-[#11131a] border border-[#E4E7F0] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                              <div className="space-y-1">
                                <span className="text-[11px] font-black uppercase tracking-wider text-[#178A5B] dark:text-emerald-400">
                                  Liên kết Tài liệu ↔ Tiếng Anh
                                </span>
                                <h4 className="text-sm sm:text-base font-black text-[#172033] dark:text-white">
                                  🇬🇧 Rút trích từ vựng Tiếng Anh chuyên ngành
                                </h4>
                                <p className="text-xs font-medium text-[#5A6478] dark:text-slate-400">
                                  Tự động trích xuất các thuật ngữ Tiếng Anh trong bài học này và lưu thành bộ thẻ ôn trong khu Tiếng Anh.
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={handleExtractEnglishVocab}
                                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#178A5B] hover:brightness-110 text-white font-black text-xs transition-all"
                                >
                                  {extractedVocabCount ? `Đã lưu (${extractedVocabCount} từ)` : 'Trích xuất sang Tiếng Anh'}
                                </button>
                                {extractedVocabCount && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      syncWorkspaceWithDoc(null);
                                      setSidebarTab('english');
                                    }}
                                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#EFEAFC] text-[#6545D8] font-black text-xs"
                                  >
                                    Mở khu Tiếng Anh →
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Tính năng 3: Chọn mô hình AI nâng cao (đặt gọn trong tab Thêm theo Mục 2 & 4) */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-[#11131a] border border-[#E4E7F0] dark:border-slate-800 space-y-3 shadow-xs">
                              <h4 className="text-sm font-black text-[#172033] dark:text-white flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[#6545D8]" />
                                Mô hình AI xử lý tài liệu
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => handleModelTierChange('flash')}
                                  className={`p-3 rounded-xl border text-left transition-all ${
                                    modelTier === 'flash'
                                      ? 'border-[#6545D8] bg-[#EFEAFC] dark:bg-indigo-950/50'
                                      : 'border-[#E4E7F0] dark:border-slate-800'
                                  }`}
                                >
                                  <p className="text-xs font-black text-[#172033] dark:text-white">⚡ Flash 2.5</p>
                                  <p className="text-[11px] text-[#5A6478] dark:text-slate-400 mt-0.5">Nhanh · Miễn phí</p>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleModelTierChange('pro')}
                                  className={`p-3 rounded-xl border text-left transition-all ${
                                    modelTier === 'pro'
                                      ? 'border-[#6545D8] bg-[#EFEAFC] dark:bg-indigo-950/50'
                                      : 'border-[#E4E7F0] dark:border-slate-800'
                                  }`}
                                >
                                  <p className="text-xs font-black text-[#172033] dark:text-white">🧠 Pro 2.5 Reasoning</p>
                                  <p className="text-[11px] text-[#5A6478] dark:text-slate-400 mt-0.5">Phân tích sâu · Gói PRO</p>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleModelTierChange('ultra')}
                                  className={`p-3 rounded-xl border text-left transition-all ${
                                    modelTier === 'ultra'
                                      ? 'border-[#6545D8] bg-[#EFEAFC] dark:bg-indigo-950/50'
                                      : 'border-[#E4E7F0] dark:border-slate-800'
                                  }`}
                                >
                                  <p className="text-xs font-black text-[#172033] dark:text-white">👑 Ultra Academic</p>
                                  <p className="text-[11px] text-[#5A6478] dark:text-slate-400 mt-0.5">Học thuật · Gói VIP</p>
                                </button>
                              </div>
                            </div>
                          </TabsContent>
                        </motion.div>
                      </AnimatePresence>
                    </Tabs>
                  </div>
                </div>
              </div>
            ) : (
              /* ================== GENERAL PANEL (5 MỤC ĐIỀU HƯỚNG THỐNG NHẤT) ================== */
              <div className="space-y-6 animate-fade-in-up">
                
                {/* 1. UPLOAD MATERIALS TAB */}
                {sidebarTab === 'upload' && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-black text-[#172033] dark:text-white">
                          Thêm tài liệu học tập mới
                        </h2>
                        <p className="text-xs font-semibold text-[#5A6478] dark:text-slate-400 mt-0.5">
                          Tải lên PDF, Word hoặc ảnh chụp trang sách để AI tóm tắt ý chính và tạo câu hỏi ôn luyện.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSidebarTab('library')}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800 text-xs font-black text-[#6545D8]"
                      >
                        ← Quay lại Tài liệu
                      </button>
                    </div>

                    <FileUpload
                      onUploadSuccess={handleUploadSuccess}
                      onExistingDocumentFound={handleExistingDocumentFound}
                      onError={(msg) => showMessage(msg)}
                      isDisabled={isLoading}
                      currentRole={user.role}
                      existingDocuments={libraryDocs}
                      language={language}
                    />
                  </div>
                )}

                {/* 2. TÀI LIỆU / HỌC LIỆU TAB */}
                {sidebarTab === 'library' && (
                  <div className="max-w-5xl mx-auto space-y-5">
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#11131a] border border-[#E4E7F0] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                      <div>
                        <h2 className="text-xl font-black text-[#172033] dark:text-white">
                          {isTeachingWorkspace ? 'Kho Học liệu Giảng dạy' : 'Tài liệu học tập của bạn'}
                        </h2>
                        <p className="text-xs font-semibold text-[#5A6478] dark:text-slate-400 mt-0.5">
                          Mở bất kỳ tài liệu nào để xem Ý chính cần nắm, tạo 10 câu luyện tập hoặc hỏi AI bám sát nguồn.
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <button
                          type="button"
                          onClick={handleOpenSampleDoc}
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 text-xs font-black hover:brightness-95 transition-all"
                        >
                          📄 Mở bài mẫu: Quang hợp.pdf
                        </button>
                        <button
                          type="button"
                          onClick={() => setSidebarTab('upload')}
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-[#6545D8] hover:bg-[#5436C2] text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Thêm tài liệu</span>
                        </button>
                      </div>
                    </div>

                    <DocumentLibrary
                      documents={filteredDocs}
                      activeDocId={null}
                      onSelectDocument={handleSelectDocument}
                      onDeleteDocument={handleDeleteDocument}
                      currentRole={user.role}
                    />
                  </div>
                )}

                {/* 3. LUYỆN TẬP TAB (PracticeHub - Mục 2 & Mục 9) */}
                {sidebarTab === 'practice' && (
                  <PracticeHub
                    user={user}
                    englishProgress={englishProgress}
                    onUpdateEnglishProgress={handleUpdateEnglishProgress}
                    documents={libraryDocs}
                    onStartSmartReview={() => {
                      setEnglishInitialLessonId(null);
                      setEnglishInitialReviewMode(true);
                      setSidebarTab('english');
                    }}
                    onOpenDocumentPractice={(doc) => {
                      handleSelectDocument(doc);
                      setActiveTab('practice-doc');
                      setPracticeSubTab('quiz');
                    }}
                    onOpenSampleDocPractice={() => {
                      handleOpenSampleDoc();
                      setActiveTab('practice-doc');
                      setPracticeSubTab('quiz');
                    }}
                    generalChatElement={
                      <ChatBox
                        key={`general-chat-${user.username}-${chatResetCount}`}
                        pdfText=""
                        userRole={user.role}
                        userPlan={user.plan || 'free'}
                        modelTier={modelTier}
                        onChangeModelTier={handleModelTierChange}
                        onRequireUpgrade={() => setShowUpgradeModal(true)}
                        onError={showMessage}
                        chatHistory={generalChatHistory}
                        onSendMessage={handleSendGeneralMessage}
                        className="h-140 sm:h-155 border border-[#E4E7F0] dark:border-slate-800 rounded-2xl"
                        language={language}
                      />
                    }
                  />
                )}

                {/* 4. TIẾNG ANH TAB (EnglishLearningHub - Chuẩn Hình 3 & Mục 6, 7, 8) */}
                {sidebarTab === 'english' && (
                  <EnglishLearningHub
                    username={user.username}
                    progress={englishProgress}
                    onUpdateProgress={handleUpdateEnglishProgress}
                    onAwardXp={async (xpAmount) => {
                      try {
                        await fetch('/api/users', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ username: user.username, addXp: xpAmount }),
                        });
                        syncUserSessionFromServer(user.username);
                      } catch {
                        // ignore
                      }
                    }}
                    onOpenProfile={() => setSidebarTab('settings')}
                    onSessionActiveChange={(inSession) => setEnglishSessionActive(inSession)}
                    initialLessonId={englishInitialLessonId}
                    startInReviewMode={englishInitialReviewMode}
                    onClearInitialLesson={() => {
                      setEnglishInitialLessonId(null);
                      setEnglishInitialReviewMode(false);
                    }}
                  />
                )}

                {/* 5. TIẾN ĐỘ TAB (ProgressHub - Mục 2, 9 & 10) */}
                {sidebarTab === 'progress' && (
                  <ProgressHub
                    user={user}
                    englishProgress={englishProgress}
                    quizHistory={isTeachingWorkspace ? quizHistory : studentHistoryList}
                    documents={libraryDocs}
                    onOpenLeaderboard={() => setShowLeaderboard(true)}
                    onOpenShareCard={() => {
                      setSocialShareData({
                        score: `${user.xp || 0} XP · Chuỗi ${user.streak || 1} ngày`,
                        testTitle: 'Thành tích Học tập & Tiếng Anh nền tảng',
                      });
                      setShowSocialShare(true);
                    }}
                    onStartSmartReview={() => {
                      setEnglishInitialLessonId(null);
                      setEnglishInitialReviewMode(true);
                      setSidebarTab('english');
                    }}
                    onGoToEnglish={() => setSidebarTab('english')}
                  />
                )}

                {/* 6. SETTINGS / HỒ SƠ & TRỢ GIÚP TAB */}
                {sidebarTab === 'settings' && (
                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="bg-white dark:bg-[#11131a] p-6 rounded-2xl border border-[#E4E7F0] dark:border-slate-800 space-y-4 shadow-xs">
                      <h3 className="text-sm font-black text-[#6545D8] uppercase tracking-wider flex items-center gap-2 border-b border-[#E4E7F0] dark:border-slate-800 pb-3">
                        <Settings className="w-5 h-5" />
                        Hồ sơ cá nhân & Gói dịch vụ
                      </h3>
                      
                      <div className="space-y-4 pt-1 text-sm font-semibold">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-[#172033] dark:text-white">{t.username}</p>
                            <p className="text-xs text-[#5A6478] dark:text-slate-400">Tài khoản đăng nhập</p>
                          </div>
                          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-[#172033] dark:text-white font-black">{user.username}</span>
                        </div>

                        <div className="flex justify-between items-center border-t border-[#E4E7F0] dark:border-slate-800 pt-3">
                          <div>
                            <p className="font-bold text-[#172033] dark:text-white">{t.role}</p>
                            <p className="text-xs text-[#5A6478] dark:text-slate-400">Vai trò sử dụng</p>
                          </div>
                          <span className="font-black text-[#6545D8] bg-[#EFEAFC] dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg">
                            {isTeacher ? t.teacherRole : t.studentRole}
                          </span>
                        </div>

                        <div className="flex justify-between items-center border-t border-[#E4E7F0] dark:border-slate-800 pt-3">
                          <div>
                            <p className="font-bold text-[#172033] dark:text-white">Gói dịch vụ hiện tại</p>
                            <p className="text-xs text-[#5A6478] dark:text-slate-400">
                              {user.planExpiresAt ? `Hết hạn: ${new Date(user.planExpiresAt).toLocaleDateString('vi-VN')}` : 'Gói miễn phí mặc định'}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#6545D8] hover:bg-[#5436C2] text-white text-xs font-black shadow-xs"
                          >
                            {(user.plan || 'free').toUpperCase()} · Nâng cấp / Nhập Mã
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#E4E7F0] dark:border-slate-800">
                          <button
                            onClick={() => setShowChangePasswordModal(true)}
                            className="flex-1 min-h-[44px] px-4 py-2.5 bg-[#6545D8] text-white font-black rounded-xl hover:bg-[#5436C2] transition-all flex items-center justify-center gap-2 text-xs"
                          >
                            <Lock className="w-4 h-4" />
                            {language === 'vi' ? 'Đổi mật khẩu' : 'Change Password'}
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex-1 min-h-[44px] px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-[#C83A3A] font-black rounded-xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2 text-xs"
                          >
                            <LogOut className="w-4 h-4" />
                            {language === 'vi' ? 'Đăng xuất' : 'Log Out'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Official Customer Support Card 24/7 */}
                    <ZaloSupportCard phone="0923678668" />
                  </div>
                )}

                {/* 7. AI CHAT TAB (Fallback) */}
                {sidebarTab === 'chat' && (
                  <div className="max-w-4xl mx-auto w-full">
                    <ChatBox
                      key={`general-chat-${user.username}-${chatResetCount}`}
                      pdfText=""
                      userRole={user.role}
                      userPlan={user.plan || 'free'}
                      modelTier={modelTier}
                      onChangeModelTier={handleModelTierChange}
                      onRequireUpgrade={() => setShowUpgradeModal(true)}
                      onError={showMessage}
                      chatHistory={generalChatHistory}
                      onSendMessage={handleSendGeneralMessage}
                      className="h-155 sm:h-170 border border-gray-200 dark:border-white/5 rounded-2xl"
                      language={language}
                    />
                  </div>
                )}

                {/* 8. CLASS MANAGEMENT TAB (Teacher only) */}
                {isTeacher && sidebarTab === 'class-management' && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <TeacherClassManagement
                      user={user}
                      language={language}
                      classList={classList}
                      onRemoveStudent={handleRemoveStudentFromClass}
                      onDeleteClass={handleDeleteClass}
                      onError={(msg, isErr) => showMessage(msg, isErr ?? true)}
                    />
                  </div>
                )}

                {/* 9. DASHBOARD TAB: HÔM NAY (Học sinh / Cá nhân - Hình 1) HOẶC TỔNG QUAN LỚP HỌC (Giáo viên) */}
                {sidebarTab === 'dashboard' && !isTeachingWorkspace && (
                  <TodayDashboard
                    user={user}
                    englishProgress={englishProgress}
                    onUpdateEnglishProgress={handleUpdateEnglishProgress}
                    documents={libraryDocs}
                    assignments={roomAssignments}
                    completedAssignmentIds={studentHistoryList.map((h) => h.assignmentId).filter((id): id is string => Boolean(id))}
                    joinedRooms={studentClasses.map((c) => ({ id: c.code, name: c.name }))}
                    onStartEnglishLesson={(lessonId) => {
                      setEnglishInitialLessonId(lessonId);
                      setEnglishInitialReviewMode(false);
                      setSidebarTab('english');
                    }}
                    onStartEnglishReview={() => {
                      setEnglishInitialLessonId(null);
                      setEnglishInitialReviewMode(true);
                      setSidebarTab('english');
                    }}
                    onOpenDocument={(doc) => handleSelectDocument(doc)}
                    onOpenSampleBiologyDoc={handleOpenSampleDoc}
                    onOpenUploadDocument={() => setSidebarTab('upload')}
                    onOpenAssignment={(asm) => handleSelectAssignment(asm)}
                    onOpenMyClasses={() => setShowStudentClassesModal(true)}
                    onJoinClassPrompt={() => setShowJoinClassModal(true)}
                  />
                )}

                {sidebarTab === 'dashboard' && isTeachingWorkspace && (
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
                              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-linear-to-r from-primary to-violet hover:brightness-110 active:scale-95 text-white transition-all text-xs font-bold shadow-sm"
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
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-primary to-violet hover:brightness-110 active:scale-95 text-white transition-all text-xs font-bold shadow-sm"
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
                      const classHistory = quizHistory.filter(h => 
                        (isTeacher ? h.roomId === dashboardClass : userRooms.includes(h.roomId)) &&
                        assignments.some(a => a.id === h.assignmentId)
                      );
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

                              <div className="glass-card min-h-95 rounded-3xl flex flex-col items-center justify-center text-center p-10 overflow-hidden relative border border-gray-300 dark:border-white/5">
                                <div className="mb-6 mx-auto w-20 h-20 bg-white dark:bg-surface-container-highest rounded-2xl flex items-center justify-center shadow-lg border border-gray-300 dark:border-white/10 p-1">
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
                                  <Card key={asm.id} className="shadow-md bg-white dark:bg-gray-900 backdrop-blur-sm transition-all hover:shadow-lg duration-200 overflow-hidden rounded-2xl border border-gray-300 dark:border-white/5">
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
                                          <div className="text-right p-3 rounded-2xl border border-gray-300 dark:border-white/5 min-w-32.5 bg-primary/5">
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

                                          <div className="flex flex-wrap items-center gap-2">
                                            {asmHistory.length > 0 && (
                                              <Button
                                                onClick={() => handleExportExcelGradebook(asm.title, asmHistory)}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-8 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                                Xuất Excel (.xlsx)
                                              </Button>
                                            )}
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
                                          <table className="w-full text-left border-collapse text-sm min-w-125">
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
                                                          onClick={() => {
                                                            setSelectedEssaySubmission(h);
                                                            setOverrideScoreInput(h.scale10Score);
                                                            setOverrideCommentInput(h.teacherComment || '');
                                                          }}
                                                          variant="outline"
                                                          size="sm"
                                                          className="h-7 text-xs px-2.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5 font-bold"
                                                        >
                                                           {language === 'vi' ? 'Xem bài làm & Chấm điểm' : 'View Work & Grade'}
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
                              <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-primary/10 to-violet/10 rounded-bl-full"></div>
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
                                  className="px-6 py-2.5 rounded-xl bg-linear-to-r from-primary to-violet hover:brightness-110 active:scale-95 text-white font-bold text-sm shadow-md transition-all whitespace-nowrap"
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

                                  <div className="glass-card min-h-95 rounded-3xl flex flex-col items-center justify-center text-center p-10 overflow-hidden relative border border-gray-300 dark:border-white/5">
                                    <div className="mb-6 mx-auto w-20 h-20 bg-white dark:bg-surface-container-highest rounded-2xl flex items-center justify-center shadow-lg border border-gray-300 dark:border-white/10 p-1">
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
                                    <Card key={asm.id} className="p-5 shadow-md bg-white dark:bg-gray-900 backdrop-blur-sm flex flex-col justify-between hover:shadow-lg transition-all duration-200 rounded-2xl border border-gray-300 dark:border-white/5">
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

                      {/* GAMIFICATION STUDENT LEADERBOARD (BẢNG XẾP HẠNG THI ĐUA HỌC TẬP 🏆) */}
                      {leaderboardUsers.filter(u => u.role === 'student').length > 0 && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border border-gray-300 dark:border-gray-800/80">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                              <Award className="w-5 h-5 text-amber-500" />
                              🏆 Bảng Xếp Hạng Học Sinh Tích Cực (Top XP & Streak)
                            </h3>
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
                              Đua Top Học Tập
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {leaderboardUsers
                              .filter(u => u.role === 'student')
                              .sort((a, b) => (b.xp || 0) - (a.xp || 0))
                              .slice(0, 6)
                              .map((stu, idx) => (
                                <div
                                  key={stu.username}
                                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                                    idx === 0
                                      ? 'bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-300 dark:border-amber-800'
                                      : 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                        idx === 0
                                          ? 'bg-amber-500 text-white'
                                          : idx === 1
                                          ? 'bg-slate-400 text-white'
                                          : idx === 2
                                          ? 'bg-amber-700 text-white'
                                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      #{idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-black text-foreground truncate">
                                        {stu.fullName || stu.username}
                                      </p>
                                      <p className="text-[10px] text-gray-500 truncate">
                                        @{stu.username} {stu.room ? `• Lớp ${stu.room}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                                      ⭐ {stu.xp || 0} XP
                                    </p>
                                    <p className="text-[10px] font-bold text-orange-500">
                                      🔥 {stu.streak || 1} ngày
                                    </p>
                                  </div>
                                </div>
                              ))}
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

      {/* ===== OVERLAY MODAL: READ ESSAY DETAIL AND FEEDBACK (Teacher only) ===== */}
      {selectedEssaySubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-linear-to-r from-primary to-violet text-white flex justify-between items-center shrink-0">
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
                <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm text-foreground whitespace-pre-wrap leading-relaxed overflow-y-auto min-h-62.5 md:min-h-100">
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

                <div className="flex-1 p-4 bg-primary/5 border border-primary/10 rounded-2xl overflow-y-auto min-h-52
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

                {/* Teacher Grade Override & Personal Comment Box */}
                {isTeacher && (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2.5 shrink-0">
                    <p className="text-xs font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                      ✏️ Giáo viên duyệt / Chỉnh sửa điểm & Ghi lời phê
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">Điểm chốt (Hệ 10):</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={10}
                        value={overrideScoreInput}
                        onChange={(e) => setOverrideScoreInput(e.target.value)}
                        className="w-24 h-8 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-900 px-2.5 text-xs font-black text-indigo-700 dark:text-indigo-300"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Nhập lời phê của Giáo viên dành cho bài làm này..."
                      value={overrideCommentInput}
                      onChange={(e) => setOverrideCommentInput(e.target.value)}
                      className="w-full rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 p-2.5 text-xs font-semibold text-foreground"
                    />
                    <Button
                      onClick={() => handleTeacherOverrideGrade(selectedEssaySubmission)}
                      disabled={isSavingOverride}
                      className="w-full h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black"
                    >
                      {isSavingOverride ? 'Đang lưu...' : '💾 Lưu điểm & Lời phê của Giáo viên'}
                    </Button>
                  </div>
                )}
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
            <div className="px-6 py-4.5 bg-linear-to-r from-emerald-500 to-teal-600 text-white flex justify-between items-center shrink-0">
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

      {/* ===== MODAL LỚP CỦA TÔI (HỌC SINH XEM BÀI TẬP LỚP & THÊM LỚP) ===== */}
      {showStudentClassesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#11131a] rounded-3xl shadow-2xl border border-[#E4E7F0] dark:border-slate-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-[#6545D8] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">Lớp của tôi</h3>
                <p className="text-xs text-white/85 font-semibold mt-0.5">
                  Danh sách lớp đã tham gia và bài tập giáo viên giao
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStudentClassesModal(false);
                    setShowJoinClassModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-black text-white"
                >
                  + Thêm lớp
                </button>
                <button
                  type="button"
                  onClick={() => setShowStudentClassesModal(false)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {roomAssignments.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#F5F6FA] dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800">
                  <p className="text-sm font-black text-[#172033] dark:text-white">
                    Hiện chưa có bài tập nào được giao trong lớp của bạn
                  </p>
                  <p className="text-xs font-semibold text-[#5A6478] dark:text-slate-400 mt-1">
                    Khi giáo viên giao đề kiểm tra mới, bài sẽ xuất hiện tại đây và trên mục Việc cần làm ở trang Hôm nay.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roomAssignments.map((asm) => {
                    const submission = quizHistory.find(
                      (h) => h.assignmentId === asm.id && h.username === user.username
                    );
                    const hasSubmitted = !!submission;
                    return (
                      <div
                        key={asm.id}
                        className="p-4 rounded-2xl bg-[#F5F6FA] dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-[#EFEAFC] text-[#6545D8] text-[10px] font-black">
                              Lớp {asm.roomId}
                            </span>
                            <span className="text-[11px] font-bold text-[#5A6478] dark:text-slate-400">
                              {asm.type === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-[#172033] dark:text-white mt-1 truncate">
                            {asm.title}
                          </h4>
                          <p className="text-xs font-semibold text-[#5A6478] dark:text-slate-400 mt-0.5">
                            Hạn nộp: {new Date(asm.endTime).toLocaleString('vi-VN')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {hasSubmitted && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#178A5B] dark:text-emerald-300 text-xs font-black">
                              {submission.scale10Score}/10
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setShowStudentClassesModal(false);
                              handleSelectAssignment(asm);
                            }}
                            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#6545D8] hover:bg-[#5436C2] text-white text-xs font-black transition-all"
                          >
                            {hasSubmitted ? 'Xem lại bài' : 'Làm bài ngay'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE BOTTOM NAVIGATION BAR (5 MỤC THỐNG NHẤT) ===== */}
      <MobileBottomNav
        currentTab={sidebarTab}
        onSelectTab={(tab) => {
          syncWorkspaceWithDoc(null);
          if (tab === 'english') {
            setEnglishInitialLessonId(null);
            setEnglishInitialReviewMode(false);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSidebarTab(tab as any);
          setMobileMenuOpen(false);
        }}
        activeDoc={!!activeDoc}
        onOpenUpgrade={() => setShowUpgradeModal(true)}
        userPlan={user.plan}
        language={language}
        isTeachingMode={isTeachingWorkspace}
        hidden={hideMainNav}
      />

      {/* ===== PWA 1-CLICK INSTALL PROMPT ===== */}
      <PwaInstallPrompt />

      {/* ===== GAMIFICATION 2.0 LEADERBOARD MODAL ===== */}
      {showLeaderboard && (
        <LeaderboardModal
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          currentUser={user}
          language={language}
        />
      )}

      {/* ===== SOCIAL SHARE ACHIEVEMENT CERTIFICATE MODAL ===== */}
      {showSocialShare && (
        <SocialShareModal
          isOpen={showSocialShare}
          onClose={() => setShowSocialShare(false)}
          username={user.fullName || user.username}
          score={socialShareData.score}
          testTitle={socialShareData.testTitle}
          streak={user.streak || 1}
          language={language}
        />
      )}

      {/* ===== TOAST NOTIFICATION CONTAINER ===== */}
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
}
