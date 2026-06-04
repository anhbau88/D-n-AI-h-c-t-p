'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  language: 'vi' | 'en';
  setLanguage: (lang: 'vi' | 'en') => void;
}

const AUTH_TRANSLATIONS = {
  vi: {
    systemSubtitle: "Hệ thống trợ lý ôn tập & giảng dạy thông minh",
    loginTab: "🔑 Đăng nhập",
    registerTab: "📝 Đăng ký",
    usernameLabel: "Tên đăng nhập",
    usernamePlaceholder: "Nhập tên đăng nhập của bạn...",
    passwordLabel: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu...",
    loginButton: "Đăng nhập vào hệ thống",
    authenticating: "Đang xác thực...",
    sampleAccountHint: "Dữ liệu người dùng đã được làm sạch. Vui lòng bấm vào tab \"Đăng ký\" ở trên để tạo tài khoản Giáo viên hoặc Học sinh mới để bắt đầu trải nghiệm!",
    teacherPrefix: "GV:",
    studentPrefix: "HS:",
    passwordPrefix: "Mật khẩu:",
    fullNameLabel: "Họ và tên",
    fullNamePlaceholder: "Nhập họ và tên thật của bạn...",
    registerUsernamePlaceholder: "Nhập tên đăng nhập viết liền không dấu...",
    registerPasswordPlaceholder: "Tạo mật khẩu đăng nhập...",
    confirmPasswordLabel: "Nhập lại mật khẩu",
    confirmPasswordPlaceholder: "Nhập lại mật khẩu lần nữa...",
    roleLabel: "Vai trò",
    roleStudent: "👨‍🎓 Học sinh",
    roleTeacher: "👩‍🏫 Giáo viên",
    classLabel: "Lớp học",
    classPlaceholder: "-- Lớp --",
    registerButton: "Đăng ký tài khoản mới",
    registering: "Đang đăng ký...",
    dbSyncHint: "(Dữ liệu tài khoản sẽ được đồng bộ bảo mật lên hệ thống Vercel Blob)",
    errorEmptyFields: "Vui lòng điền đầy đủ các thông tin",
    errorLoginEmpty: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu",
    errorPasswordMismatch: "Mật khẩu nhập lại không trùng khớp",
    errorSelectClass: "Vui lòng chọn lớp học",
    successLogin: "Đăng nhập thành công!",
    successRegister: "Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.",
  },
  en: {
    systemSubtitle: "Intelligent Practice & Teaching Assistant System",
    loginTab: "🔑 Log In",
    registerTab: "📝 Register",
    usernameLabel: "Username",
    usernamePlaceholder: "Enter your username...",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password...",
    loginButton: "Log In to System",
    authenticating: "Authenticating...",
    sampleAccountHint: "All registered users have been cleared. Please click the \"Register\" tab above to create a new Teacher or Student account to get started!",
    teacherPrefix: "Teacher:",
    studentPrefix: "Student:",
    passwordPrefix: "Password:",
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "Enter your real full name...",
    registerUsernamePlaceholder: "Enter username without spaces/accents...",
    registerPasswordPlaceholder: "Create login password...",
    confirmPasswordLabel: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm password again...",
    roleLabel: "Role",
    roleStudent: "👨‍🎓 Student",
    roleTeacher: "👩‍🏫 Teacher",
    classLabel: "Class Room",
    classPlaceholder: "-- Class --",
    registerButton: "Register New Account",
    registering: "Registering...",
    dbSyncHint: "(Account data will be securely synced to Vercel Blob)",
    errorEmptyFields: "Please fill in all information",
    errorLoginEmpty: "Please enter username and password",
    errorPasswordMismatch: "Passwords do not match",
    errorSelectClass: "Please select a classroom",
    successLogin: "Log In successful!",
    successRegister: "Registration successful! You can log in now.",
  }
};

