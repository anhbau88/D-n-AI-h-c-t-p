'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Globe,
  BookOpen,
  Languages,
  CalendarCheck,
  GraduationCap,
  Users,
  BarChart3,
  HelpCircle,
  Play,
  Volume2,
  Check,
  X,
  FileText,
} from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  language: 'vi' | 'en';
  setLanguage: (lang: 'vi' | 'en') => void;
}

const AUTH_TRANSLATIONS = {
  vi: {
    systemSubtitle: "Học tập mỗi ngày từ tài liệu & lộ trình Tiếng Anh",
    loginTab: "Đăng nhập",
    registerTab: "Đăng ký tài khoản",
    usernameLabel: "Tên đăng nhập hoặc Email",
    usernamePlaceholder: "Nhập tên đăng nhập của bạn...",
    passwordLabel: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu...",
    loginButton: "Đăng nhập",
    authenticating: "Đang xác thực...",
    fullNameLabel: "Họ và tên",
    fullNamePlaceholder: "Nhập họ và tên của bạn...",
    emailLabel: "Email xác thực & nhận thông báo",
    emailPlaceholder: "Ví dụ: hocsinh@gmail.com",
    sendOtpBtn: "Nhận mã OTP",
    sendingOtp: "Đang gửi...",
    otpLabel: "Mã xác thực OTP (6 chữ số)",
    otpPlaceholder: "Nhập 6 số gửi về Email...",
    registerUsernamePlaceholder: "Tên đăng nhập viết liền không dấu...",
    registerPasswordPlaceholder: "Tạo mật khẩu (ít nhất 4 ký tự)...",
    confirmPasswordLabel: "Nhập lại mật khẩu",
    confirmPasswordPlaceholder: "Nhập lại mật khẩu...",
    roleLabel: "Nhu cầu sử dụng",
    roleStudent: "Học tập (Học sinh / Sinh viên)",
    roleTeacher: "Giảng dạy (Giáo viên / Giảng viên)",
    registerButton: "Hoàn tất đăng ký & Lưu tiến độ",
    registering: "Đang khởi tạo tài khoản...",
    dbSyncHint: "Mật khẩu mã hóa scrypt & Đồng bộ tiến độ học tập",
    errorEmptyFields: "Vui lòng điền đầy đủ thông tin bắt buộc",
    errorLoginEmpty: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu",
    errorPasswordMismatch: "Mật khẩu nhập lại không trùng khớp",
    errorNeedOtp: "Vui lòng bấm 'Nhận mã OTP' và nhập mã xác thực 6 chữ số",
    successLogin: "Đăng nhập thành công!",
    successRegister: "Đăng ký thành công!",
  },
  en: {
    systemSubtitle: "Daily study from your documents & English lessons",
    loginTab: "Log In",
    registerTab: "Sign Up",
    usernameLabel: "Username or Email",
    usernamePlaceholder: "Enter your username...",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password...",
    loginButton: "Log In",
    authenticating: "Authenticating...",
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "Enter your full name...",
    emailLabel: "Email for OTP verification",
    emailPlaceholder: "e.g., student@gmail.com",
    sendOtpBtn: "Get OTP",
    sendingOtp: "Sending...",
    otpLabel: "6-Digit Verification OTP",
    otpPlaceholder: "Enter 6-digit OTP...",
    registerUsernamePlaceholder: "Username without spaces...",
    registerPasswordPlaceholder: "Create password...",
    confirmPasswordLabel: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm password...",
    roleLabel: "Primary Purpose",
    roleStudent: "Learning (Student)",
    roleTeacher: "Teaching (Teacher / Instructor)",
    registerButton: "Complete Registration & Save Progress",
    registering: "Creating account...",
    dbSyncHint: "Scrypt encrypted password & Cloud progress sync",
    errorEmptyFields: "Please fill in all required fields",
    errorLoginEmpty: "Please enter username and password",
    errorPasswordMismatch: "Passwords do not match",
    errorNeedOtp: "Please request an OTP and enter the 6-digit code",
    successLogin: "Log In successful!",
    successRegister: "Registration successful!",
  }
};

