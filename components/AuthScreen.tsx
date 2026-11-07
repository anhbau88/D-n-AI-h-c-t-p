'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ShieldCheck, Sparkles, CheckCircle2, Crown, Zap, Brain, Mic, Camera, Headphones, Network, FileSpreadsheet } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  language: 'vi' | 'en';
  setLanguage: (lang: 'vi' | 'en') => void;
}

const AUTH_TRANSLATIONS = {
  vi: {
    systemSubtitle: "Siêu ứng dụng Học tập & Giảng dạy AI All-in-One",
    loginTab: "🔑 Đăng nhập",
    registerTab: "📝 Đăng ký (Xác thực Email)",
    usernameLabel: "Tên đăng nhập",
    usernamePlaceholder: "Nhập tên đăng nhập của bạn...",
    passwordLabel: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu...",
    loginButton: "Đăng nhập vào hệ thống",
    authenticating: "Đang xác thực...",
    fullNameLabel: "Họ và tên",
    fullNamePlaceholder: "Nhập họ và tên thật của bạn...",
    emailLabel: "Email nhận mã OTP & Mã kích hoạt gói",
    emailPlaceholder: "Ví dụ: hocsinh@gmail.com",
    sendOtpBtn: "Gửi mã OTP",
    sendingOtp: "Đang gửi...",
    otpLabel: "Mã xác thực OTP (6 chữ số)",
    otpPlaceholder: "Nhập 6 số gửi về Email...",
    registerUsernamePlaceholder: "Nhập tên đăng nhập viết liền không dấu...",
    registerPasswordPlaceholder: "Tạo mật khẩu đăng nhập...",
    confirmPasswordLabel: "Nhập lại mật khẩu",
    confirmPasswordPlaceholder: "Nhập lại mật khẩu lần nữa...",
    roleLabel: "Vai trò sử dụng",
    roleStudent: "👨‍🎓 Học sinh / Sinh viên",
    roleTeacher: "👩‍🏫 Giáo viên / Giảng viên",
    registerButton: "Xác minh OTP & Tạo tài khoản",
    registering: "Đang xác minh & khởi tạo...",
    dbSyncHint: "🔒 Mật khẩu mã hóa chuẩn scrypt & Đồng bộ đám mây thời gian thực",
    errorEmptyFields: "Vui lòng điền đầy đủ thông tin bắt buộc",
    errorLoginEmpty: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu",
    errorPasswordMismatch: "Mật khẩu nhập lại không trùng khớp",
    errorNeedOtp: "Vui lòng bấm 'Gửi mã OTP' và nhập mã xác thực 6 chữ số từ Email",
    successLogin: "Đăng nhập thành công!",
    successRegister: "Đăng ký & xác thực Email thành công!",
  },
  en: {
    systemSubtitle: "All-in-One AI Study & Teaching Super App",
    loginTab: "🔑 Log In",
    registerTab: "📝 Register (Email OTP)",
    usernameLabel: "Username",
    usernamePlaceholder: "Enter your username...",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password...",
    loginButton: "Log In to System",
    authenticating: "Authenticating...",
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "Enter your full name...",
    emailLabel: "Email (for OTP & Plan License Code)",
    emailPlaceholder: "e.g., student@gmail.com",
    sendOtpBtn: "Send OTP",
    sendingOtp: "Sending...",
    otpLabel: "6-Digit Verification OTP",
    otpPlaceholder: "Enter 6-digit OTP from Email...",
    registerUsernamePlaceholder: "Enter username without spaces...",
    registerPasswordPlaceholder: "Create password...",
    confirmPasswordLabel: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm password again...",
    roleLabel: "Account Role",
    roleStudent: "👨‍🎓 Student",
    roleTeacher: "👩‍🏫 Teacher",
    registerButton: "Verify OTP & Create Account",
    registering: "Verifying & Creating...",
    dbSyncHint: "🔒 Scrypt encrypted password & Real-time Cloud Sync",
    errorEmptyFields: "Please fill in all required fields",
    errorLoginEmpty: "Please enter username and password",
    errorPasswordMismatch: "Passwords do not match",
    errorNeedOtp: "Please request an OTP and enter the 6-digit verification code",
    successLogin: "Log In successful!",
    successRegister: "Registration & Email verification successful!",
  }
};