export default function AuthScreen({ onLogin, language, setLanguage }: AuthScreenProps) {
  // Mode Đăng nhập hay Đăng ký
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // States chung
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // States dành riêng cho Đăng ký
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<'teacher' | 'student'>('student');
  
  const t = AUTH_TRANSLATIONS[language];

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
      // Gọi callback đăng nhập của ứng dụng
      onLogin(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đăng ký
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !fullName.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t.errorEmptyFields);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.errorPasswordMismatch);
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
          password: password.trim(),
          confirmPassword: confirmPassword.trim(),
          role: registerRole,
          room: ''
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      setSuccess(t.successRegister);
      
      // Reset form đăng ký và chuyển sang tab đăng nhập
      setConfirmPassword('');
      setFullName('');
      setAuthMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background p-4 overflow-hidden">
      
      {/* Language Switcher Button (Top Right of Screen) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur-md">
        <button 
          type="button"
          onClick={() => {
            const nextLang = language === 'vi' ? 'en' : 'vi';
            setLanguage(nextLang);
            localStorage.setItem('language', nextLang);
          }} 
          className="text-primary hover:scale-110 active:scale-95 transition-transform flex items-center gap-1.5 text-xs font-black"
          title={language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
        >
          <span className="material-symbols-outlined text-[18px]">translate</span>
          <span>{language === 'vi' ? 'English' : 'Tiếng Việt'}</span>
        </button>
      </div>

      {/* Background decorative glowing blur circles */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
      
      <Card className="relative w-full max-w-md p-8 border border-gray-200 dark:border-gray-800/30 shadow-[0_20px_50px_rgba(99,102,241,0.06)] bg-white/60 dark:bg-gray-900/50 backdrop-blur-2xl transition-all duration-300 rounded-3xl z-10">
        <div className="text-center mb-6">
          <div className="relative w-20 h-20 mx-auto mb-4 hover:scale-105 transition-all duration-300">
            <Image 
              src="/logo.png" 
              alt="AI Study Assistant Logo" 
              width={80}
              height={80}
              className="w-full h-full object-contain rounded-2xl shadow-lg border border-white/20 dark:border-gray-800/30"
            />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent tracking-tight">
            AI Study Assistant
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-xs font-bold">{t.systemSubtitle}</p>
        </div>

        {/* Tab chuyển đổi giữa Đăng nhập & Đăng ký */}
        <Tabs value={authMode} onValueChange={(v) => {
          setAuthMode(v as 'login' | 'register');
          setError('');
          setSuccess('');
        }} className="w-full mb-6">
          <TabsList className="flex w-full !w-full h-10 !h-10 bg-gray-100/60 dark:bg-gray-800/40 p-1 rounded-2xl border border-gray-300 dark:border-gray-800">
            <TabsTrigger 
              value="login"
              className="rounded-xl text-xs transition-all font-black data-active:bg-white dark:data-active:bg-gray-800 data-active:text-primary data-active:shadow-sm border-transparent data-active:border-transparent dark:data-active:border-transparent"
            >
              {t.loginTab}
            </TabsTrigger>
            <TabsTrigger 
              value="register"
              className="rounded-xl text-xs transition-all font-black data-active:bg-white dark:data-active:bg-gray-800 data-active:text-primary data-active:shadow-sm border-transparent data-active:border-transparent dark:data-active:border-transparent"
            >
              {t.registerTab}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {authMode === 'login' ? (
          /* ================= FORM ĐĂNG NHẬP ================= */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                {t.usernameLabel}
              </label>
              <Input 
                type="text"
                placeholder={t.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-primary focus-visible:border-primary transition-all text-xs h-10 font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                {t.passwordLabel}
              </label>
              <Input 
                type="password"
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-primary focus-visible:border-primary transition-all text-xs h-10 font-bold"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs mt-2 text-center font-bold">⚠️ {error}</p>
            )}
            {success && (
              <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-2 text-center font-bold">✅ {success}</p>
            )}

            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-6 rounded-xl bg-gradient-to-r from-primary to-violet hover:brightness-110 text-white shadow-md shadow-primary/10 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all font-bold text-xs"
            >
              {loading ? t.authenticating : t.loginButton}
            </Button>

            <div className="text-[10px] text-center text-gray-500 dark:text-gray-400 mt-4 bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-200/10 font-bold leading-normal">
              <p>{t.sampleAccountHint}</p>
            </div>
          </form>
        ) : (
          /* ================= FORM ĐĂNG KÝ ================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                {t.fullNameLabel}
              </label>
              <Input 
                type="text"
                placeholder={t.fullNamePlaceholder}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-primary transition-all text-xs h-10 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                {t.usernameLabel}
              </label>
              <Input 
                type="text"
                placeholder={t.registerUsernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-primary transition-all text-xs h-10 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                {t.passwordLabel}
              </label>
              <Input 
                type="password"
                placeholder={t.registerPasswordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-primary transition-all text-xs h-10 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                {t.confirmPasswordLabel}
              </label>
              <Input 
                type="password"
                placeholder={t.confirmPasswordPlaceholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-primary transition-all text-xs h-10 font-bold"
              />
            </div>

            <div className="space-y-2 mt-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                {t.roleLabel}
              </label>
              <select
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value as 'teacher' | 'student')}
                disabled={loading}
                className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-foreground"
              >
                <option value="student">{t.roleStudent}</option>
                <option value="teacher">{t.roleTeacher}</option>
              </select>
            </div>

            {error && (
              <p className="text-red-500 text-xs mt-2 text-center font-bold">⚠️ {error}</p>
            )}
            {success && (
              <p className="text-emerald-500 text-xs mt-2 text-center font-bold">✅ {success}</p>
            )}

            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-6 rounded-xl bg-gradient-to-r from-primary to-violet hover:brightness-110 text-white shadow-md shadow-primary/10 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all font-bold text-xs"
            >
              {loading ? t.registering : t.registerButton}
            </Button>
            
            <p className="text-center text-[9px] text-gray-400 mt-3 font-semibold">
              {t.dbSyncHint}
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