export default function AuthScreen({ onLogin, language, setLanguage }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [audienceMode, setAudienceMode] = useState<'learning' | 'teaching'>('learning');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Interactive Public Sample Lesson state (Section 1 requirement)
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [sampleType, setSampleType] = useState<'english' | 'document'>('english');
  const [sampleStep, setSampleStep] = useState<number>(0);
  const [sampleSelected, setSampleSelected] = useState<string | null>(null);
  const [sampleChecked, setSampleChecked] = useState(false);
  const [sampleCorrectCount, setSampleCorrectCount] = useState(0);

  // Common states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Register + OTP states
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<'teacher' | 'student'>('student');
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [sandboxOtpPreview, setSandboxOtpPreview] = useState<string | null>(null);
  const [otpDeliveryInfo, setOtpDeliveryInfo] = useState<string | null>(null);

  // Forgot Password states
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotOtpToken, setForgotOtpToken] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');

  const t = AUTH_TRANSLATIONS[language];

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const SAMPLE_ENGLISH_QUESTIONS = [
    {
      prompt: 'Câu 1 / 3 · Điền từ còn thiếu',
      question: 'She ___ a student.',
      options: ['am', 'is', 'are'],
      correct: 'is',
      explanation: 'Dùng "is" với chủ ngữ ngôi thứ ba số ít (she, he, it). Câu đúng: She is a student.',
    },
    {
      prompt: 'Câu 2 / 3 · Chọn lời đáp tự nhiên nhất',
      question: 'Khi người khác nói "Nice to meet you.", bạn đáp lại là:',
      options: ['Nice to meet you, too.', 'Goodbye, see you.', 'My name is Lan.'],
      correct: 'Nice to meet you, too.',
      explanation: '"Nice to meet you, too." nghĩa là "Mình cũng rất vui được gặp bạn."',
    },
    {
      prompt: 'Câu 3 / 3 · Sửa lỗi động từ',
      question: 'Chọn câu đúng ngữ pháp để thay cho "They is my friends":',
      options: ['They are my friends.', 'They am my friends.', 'They be my friends.'],
      correct: 'They are my friends.',
      explanation: 'Với chủ ngữ số nhiều "They", ta dùng động từ to be là "are".',
    },
  ];

  const speakSample = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  };

  // Gửi mã OTP xác thực Email khi Đăng ký
  const handleSendRegisterOtp = async () => {
    setError('');
    setSuccess('');
    setOtpDeliveryInfo(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ Email hợp lệ trước khi nhận mã OTP.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          purpose: 'register',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi mã OTP.');
      }

      setOtpToken(data.otpToken);
      setOtpCooldown(60);
      setOtpDeliveryInfo(data.message);
      if (data.sandboxOtp) {
        setSandboxOtpPreview(data.sandboxOtp);
        setOtpCode(data.sandboxOtp);
      } else {
        setSandboxOtpPreview(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi gửi mã OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRequestForgotPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!forgotIdentifier.trim()) {
      setError('Vui lòng nhập Tên đăng nhập hoặc Email của bạn.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tìm thấy tài khoản.');

      setForgotOtpToken(data.otpToken);
      setForgotStep(2);
      setSuccess(data.message);
      if (data.sandboxOtp) {
        setSandboxOtpPreview(data.sandboxOtp);
        setForgotOtp(data.sandboxOtp);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi yêu cầu khôi phục mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!forgotOtp.trim() || !forgotNewPass.trim()) {
      setError('Vui lòng nhập đầy đủ mã OTP và mật khẩu mới.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setError('Mật khẩu mới nhập lại không trùng khớp.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          otpCode: forgotOtp.trim(),
          otpToken: forgotOtpToken,
          newPassword: forgotNewPass.trim(),
          confirmPassword: forgotConfirmPass.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đặt lại mật khẩu thất bại.');

      setSuccess(data.message || 'Đặt lại mật khẩu thành công! Đang chuyển về đăng nhập...');
      setTimeout(() => {
        setUsername(data.username || forgotIdentifier.trim());
        setPassword('');
        setAuthMode('login');
        setForgotStep(1);
        setSandboxOtpPreview(null);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password.trim()) {
      setError(t.errorLoginEmpty);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }

      setSuccess(t.successLogin);
      setTimeout(() => {
        onLogin(data.user);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password.trim() || !confirmPassword.trim() || !fullName.trim() || !email.trim()) {
      setError(t.errorEmptyFields);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.errorPasswordMismatch);
      return;
    }

    if (!otpToken || !otpCode.trim()) {
      setError(t.errorNeedOtp);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          confirmPassword: confirmPassword.trim(),
          role: registerRole,
          room: '',
          otpCode: otpCode.trim(),
          otpToken
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      setSuccess(t.successRegister);
      if (data.user) {
        setTimeout(() => {
          onLogin(data.user);
        }, 500);
      } else {
        setConfirmPassword('');
        setFullName('');
        setOtpCode('');
        setAuthMode('login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6FA] dark:bg-background text-[#172033] dark:text-foreground">
      {/* Top Bar: Logo + Help + Language Switcher (SVG icon, no broken font ligatures) */}
      <header className="w-full border-b border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#6545D8] text-white flex items-center justify-center font-black text-lg shadow-xs">
              +
            </div>
            <span className="font-black text-base sm:text-lg tracking-tight text-[#172033] dark:text-white">
              Trợ Lý Học Tập
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="min-h-11 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-[#6545D8]" />
              <span>{language === 'vi' ? 'Trợ giúp' : 'Help'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextLang = language === 'vi' ? 'en' : 'vi';
                setLanguage(nextLang);
                localStorage.setItem('language', nextLang);
              }}
              className="min-h-11 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 text-xs font-bold text-[#172033] dark:text-gray-200 flex items-center gap-1.5 transition-colors"
              title={language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
            >
              <Globe className="w-4 h-4 text-[#6545D8]" />
              <span>{language === 'vi' ? 'English' : 'Tiếng Việt'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-2">
          
          {/* CỘT TRÁI: GIỚI THIỆU RÕ VIỆC LÀM ĐƯỢC + CHỌN NHU CẦU + BÀI HỌC MẪU CÔNG KHAI */}
          <div className="lg:col-span-7 order-2 lg:order-1 space-y-6 pr-0 lg:pr-4">
            {/* Bộ chọn nhu cầu: Học tập hoặc Giảng dạy */}
            <div className="inline-flex p-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setAudienceMode('learning');
                  setRegisterRole('student');
                }}
                className={`min-h-11 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  audienceMode === 'learning'
                    ? 'bg-[#6545D8] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-foreground'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Dành cho Người học</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAudienceMode('teaching');
                  setRegisterRole('teacher');
                }}
                className={`min-h-11 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  audienceMode === 'teaching'
                    ? 'bg-[#6545D8] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-foreground'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Dành cho Giáo viên</span>
              </button>
            </div>

            {audienceMode === 'learning' ? (
              <>
                <div className="space-y-3">
                  <h1 className="text-2xl sm:text-4xl font-black text-[#172033] dark:text-white tracking-tight leading-tight">
                    Biến tài liệu đang học thành bài luyện ngắn & Ôn Tiếng Anh mỗi ngày
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    Mở ứng dụng là biết ngay <strong>hôm nay học gì</strong>, <strong>đang vướng ở đâu</strong> và <strong>ngày mai cần ôn gì</strong>. Các công cụ AI xuất hiện đúng trong tài liệu hoặc bài tập bạn đang mở.
                  </p>
                </div>

                {/* 3 Lợi ích cốt lõi ngắn gọn */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-indigo-950/60 text-[#6545D8] flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-[#172033] dark:text-white">
                      1. Tài liệu thành bài luyện
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Tải tệp PDF/Word để rút ý chính có dẫn nguồn trang và làm ngay 10 câu hỏi kiểm tra mức hiểu bài.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-indigo-950/60 text-[#6545D8] flex items-center justify-center">
                      <Languages className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-[#172033] dark:text-white">
                      2. Tiếng Anh 5–7 phút
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Lộ trình 8 chủ đề, 24 bài ngắn có âm thanh chuẩn, giải thích lỗi chi tiết bằng tiếng Việt.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-indigo-950/60 text-[#6545D8] flex items-center justify-center">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-[#172033] dark:text-white">
                      3. Sổ lỗi & Lịch ôn tập
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Tự động lưu câu sai vào Sổ lỗi và nhắc ôn ngắt quãng theo mốc 1, 3, 7, 14 và 30 ngày.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <h1 className="text-2xl sm:text-4xl font-black text-[#172033] dark:text-white tracking-tight leading-tight">
                    Không gian Giảng dạy: Giao bài từ học liệu & Theo dõi kết quả từng lớp
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    Soạn bộ câu hỏi trắc nghiệm, bài tự luận hoặc kế hoạch bài dạy từ tài liệu chuẩn. Giao bài có lịch mở, hạn nộp và xem thống kê những phần học sinh hay sai.
                  </p>
                </div>

                {/* 3 Lợi ích cho Giáo viên */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-indigo-950/60 text-[#6545D8] flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-[#172033] dark:text-white">
                      1. Soạn bài từ học liệu
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Tạo đề trắc nghiệm, tự luận kèm đáp án và kế hoạch bài dạy bám sát tài liệu gốc của giáo viên.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-indigo-950/60 text-[#6545D8] flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-[#172033] dark:text-white">
                      2. Quản lý lớp & Hạn nộp
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Tạo mã lớp, giao bài tập với thời gian mở đề và hạn nộp rõ ràng; tự động ghim vào mục Hôm nay của học sinh.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] dark:bg-indigo-950/60 text-[#6545D8] flex items-center justify-center">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-[#172033] dark:text-white">
                      3. Phổ điểm & Chẩn đoán
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Theo dõi tiến độ nộp bài, chấm bài tự luận có nhận xét chi tiết và phát hiện chủ đề cả lớp còn yếu.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* KHỐI BÀI HỌC MẪU CÔNG KHAI (Interactive Demo không cần đăng nhập) */}
            <div className="p-5 rounded-2xl bg-[#F3F0FF] dark:bg-indigo-950/40 border border-[#6545D8]/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#6545D8] dark:text-indigo-300">
                    TRẢI NGHIỆM TRƯỚC KHI ĐĂNG NHẬP
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-[#172033] dark:text-white mt-0.5">
                    Xem cách sản phẩm giải quyết một việc học thực tế
                  </h3>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setSampleType('english');
                    setSampleStep(0);
                    setSampleSelected(null);
                    setSampleChecked(false);
                    setSampleCorrectCount(0);
                    setShowSampleModal(true);
                  }}
                  className="min-h-11 px-5 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-xs sm:text-sm gap-2 shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Làm thử bài học mẫu (2 phút)
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSampleType('english');
                    setSampleStep(0);
                    setSampleSelected(null);
                    setSampleChecked(false);
                    setSampleCorrectCount(0);
                    setShowSampleModal(true);
                  }}
                  className="p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#6545D8] text-left transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-black text-[#172033] dark:text-white">Bài mẫu Tiếng Anh: Giới thiệu bản thân</p>
                    <p className="text-gray-500 mt-0.5">Chủ đề 1 · Luyện I am / She is / They are có giải thích tiếng Việt</p>
                  </div>
                  <span className="text-[#6545D8] font-bold shrink-0 ml-2">Thử ngay &gt;</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSampleType('document');
                    setShowSampleModal(true);
                  }}
                  className="p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#6545D8] text-left transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-black text-[#172033] dark:text-white">Tài liệu mẫu: Quang hợp ở cây.pdf</p>
                    <p className="text-gray-500 mt-0.5">Xem cách trích xuất ý chính trang 12 & tạo câu hỏi luyện tập</p>
                  </div>
                  <span className="text-[#6545D8] font-bold shrink-0 ml-2">Xem mẫu &gt;</span>
                </button>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: KHUNG ĐĂNG NHẬP / ĐĂNG KÝ */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <Card className="w-full p-6 sm:p-7 border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-2xl">
              <div className="text-center mb-5">
                <div className="relative w-14 h-14 mx-auto mb-2.5">
                  <Image
                    src="/logo.png"
                    alt="Trợ Lý Học Tập Logo"
                    width={56}
                    height={56}
                    className="w-full h-full object-contain rounded-2xl border border-gray-100 dark:border-gray-800"
                  />
                </div>
                <h2 className="text-xl font-black text-[#172033] dark:text-white tracking-tight">
                  Trợ Lý Học Tập
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs font-medium">{t.systemSubtitle}</p>
              </div>

              {/* Tab chuyển đổi giữa Đăng nhập & Đăng ký */}
              <Tabs
                value={authMode === 'forgot_password' ? 'login' : authMode}
                onValueChange={(v) => {
                  setAuthMode(v as 'login' | 'register');
                  setError('');
                  setSuccess('');
                }}
                className="w-full mb-5"
              >
                <TabsList className="flex w-full !w-full h-11 !h-11 bg-[#F5F6FA] dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                  <TabsTrigger
                    value="login"
                    className="flex-1 rounded-lg text-xs transition-all font-bold data-active:bg-white dark:data-active:bg-gray-900 data-active:text-[#6545D8] data-active:shadow-2xs"
                  >
                    {t.loginTab}
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="flex-1 rounded-lg text-xs transition-all font-bold data-active:bg-white dark:data-active:bg-gray-900 data-active:text-[#6545D8] data-active:shadow-2xs"
                  >
                    {t.registerTab}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033] dark:text-gray-300 block">
                      {t.usernameLabel}
                    </label>
                    <Input
                      type="text"
                      placeholder={t.usernamePlaceholder}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm h-11 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#172033] dark:text-gray-300 block">
                        {t.passwordLabel}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot_password');
                          setForgotStep(1);
                          setError('');
                          setSuccess('');
                        }}
                        className="text-xs font-bold text-[#6545D8] hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <Input
                      type="password"
                      placeholder={t.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm h-11 font-medium"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-bold">
                      ⚠️ {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{success}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-sm shadow-xs transition-all"
                  >
                    {loading ? t.authenticating : t.loginButton}
                  </Button>
                </form>
              ) : authMode === 'forgot_password' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-[#6545D8]" />
                      Khôi phục mật khẩu bằng OTP
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setError('');
                        setSuccess('');
                      }}
                      className="text-xs font-bold text-gray-500 hover:text-foreground flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
                    </button>
                  </div>

                  {forgotStep === 1 ? (
                    <form onSubmit={handleRequestForgotPasswordOtp} className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                          Tên đăng nhập hoặc Email đã đăng ký
                        </label>
                        <Input
                          type="text"
                          placeholder="Nhập username hoặc email..."
                          value={forgotIdentifier}
                          onChange={(e) => setForgotIdentifier(e.target.value)}
                          disabled={loading}
                          className="rounded-xl h-11 text-sm"
                        />
                      </div>

                      {error && (
                        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                          ⚠️ {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-xs"
                      >
                        {loading ? 'Đang kiểm tra...' : 'Nhận mã OTP đặt lại mật khẩu'}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-emerald-700 block">
                          Mã xác thực OTP (6 chữ số)
                        </label>
                        <Input
                          type="text"
                          maxLength={6}
                          placeholder="Nhập 6 số OTP..."
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                          className="rounded-xl text-center tracking-[0.4em] text-sm h-11 font-black"
                        />
                        {sandboxOtpPreview && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                            <span>Mã OTP: <strong className="font-mono">{sandboxOtpPreview}</strong></span>
                            <button
                              type="button"
                              onClick={() => setForgotOtp(sandboxOtpPreview)}
                              className="px-2 py-1 rounded bg-amber-600 text-white text-[10px] font-bold"
                            >
                              Điền nhanh
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">Mật khẩu mới</label>
                          <Input
                            type="password"
                            value={forgotNewPass}
                            onChange={(e) => setForgotNewPass(e.target.value)}
                            placeholder="Mật khẩu mới..."
                            className="h-10 text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">Nhập lại</label>
                          <Input
                            type="password"
                            value={forgotConfirmPass}
                            onChange={(e) => setForgotConfirmPass(e.target.value)}
                            placeholder="Xác nhận mật khẩu..."
                            className="h-10 text-xs rounded-xl"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                          ⚠️ {error}
                        </div>
                      )}
                      {success && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          ✅ {success}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        {loading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu mới'}
                      </Button>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                        {t.fullNameLabel}
                      </label>
                      <Input
                        type="text"
                        placeholder={t.fullNamePlaceholder}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                        className="rounded-xl text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                        Tên đăng nhập
                      </label>
                      <Input
                        type="text"
                        placeholder={t.registerUsernamePlaceholder}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        className="rounded-xl text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6545D8] flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {t.emailLabel}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder={t.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading || sendingOtp}
                        className="rounded-xl text-xs h-10 flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleSendRegisterOtp}
                        disabled={sendingOtp || otpCooldown > 0 || loading}
                        className="h-10 px-3 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white text-xs font-bold shrink-0"
                      >
                        {sendingOtp
                          ? t.sendingOtp
                          : otpCooldown > 0
                          ? `Gửi lại (${otpCooldown}s)`
                          : t.sendOtpBtn}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t.otpLabel}
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder={t.otpPlaceholder}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      className="rounded-xl text-center tracking-[0.4em] text-sm h-10 font-black"
                    />
                    {otpDeliveryInfo && (
                      <p className="text-[11px] text-gray-500 font-medium">
                        📩 {otpDeliveryInfo}
                      </p>
                    )}
                    {sandboxOtpPreview && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900">
                        <span>Mã OTP xác thực: <strong className="font-mono">{sandboxOtpPreview}</strong></span>
                        <button
                          type="button"
                          onClick={() => setOtpCode(sandboxOtpPreview)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-bold"
                        >
                          Điền nhanh
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                        {t.passwordLabel}
                      </label>
                      <Input
                        type="password"
                        placeholder={t.registerPasswordPlaceholder}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="rounded-xl text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                        {t.confirmPasswordLabel}
                      </label>
                      <Input
                        type="password"
                        placeholder={t.confirmPasswordPlaceholder}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        className="rounded-xl text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                      {t.roleLabel}
                    </label>
                    <select
                      value={registerRole}
                      onChange={(e) => setRegisterRole(e.target.value as 'teacher' | 'student')}
                      disabled={loading}
                      className="flex h-10 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-bold text-foreground"
                    >
                      <option value="student">{t.roleStudent}</option>
                      <option value="teacher">{t.roleTeacher}</option>
                    </select>
                  </div>

                  {error && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                      ⚠️ {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{success}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 mt-1 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-xs shadow-xs"
                  >
                    {loading ? t.registering : t.registerButton}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* ===================================================================== */}
      {/* MODAL BÀI HỌC MẪU CÔNG KHAI (Interactive Sample Lesson before login) */}
      {/* ===================================================================== */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSampleType('english')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    sampleType === 'english'
                      ? 'bg-[#6545D8] text-white'
                      : 'bg-[#F5F6FA] dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Mẫu 1: Tiếng Anh ngắn
                </button>
                <button
                  type="button"
                  onClick={() => setSampleType('document')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    sampleType === 'document'
                      ? 'bg-[#6545D8] text-white'
                      : 'bg-[#F5F6FA] dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Mẫu 2: Học từ tài liệu
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sampleType === 'english' ? (
              sampleStep < SAMPLE_ENGLISH_QUESTIONS.length ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
                    <span>{SAMPLE_ENGLISH_QUESTIONS[sampleStep].prompt}</span>
                    <button
                      type="button"
                      onClick={() => speakSample(SAMPLE_ENGLISH_QUESTIONS[sampleStep].question)}
                      className="inline-flex items-center gap-1 text-[#6545D8] hover:underline"
                    >
                      <Volume2 className="w-4 h-4" /> Nghe phát âm
                    </button>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-[#6545D8] transition-all"
                      style={{ width: `${((sampleStep + 1) / SAMPLE_ENGLISH_QUESTIONS.length) * 100}%` }}
                    />
                  </div>

                  <h3 className="text-xl font-black text-[#172033] dark:text-white">
                    {SAMPLE_ENGLISH_QUESTIONS[sampleStep].question}
                  </h3>

                  <div className="space-y-2.5">
                    {SAMPLE_ENGLISH_QUESTIONS[sampleStep].options.map((opt) => {
                      const isCorrect = opt === SAMPLE_ENGLISH_QUESTIONS[sampleStep].correct;
                      const isChosen = sampleSelected === opt;

                      let boxStyle = 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-[#6545D8]';
                      if (sampleChecked) {
                        if (isCorrect) boxStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                        else if (isChosen) boxStyle = 'border-red-400 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
                      } else if (isChosen) {
                        boxStyle = 'border-[#6545D8] bg-[#F3F0FF] dark:bg-indigo-950/50 ring-2 ring-[#6545D8]/20';
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={sampleChecked}
                          onClick={() => setSampleSelected(opt)}
                          className={`w-full min-h-12 px-4 py-3 rounded-xl border text-left font-bold text-sm flex items-center justify-between transition-all ${boxStyle}`}
                        >
                          <span>{opt}</span>
                          {sampleChecked && isCorrect && (
                            <span className="text-xs font-bold text-emerald-700">Đáp án đúng</span>
                          )}
                          {sampleChecked && !isCorrect && isChosen && (
                            <span className="text-xs font-bold text-red-600">Bạn chọn</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {sampleChecked && (
                    <div className="p-4 rounded-xl bg-[#F5F6FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-1">
                      <p className="text-xs font-black text-[#172033] dark:text-white">Ghi nhớ</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {SAMPLE_ENGLISH_QUESTIONS[sampleStep].explanation}
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    {!sampleChecked ? (
                      <Button
                        type="button"
                        disabled={!sampleSelected}
                        onClick={() => {
                          setSampleChecked(true);
                          if (sampleSelected === SAMPLE_ENGLISH_QUESTIONS[sampleStep].correct) {
                            setSampleCorrectCount(prev => prev + 1);
                          }
                        }}
                        className="w-full h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-sm"
                      >
                        Kiểm tra đáp án
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => {
                          setSampleStep(prev => prev + 1);
                          setSampleSelected(null);
                          setSampleChecked(false);
                        }}
                        className="w-full h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-sm"
                      >
                        Tiếp tục
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 py-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-[#172033] dark:text-white">
                    Hoàn thành bài học mẫu!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Bạn trả lời đúng ngay lần đầu: <strong>{sampleCorrectCount} / {SAMPLE_ENGLISH_QUESTIONS.length} câu</strong>. Hãy tạo tài khoản miễn phí để lưu tiến độ, mở khóa trọn bộ 8 chủ đề (24 bài học) và lịch ôn tập cá nhân!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowSampleModal(false);
                        setAuthMode('register');
                      }}
                      className="flex-1 h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-xs"
                    >
                      Đăng ký tài khoản để lưu tiến độ
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSampleStep(0);
                        setSampleSelected(null);
                        setSampleChecked(false);
                        setSampleCorrectCount(0);
                      }}
                      className="h-11 rounded-xl text-xs font-bold"
                    >
                      Làm lại bài mẫu
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#F5F6FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                      <span>Tài liệu gốc: Quang hợp.pdf</span>
                      <span>Trang 12</span>
                    </div>
                    <p className="font-bold text-[#172033] dark:text-white">QUANG HỢP Ở CÂY</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Cây sử dụng năng lượng ánh sáng để tạo chất hữu cơ từ carbon dioxide và nước.
                    </p>
                    <div className="p-2.5 rounded-lg bg-[#F3F0FF] dark:bg-indigo-950/60 text-xs text-[#172033] dark:text-indigo-200">
                      Lục lạp chứa sắc tố hấp thụ ánh sáng. Quá trình quang hợp có vai trò cung cấp chất hữu cơ cho cây.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#F3F0FF] text-[#6545D8] font-bold text-xs inline-block">
                      Hiểu bài · Ý chính cần nhớ
                    </span>
                    <p className="text-xs text-gray-700 dark:text-gray-200">
                      <strong>1.</strong> Ánh sáng cung cấp năng lượng cho quá trình quang hợp.
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-200">
                      <strong>2.</strong> Lục lạp là nơi diễn ra quang hợp ở tế bào thực vật.
                    </p>
                    <p className="text-[11px] font-bold text-[#6545D8]">
                      Nguồn tài liệu · trang 12
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setShowSampleModal(false);
                    setAuthMode('register');
                  }}
                  className="w-full h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-xs"
                >
                  Đăng ký ngay để tải tài liệu của bạn & tạo câu hỏi luyện tập
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL TRỢ GIÚP GỘP GỌN (Single Help Button Dialog) */}
      {/* ===================================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#172033] dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#6545D8]" />
                Trợ giúp & Hỗ trợ người dùng
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>• <strong>Quên mật khẩu:</strong> Bấm vào nút &ldquo;Quên mật khẩu?&rdquo; ở khung đăng nhập để nhận mã OTP khôi phục qua Email.</p>
              <p>• <strong>Hỗ trợ duyệt gói & kỹ thuật:</strong> Liên hệ trực tiếp qua Zalo hoặc Hotline hỗ trợ.</p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <a
                href="https://zalo.me/0923678668"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-xs flex items-center justify-center"
              >
                Chat Zalo Hỗ trợ (0923.678.668)
              </a>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowHelpModal(false)}
                className="min-h-11 rounded-xl text-xs font-bold"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
