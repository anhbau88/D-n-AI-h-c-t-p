// components/AdminPortal.tsx
// Bảng Điều Khiển Quản Trị Tối Cao (Super Admin Portal) dành cho Chủ Sở Hữu Phần Mềm (SaaS Owner)

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, LicenseCodeItem, SubscriptionPlan } from '@/types';
import {
  ShieldCheck,
  Users,
  Crown,
  KeyRound,
  TrendingUp,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Search,
  Sparkles,
  Mail,
} from 'lucide-react';

interface AdminPortalProps {
  currentUser: User;
  onNotify: (msg: string, isError?: boolean) => void;
}

export default function AdminPortal({ currentUser, onNotify }: AdminPortalProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    paidUsers: 0,
    proUsers: 0,
    vipUsers: 0,
    totalAiCallsToday: 0,
    totalLicenses: 0,
    redeemedLicenses: 0,
    estimatedRevenueVnd: 0,
  });

  const [users, setUsers] = useState<User[]>([]);
  const [licenses, setLicenses] = useState<LicenseCodeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form phát hành Mã Code mới
  const [genPlan, setGenPlan] = useState<'pro' | 'vip'>('pro');
  const [genDays, setGenDays] = useState<number>(30);
  const [genCount, setGenCount] = useState<number>(1);
  const [genEmail, setGenEmail] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?adminUsername=${encodeURIComponent(currentUser.username)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tải dữ liệu quản trị.');
      }
      if (data.stats) setStats(data.stats);
      if (Array.isArray(data.users)) setUsers(data.users);
      if (Array.isArray(data.licenses)) setLicenses(data.licenses);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi tải dữ liệu Admin', true);
    } finally {
      setLoading(false);
    }
  }, [currentUser.username, onNotify]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleGenerateLicenseCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_generate_codes',
          username: currentUser.username,
          plan: genPlan,
          durationDays: genDays,
          count: genCount,
          recipientEmail: genEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi phát hành mã code.');
      onNotify(data.message, false);
      setGenEmail('');
      fetchAdminData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi tạo mã code', true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChangeUserPlan = async (targetUsername: string, newPlan: SubscriptionPlan, durationDays = 30) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUsername: currentUser.username,
          targetUsername,
          plan: newPlan,
          durationDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể đổi gói.');
      onNotify(`Đã cập nhật gói ${newPlan.toUpperCase()} cho tài khoản ${targetUsername}!`, false);
      fetchAdminData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi cập nhật gói', true);
    }
  };

  const handleDeleteUser = async (targetUsername: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${targetUsername}"?`)) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUsername: currentUser.username,
          targetUsername,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể xóa người dùng.');
      onNotify(`Đã xóa tài khoản ${targetUsername}.`, false);
      fetchAdminData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi xóa tài khoản', true);
    }
  };

  const filteredUsers = users.filter(
    u =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-indigo-600 shrink-0" />
            Trung Tâm Quản Trị Kinh Doanh (Super Admin SaaS)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-1">
            Quản lý doanh thu, phát hành Mã Code kích hoạt gói Pro/VIP qua Email và phân quyền người dùng toàn hệ thống
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAdminData}
          disabled={loading}
          className="rounded-xl text-xs h-9 font-bold gap-1.5 border-indigo-300 text-indigo-600"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </Button>
      </div>

      {/* 4 Thẻ Thống Kê Kinh Doanh (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white/85 dark:bg-gray-900/85 border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Tổng Người Dùng</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-foreground mt-2">{stats.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-1">
            👩‍🏫 {stats.totalTeachers} Giáo viên • 👨‍🎓 {stats.totalStudents} Học sinh
          </p>
        </Card>

        <Card className="p-5 bg-white/85 dark:bg-gray-900/85 border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Thuê Bao Trả Phí</span>
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{stats.paidUsers}</p>
          <p className="text-xs text-gray-500 mt-1">
            🧠 {stats.proUsers} gói Pro • 👑 {stats.vipUsers} gói VIP
          </p>
        </Card>

        <Card className="p-5 bg-white/85 dark:bg-gray-900/85 border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Doanh Thu Mã Đã Kích Hoạt</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.estimatedRevenueVnd.toLocaleString('vi-VN')}đ
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Đã nạp {stats.redeemedLicenses} / {stats.totalLicenses} mã phát hành
          </p>
        </Card>

        <Card className="p-5 bg-white/85 dark:bg-gray-900/85 border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">Lượt Gọi AI Hôm Nay</span>
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">{stats.totalAiCallsToday}</p>
          <p className="text-xs text-gray-500 mt-1">
             Tự động xoay vòng API Key & kiểm soát Quota
          </p>
        </Card>
      </div>

      {/* Khu vực 1: Trình Phát Hành Mã Code Kích Hoạt Gói (License Key Generator) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 bg-white/85 dark:bg-gray-900/85 border-0 shadow-lg space-y-4 lg:col-span-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Phát Hành Mã Code Kích Hoạt Gói
          </h3>
          <p className="text-xs text-gray-500">
            Tạo mã Code tự động theo gói và thời hạn để gửi qua Email cho khách hàng đã thanh toán.
          </p>

          <form onSubmit={handleGenerateLicenseCodes} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Gói cước mở khóa</label>
              <select
                value={genPlan}
                onChange={(e) => setGenPlan(e.target.value as 'pro' | 'vip')}
                className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-xs font-bold"
              >
                <option value="pro">🧠 Gói PRO (Gemini 2.5 Pro Reasoning)</option>
                <option value="vip">👑 Gói VIP CENTER (AI Ultra Academic)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Thời hạn (Ngày)</label>
                <select
                  value={genDays}
                  onChange={(e) => setGenDays(Number(e.target.value))}
                  className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-xs font-bold"
                >
                  <option value={7}>7 Ngày</option>
                  <option value={30}>30 Ngày (1 Tháng)</option>
                  <option value={90}>90 Ngày (3 Tháng)</option>
                  <option value={365}>365 Ngày (1 Năm)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Số lượng mã</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="h-10 text-xs font-bold rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Gửi thẳng tới Email khách hàng (Tùy chọn)
              </label>
              <Input
                type="email"
                value={genEmail}
                onChange={(e) => setGenEmail(e.target.value)}
                placeholder="VD: khachhang@gmail.com"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full h-10 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs shadow-md"
            >
              {isGenerating ? 'Đang tạo mã...' : '⚡ Sinh Mã Code Kích Hoạt'}
            </Button>
          </form>
        </Card>

        {/* Danh sách Mã Code đã phát hành */}
        <Card className="p-5 bg-white/85 dark:bg-gray-900/85 border-0 shadow-lg lg:col-span-2 flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground mb-3">
            Danh Sách Mã Code Đã Phát Hành ({licenses.length})
          </h3>
          <div className="overflow-x-auto max-h-72 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/80 dark:bg-gray-950/60 text-gray-500 font-bold border-b border-gray-200 dark:border-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Mã Code (License Key)</th>
                  <th className="px-4 py-3">Gói / Kỳ hạn</th>
                  <th className="px-4 py-3">Email nhận / Người nạp</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Copy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {licenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                      Chưa có mã kích hoạt nào được phát hành.
                    </td>
                  </tr>
                ) : (
                  licenses.map((lic) => (
                    <tr key={lic.code} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-2.5 font-mono font-black text-indigo-600 dark:text-indigo-400">
                        {lic.code}
                      </td>
                      <td className="px-4 py-2.5 font-bold">
                        <Badge className={lic.plan === 'vip' ? 'bg-amber-500 text-white border-0' : 'bg-indigo-600 text-white border-0'}>
                          {lic.plan.toUpperCase()} • {lic.durationDays}D
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {lic.redeemedBy ? `Đã nạp bởi: ${lic.redeemedBy}` : (lic.targetEmail || '---')}
                      </td>
                      <td className="px-4 py-2.5">
                        {lic.status === 'redeemed' ? (
                          <span className="text-emerald-600 font-bold">✅ Đã sử dụng</span>
                        ) : (
                          <span className="text-amber-600 font-bold">⏳ Chưa nạp</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(lic.code);
                            setCopiedCode(lic.code);
                            setTimeout(() => setCopiedCode(null), 1500);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                          title="Sao chép mã"
                        >
                          {copiedCode === lic.code ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Khu vực 2: Quản lý Người dùng & Cấp Gói Cước Trực Tiếp (Users CRM) */}
      <Card className="p-5 bg-white/85 dark:bg-gray-900/85 border-0 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
            Quản Lý Toàn Bộ Tài Khoản Khách Hàng ({filteredUsers.length})
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm username, họ tên hoặc email..."
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100/80 dark:bg-gray-950/60 text-gray-500 font-bold border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3">Tài khoản / Họ tên</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Vai trò / Lớp</th>
                <th className="px-4 py-3">Gói hiện tại & Hạn dùng</th>
                <th className="px-4 py-3">Quota AI / XP</th>
                <th className="px-4 py-3 text-right">Cấp gói nhanh / Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.map((u) => (
                <tr key={u.username} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 font-semibold">
                  <td className="px-4 py-3">
                    <p className="font-black text-foreground">{u.fullName || u.username}</p>
                    <p className="text-[11px] font-mono text-gray-400">@{u.username}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {u.email || <span className="text-gray-300 italic">Chưa cập nhật</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'teacher' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {u.role === 'teacher' ? '👩‍🏫 Giáo viên' : '👨‍🎓 Học sinh'}
                    </span>
                    {u.room && <span className="ml-1.5 text-[11px] text-gray-400">({u.room})</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={
                      u.plan === 'vip'
                        ? 'bg-amber-500 text-white border-0'
                        : u.plan === 'pro'
                        ? 'bg-indigo-600 text-white border-0'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-0'
                    }>
                      {(u.plan || 'free').toUpperCase()}
                    </Badge>
                    {u.planExpiresAt && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Hết hạn: {new Date(u.planExpiresAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <span>{u.aiQuotaUsed || 0} lượt AI</span> • <span className="text-amber-600 font-bold">⭐ {u.xp || 0} XP</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleChangeUserPlan(u.username, 'free')}
                        className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-[10px] font-bold"
                        title="Đặt về gói Free"
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeUserPlan(u.username, 'pro', 30)}
                        className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 hover:bg-indigo-100 text-[10px] font-bold"
                        title="Cấp gói Pro 30 ngày"
                      >
                        +Pro 30D
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeUserPlan(u.username, 'vip', 365)}
                        className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 hover:bg-amber-100 text-[10px] font-bold"
                        title="Cấp gói VIP 365 ngày"
                      >
                        +VIP 1Y
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.username)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 ml-1"
                        title="Xóa tài khoản"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
