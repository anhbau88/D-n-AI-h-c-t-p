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
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
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
  const [registerRoom, setRegisterRoom] = useState('');

  const CLASSES = ['64CTT1', '64CTT2', '64CTT3', '64CTT4', '64CTT5'];

  // Xử lý đăng nhập
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
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

      setSuccess('Đăng nhập thành công!');
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
      setError('Vui lòng điền đầy đủ các thông tin');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không trùng khớp');
      return;
    }

    if (!registerRoom) {
      setError('Vui lòng chọn lớp học');
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
          room: registerRoom
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      setSuccess('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
      
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
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4 overflow-hidden">
      
      {/* Background decorative glowing blur circles */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
      
      <Card className="relative w-full max-w-md p-8 border border-white/20 dark:border-gray-800/30 shadow-[0_20px_50px_rgba(8,112,184,0.06)] bg-white/60 dark:bg-gray-900/50 backdrop-blur-2xl transition-all duration-300 rounded-3xl z-10">
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
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight">
            AI Study Assistant
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-xs font-medium">Hệ thống trợ lý ôn tập & giảng dạy thông minh</p>
        </div>

        {/* Tab chuyển đổi giữa Đăng nhập & Đăng ký */}
        <Tabs value={authMode} onValueChange={(v) => {
          setAuthMode(v as 'login' | 'register');
          setError('');
          setSuccess('');
        }} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100/60 dark:bg-gray-800/40 p-1 rounded-2xl border border-gray-200/20 dark:border-gray-800/20">
            <TabsTrigger 
              value="login"
              className="rounded-xl text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-md transition-all font-bold"
            >
              🔑 Đăng nhập
            </TabsTrigger>
            <TabsTrigger 
              value="register"
              className="rounded-xl text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-md transition-all font-bold"
            >
              📝 Đăng ký
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {authMode === 'login' ? (
          /* ================= FORM ĐĂNG NHẬP ================= */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Tên đăng nhập
              </label>
              <Input 
                type="text"
                placeholder="Nhập tên đăng nhập của bạn..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-850 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all text-xs h-10"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Mật khẩu
              </label>
              <Input 
                type="password"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-850 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all text-xs h-10"
              />
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
              className="w-full h-11 mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/10 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all font-semibold text-xs"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
            </Button>

            <div className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-4 space-y-1 bg-gray-50/50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-200/10">
              <p>Sử dụng tài khoản mẫu để trải nghiệm nhanh:</p>
              <p className="font-bold text-gray-600 dark:text-gray-400">
                GV: <span className="underline">giao-vien-1</span> / HS: <span className="underline">hoc-sinh-1</span> (Mật khẩu: <span className="underline">123</span>)
              </p>
            </div>
          </form>
        ) : (
          /* ================= FORM ĐĂNG KÝ ================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Họ và tên
              </label>
              <Input 
                type="text"
                placeholder="Nhập họ và tên thật của bạn..."
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-850 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-emerald-500 transition-all text-xs h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Tên đăng nhập
              </label>
              <Input 
                type="text"
                placeholder="Nhập tên đăng nhập viết liền không dấu..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-850 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-emerald-500 transition-all text-xs h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Mật khẩu
              </label>
              <Input 
                type="password"
                placeholder="Tạo mật khẩu đăng nhập..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-850 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-emerald-500 transition-all text-xs h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Nhập lại mật khẩu
              </label>
              <Input 
                type="password"
                placeholder="Nhập lại mật khẩu lần nữa..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="rounded-xl border-gray-200 dark:border-gray-850 bg-white/50 dark:bg-gray-900/50 focus-visible:ring-emerald-500 transition-all text-xs h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  Vai trò
                </label>
                <select
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value as 'teacher' | 'student')}
                  disabled={loading}
                  className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                >
                  <option value="student">👨‍🎓 Học sinh</option>
                  <option value="teacher">👩‍🏫 Giáo viên</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  Lớp học
                </label>
                <select
                  value={registerRoom}
                  onChange={(e) => setRegisterRoom(e.target.value)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                >
                  <option value="" disabled>-- Lớp --</option>
                  {CLASSES.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
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
              className="w-full h-11 mt-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/10 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all font-semibold text-xs"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản mới'}
            </Button>
            
            <p className="text-center text-[9px] text-gray-400 mt-3">
              (Dữ liệu tài khoản sẽ được đồng bộ bảo mật lên hệ thống Vercel Blob)
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