export default function AuthScreen({ onLogin, language, setLanguage }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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

  const t = AUTH_TRANSLATIONS[language];

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleSendOtp = async () => {
    setError('');
    setSuccess('');
    setSandboxOtpPreview(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Vui lòng nhập địa chỉ Email hợp lệ trước khi nhận mã OTP.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          username: username.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi mã OTP');
      }

      setOtpToken(data.otpToken);
      setOtpCooldown(60);
      setOtpDeliveryInfo(data.message);
      if (data.sandboxOtpPreview) {
        setSandboxOtpPreview(data.sandboxOtpPreview);
      }
      setSuccess(`Đã phát hành mã OTP xác thực tới ${cleanEmail}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi gửi mã OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  // Xử lý đăng nhập
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
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }

      setSuccess(t.successLogin);
      onLogin(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đăng ký có xác thực Email OTP
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
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
        // Tự động đăng nhập ngay sau khi xác thực OTP thành công
        setTimeout(() => {
          onLogin(data.user);
        }, 600);
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
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background p-4 md:p-8 overflow-x-hidden">
      {/* Language Switcher Button (Top Right of Screen) */}
      <div className="fixed top-4 right-4 z-30 flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            const nextLang = language === 'vi' ? 'en' : 'vi';
            setLanguage(nextLang);
            localStorage.setItem('language', nextLang);
          }}
          className="text-primary hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 text-xs font-black"
          title={language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
        >
          <span className="material-symbols-outlined text-[18px]">translate</span>
          <span>{language === 'vi' ? 'English' : 'Tiếng Việt'}</span>
        </button>
      </div>

      {/* Background decorative glowing blur circles */}
      <div className="fixed top-1/4 -left-20 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-8">
        {/* LEFT COLUMN: COMMERCIAL SAAS HERO SHOWCASE */}
        <div className="lg:col-span-7 space-y-6 pr-0 lg:pr-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NỀN TẢNG EDTECH AI ALL-IN-ONE THẾ HỆ MỚI</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Học thông minh gấp 10 lần với{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Đa Mô Hình
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Hội tụ tinh hoa của <strong>NotebookLM</strong>, <strong>ChatGPT Plus</strong>, <strong>Prep.vn</strong>, <strong>Quizlet</strong> và <strong>MagicSchool AI</strong> trong một nền tảng duy nhất dành cho Học sinh & Giáo viên Việt Nam.
          </p>

          {/* Multi-Tier AI Models Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 mb-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>AI Flash 2.5</span>
                <span className="ml-auto px-2 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">FREE</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Phản hồi siêu tốc 1 giây, tóm tắt & tạo đề cơ bản mỗi ngày.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-900 dark:text-indigo-200 mb-1">
                <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>AI Pro 2.5</span>
                <span className="ml-auto px-2 py-0.5 text-[10px] rounded-full bg-indigo-600 text-white">PRO</span>
              </div>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">Suy luận chuỗi (Chain-of-Thought), giải Toán/Lý/Hóa & chấm bài viết tay OCR.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-300/80 dark:border-amber-800/80 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-200 mb-1">
                <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>AI Ultra Academic</span>
                <span className="ml-auto px-2 py-0.5 text-[10px] rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">VIP</span>
              </div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">Chuyên gia học thuật chuyên sâu, soạn Giáo án 5512 & đề thi HSG.</p>
            </div>
          </div>

          {/* 6 Killer Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
              <Network className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Sơ đồ tư duy Mindmap</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
              <Headphones className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-slate-200">AI Podcast 2 Giọng Đọc</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
              <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Chấm Ảnh Bài Viết Tay</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
              <Mic className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Gia Sư Voice AI 2 Chiều</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Giáo Án 5512 & Xuất Excel</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Kích Hoạt Gói Bằng Code</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION CARD */}
        <div className="lg:col-span-5">
          <Card className="relative w-full p-6 sm:p-8 border border-gray-200 dark:border-gray-800/60 shadow-[0_20px_50px_rgba(99,102,241,0.1)] bg-white/85 dark:bg-gray-900/80 backdrop-blur-2xl transition-all duration-300 rounded-3xl">
            <div className="text-center mb-5">
              <div className="relative w-16 h-16 mx-auto mb-3 hover:scale-105 transition-all duration-300">
                <Image
                  src="/logo.png"
                  alt="AI Study Assistant Logo"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain rounded-2xl shadow-lg border border-white/20 dark:border-gray-800/30"
                />
              </div>
              <h2 className="text-xl font-black bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent tracking-tight">
                AI Study Assistant
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs font-bold">{t.systemSubtitle}</p>
            </div>

            {/* Tab chuyển đổi giữa Đăng nhập & Đăng ký */}
            <Tabs
              value={authMode}
              onValueChange={(v) => {
                setAuthMode(v as 'login' | 'register');
                setError('');
                setSuccess('');
              }}
              className="w-full mb-5"
            >
              <TabsList className="flex w-full !w-full h-10 !h-10 bg-gray-100/80 dark:bg-gray-800/60 p-1 rounded-2xl border border-gray-200 dark:border-gray-800">
                <TabsTrigger
                  value="login"
                  className="flex-1 rounded-xl text-xs transition-all font-black data-active:bg-white dark:data-active:bg-gray-800 data-active:text-primary data-active:shadow-sm"
                >
                  {t.loginTab}
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex-1 rounded-xl text-xs transition-all font-black data-active:bg-white dark:data-active:bg-gray-800 data-active:text-primary data-active:shadow-sm"
                >
                  {t.registerTab}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {authMode === 'login' ? (
              /* ================= FORM ĐĂNG NHẬP ================= */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">
                    {t.usernameLabel}
                  </label>
                  <Input
                    type="text"
                    placeholder={t.usernamePlaceholder}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus-visible:ring-primary text-xs h-10 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">
                    {t.passwordLabel}
                  </label>
                  <Input
                    type="password"
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus-visible:ring-primary text-xs h-10 font-bold"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-300 text-xs font-bold text-center">
                    ⚠️ {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-300 text-xs font-bold text-center">
                    ✅ {success}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white shadow-md shadow-indigo-500/20 transition-all font-black text-xs"
                >
                  {loading ? t.authenticating : t.loginButton}
                </Button>
              </form>
            ) : (
              /* ================= FORM ĐĂNG KÝ + XÁC THỰC EMAIL OTP ================= */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">
                      {t.fullNameLabel}
                    </label>
                    <Input
                      type="text"
                      placeholder={t.fullNamePlaceholder}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs h-9 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">
                      {t.usernameLabel}
                    </label>
                    <Input
                      type="text"
                      placeholder={t.registerUsernamePlaceholder}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs h-9 font-bold"
                    />
                  </div>
                </div>

                {/* EMAIL + NÚT GỬI MÃ OTP */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
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
                      className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs h-9 font-bold flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || otpCooldown > 0 || loading}
                      className="h-9 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shrink-0"
                    >
                      {sendingOtp
                        ? t.sendingOtp
                        : otpCooldown > 0
                        ? `Gửi lại (${otpCooldown}s)`
                        : t.sendOtpBtn}
                    </Button>
                  </div>
                </div>

                {/* Ô NHẬP MÃ OTP 6 SỐ */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
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
                    className="rounded-xl border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-center tracking-[0.4em] text-sm h-10 font-black text-emerald-800 dark:text-emerald-300"
                  />
                  {otpDeliveryInfo && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      📩 {otpDeliveryInfo}
                    </p>
                  )}
                  {sandboxOtpPreview && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-amber-800 dark:text-amber-200">
                        <span className="font-bold">Mã OTP xác thực của bạn: </span>
                        <code className="px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900 font-black tracking-widest text-xs">
                          {sandboxOtpPreview}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpCode(sandboxOtpPreview)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black shrink-0"
                      >
                        Điền nhanh
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">
                      {t.passwordLabel}
                    </label>
                    <Input
                      type="password"
                      placeholder={t.registerPasswordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs h-9 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">
                      {t.confirmPasswordLabel}
                    </label>
                    <Input
                      type="password"
                      placeholder={t.confirmPasswordPlaceholder}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs h-9 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider block">
                    {t.roleLabel}
                  </label>
                  <select
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value as 'teacher' | 'student')}
                    disabled={loading}
                    className="flex h-9 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-foreground"
                  >
                    <option value="student">{t.roleStudent}</option>
                    <option value="teacher">{t.roleTeacher}</option>
                  </select>
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-300 text-xs font-bold text-center">
                    ⚠️ {error}
                  </div>
                )}
                {success && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{success}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white shadow-md shadow-indigo-500/20 transition-all font-black text-xs"
                >
                  {loading ? t.registering : t.registerButton}
                </Button>

                <p className="text-center text-[10px] text-gray-400 mt-2 font-semibold">
                  {t.dbSyncHint}
                </p>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
