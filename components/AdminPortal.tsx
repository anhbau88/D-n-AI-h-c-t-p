// components/AdminPortal.tsx
// Không Gian Quản Trị Độc Lập (SaaS Admin Workspace)
// Tổ chức theo 5 mục chuẩn: Tổng quan · Người dùng · Thanh toán · Mã và ưu đãi · Vận hành

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, LicenseCodeItem, SubscriptionOrder, SubscriptionPlan, UserRole } from '@/types';
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
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  Activity,
  CreditCard,
  LayoutDashboard,
} from 'lucide-react';

export type AdminSectionTab = 'overview' | 'users' | 'payments' | 'codes' | 'operations';

interface CouponRecord {
  code: string;
  discountPercent?: number;
  discountAmountVnd?: number;
  description?: string;
  maxUses?: number;
  usedCount: number;
}

interface AdminPortalProps {
  currentUser: User;
  onNotify: (msg: string, isError?: boolean) => void;
  activeSection?: AdminSectionTab;
  onSelectSection?: (sec: AdminSectionTab) => void;
}

export default function AdminPortal({
  currentUser,
  onNotify,
  activeSection: externalSection,
  onSelectSection,
}: AdminPortalProps) {
  const [internalSection, setInternalSection] = useState<AdminSectionTab>('overview');
  const activeTab = externalSection || internalSection;
  const setActiveTab = (sec: AdminSectionTab) => {
    setInternalSection(sec);
    onSelectSection?.(sec);
  };

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
    pendingOrdersCount: 0,
    estimatedRevenueVnd: 0,
  });

  const [users, setUsers] = useState<User[]>([]);
  const [licenses, setLicenses] = useState<LicenseCodeItem[]>([]);
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'code_sent' | 'cancelled'>('all');

  // Cấu hình Ngân hàng VietQR
  const [bankId, setBankId] = useState('MB');
  const [accountNo, setAccountNo] = useState('0988888888');
  const [accountName, setAccountName] = useState('AI STUDY ASSISTANT');
  const [hotline, setHotline] = useState('0923678668');
  const [approvalMode, setApprovalMode] = useState<'instant' | 'manual_review'>('manual_review');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Form phát hành Mã Code mới
  const [genPlan, setGenPlan] = useState<SubscriptionPlan>('hs_plus');
  const [genDays, setGenDays] = useState<number>(30);
  const [genCount, setGenCount] = useState<number>(1);
  const [genEmail, setGenEmail] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form tạo Mã Ưu Đãi (Coupon)
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState<number>(20);
  const [couponDesc, setCouponDesc] = useState('');
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

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
      if (Array.isArray(data.orders)) setOrders(data.orders);
      if (Array.isArray(data.coupons)) setCoupons(data.coupons);
      if (data.billingSettings) {
        setBankId(data.billingSettings.bankId || 'MB');
        setAccountNo(data.billingSettings.accountNo || '0988888888');
        setAccountName(data.billingSettings.accountName || 'AI STUDY ASSISTANT');
        setHotline(data.billingSettings.hotline || '0923678668');
        setApprovalMode(data.billingSettings.approvalMode || 'manual_review');
      }
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi tải dữ liệu Admin', true);
    } finally {
      setLoading(false);
    }
  }, [currentUser.username, onNotify]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleSaveBillingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_update_settings',
          username: currentUser.username,
          bankId,
          accountNo,
          accountName,
          hotline,
          approvalMode: 'manual_review',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu cấu hình thanh toán.');
      onNotify(data.message, false);
      fetchAdminData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi lưu cấu hình', true);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    setProcessingOrderId(orderId);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_approve_order',
          username: currentUser.username,
          orderId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi duyệt đơn hàng.');
      onNotify(data.message, false);
      fetchAdminData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi duyệt đơn hàng', true);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!confirm(`Bạn có chắc muốn từ chối / hủy đơn #${orderId} do chưa nhận được tiền?`)) return;
    setProcessingOrderId(orderId);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_reject_order',
          username: currentUser.username,
          orderId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi từ chối đơn hàng.');
      onNotify(data.message, false);
      fetchAdminData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi hủy đơn hàng', true);
    } finally {
      setProcessingOrderId(null);
    }
  };

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

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsCreatingCoupon(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_create_coupon',
          username: currentUser.username,
          code: couponCode.trim().toUpperCase(),
          discountPercent: couponPercent,
          description: couponDesc.trim() || `Giảm ${couponPercent}% gói học tập`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo mã ưu đãi.');
      onNotify(data.message, false);
      setCouponCode('');
      setCouponDesc('');
      fetchAdminData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi tạo mã ưu đãi', true);
    } finally {
      setIsCreatingCoupon(false);
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

  const handleChangeUserRole = async (targetUsername: string, newRole: UserRole) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUsername: currentUser.username,
          targetUsername,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể đổi vai trò.');
      onNotify(`Đã đổi vai trò của ${targetUsername} sang ${newRole}!`, false);
      fetchAdminData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Lỗi đổi vai trò', true);
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

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);

  const navItems: { id: AdminSectionTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Tổng quan', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'users', label: 'Người dùng', icon: <Users className="w-4 h-4" />, badge: stats.totalUsers },
    { id: 'payments', label: 'Thanh toán', icon: <CreditCard className="w-4 h-4" />, badge: pendingOrders.length || undefined },
    { id: 'codes', label: 'Mã và ưu đãi', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'operations', label: 'Vận hành', icon: <Activity className="w-4 h-4" /> },
  ];

  const renderOrderTable = (orderList: SubscriptionOrder[]) => (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#F5F6FA] dark:bg-gray-950/60 text-gray-600 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
          <tr>
            <th className="px-4 py-3">Mã Đơn / Tài khoản</th>
            <th className="px-4 py-3">Gói mua & Số tiền</th>
            <th className="px-4 py-3">Email nhận Code</th>
            <th className="px-4 py-3">Trạng thái / Mã kích hoạt</th>
            <th className="px-4 py-3 text-right">Xác nhận nhận tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {orderList.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-gray-400 font-medium">
                Không có đơn đăng ký gói nào trong danh sách này.
              </td>
            </tr>
          ) : (
            orderList.map((ord) => (
              <tr key={ord.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <p className="font-mono font-black text-foreground">{ord.id}</p>
                  <p className="text-[11px] text-gray-500">
                    {ord.fullName || ord.username} (@{ord.username})
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(ord.createdAt).toLocaleString('vi-VN')}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Badge className={ord.plan === 'vip' ? 'bg-amber-500 text-white border-0' : 'bg-[#6545D8] text-white border-0'}>
                    {ord.plan.toUpperCase()} • {ord.durationDays} ngày
                  </Badge>
                  <p className="text-xs font-black text-emerald-600 mt-1">
                    {(ord.amountVnd || 0).toLocaleString('vi-VN')}đ
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">
                  {ord.email}
                </td>
                <td className="px-4 py-3">
                  {ord.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                      <Clock className="w-3.5 h-3.5" /> Chờ xác nhận tiền về
                    </span>
                  )}
                  {ord.status === 'code_sent' && (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác nhận & gửi mã
                      </span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 px-2 py-0.5 rounded font-black">
                          {ord.licenseCode}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(ord.licenseCode);
                            setCopiedCode(ord.licenseCode);
                            setTimeout(() => setCopiedCode(null), 1500);
                          }}
                          className="text-gray-400 hover:text-foreground"
                          title="Sao chép mã"
                        >
                          {copiedCode === ord.licenseCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {ord.status === 'cancelled' && (
                    <span className="text-red-600 font-bold">❌ Đã từ chối / Hủy</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {ord.status === 'pending' ? (
                    <div className="inline-flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={processingOrderId === ord.id}
                        onClick={() => handleApproveOrder(ord.id)}
                        className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {processingOrderId === ord.id ? 'Đang gửi mã...' : 'Xác nhận đã nhận tiền & Gửi mã'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingOrderId === ord.id}
                        onClick={() => handleRejectOrder(ord.id)}
                        className="h-9 px-2.5 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                        title="Từ chối đơn"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-semibold">Đã xử lý</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & 5 Mục Điều Hướng Quản Trị */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F3F0FF] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 text-xs font-bold mb-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Không Gian Quản Trị Hệ Thống (SaaS Admin)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#172033] dark:text-white">
              Cổng Quản Trị Trợ Lý Học Tập
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Quản lý người dùng, xác nhận tiền chuyển khoản để gửi Mã Code kích hoạt, phát hành ưu đãi và giám sát vận hành.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAdminData}
            disabled={loading}
            className="rounded-xl text-xs h-10 px-4 font-bold gap-1.5 border-gray-300 text-foreground shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </Button>
        </div>

        {/* 5 Mục Điều Hướng Chuẩn */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-11 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-[#6545D8] text-white shadow-xs'
                    : 'bg-[#F5F6FA] dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200/70'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      isActive
                        ? 'bg-white text-[#6545D8]'
                        : item.id === 'payments'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: TỔNG QUAN (OVERVIEW) */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Thẻ Thống Kê Kinh Doanh (KPI Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Tổng Người Dùng</span>
                <Users className="w-5 h-5 text-[#6545D8]" />
              </div>
              <p className="text-3xl font-black text-foreground mt-2">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalTeachers} Giáo viên • {stats.totalStudents} Học sinh
              </p>
            </Card>

            <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Đơn Chờ Duyệt Tiền</span>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-amber-600 mt-2">{pendingOrders.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                Chỉ gửi mã khi Admin bấm xác nhận tiền về
              </p>
            </Card>

            <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Doanh Thu Đã Kích Hoạt</span>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
                {stats.estimatedRevenueVnd.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.paidUsers} thuê bao Pro/VIP đang hoạt động
              </p>
            </Card>

            <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Lượt Gọi AI Hôm Nay</span>
                <Sparkles className="w-5 h-5 text-[#6545D8]" />
              </div>
              <p className="text-3xl font-black text-[#6545D8] mt-2">{stats.totalAiCallsToday}</p>
              <p className="text-xs text-gray-500 mt-1">
                Đã nạp {stats.redeemedLicenses} / {stats.totalLicenses} mã phát hành
              </p>
            </Card>
          </div>

          {/* Đơn hàng đang chờ xác nhận tiền (Ưu tiên xử lý ngay trên Tổng quan) */}
          <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Đơn Đăng Ký Gói Đang Chờ Xác Nhận Đã Nhận Tiền ({pendingOrders.length})
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kiểm tra biến động số dư ngân hàng ({bankId} - {accountNo}). Khi bấm <strong>&ldquo;Xác nhận đã nhận tiền & Gửi mã&rdquo;</strong>, hệ thống mới sinh Mã Code và gửi Email cho người mua.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('payments')}
                className="rounded-xl text-xs font-bold"
              >
                Xem toàn bộ lịch sử đơn ({orders.length})
              </Button>
            </div>

            {renderOrderTable(pendingOrders.length > 0 ? pendingOrders : orders.slice(0, 5))}
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: NGƯỜI DÙNG (USERS) */}
      {/* ===================================================================== */}
      {activeTab === 'users' && (
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-foreground">
                Danh Sách Tài Khoản Người Dùng ({filteredUsers.length})
              </h2>
              <p className="text-xs text-gray-500">
                Phân quyền vai trò (Học sinh / Giáo viên / Quản trị) và cấp gói dịch vụ trực tiếp.
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm username, họ tên hoặc email..."
                className="pl-9 h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F6FA] dark:bg-gray-950/60 text-gray-600 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3">Tài khoản / Họ tên</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Gói dịch vụ & Hạn dùng</th>
                  <th className="px-4 py-3">Lượt AI / XP</th>
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
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeUserRole(u.username, e.target.value as UserRole)}
                        className="h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs font-bold"
                      >
                        <option value="student">👨‍🎓 Học sinh</option>
                        <option value="teacher">👩‍🏫 Giáo viên</option>
                        <option value="admin">🛡️ Quản trị</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={
                        u.plan === 'vip'
                          ? 'bg-amber-500 text-white border-0'
                          : u.plan === 'pro'
                          ? 'bg-[#6545D8] text-white border-0'
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
                      <span>{u.aiQuotaUsed || 0} lượt AI</span> • <span className="text-amber-600 font-bold">{u.xp || 0} XP</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleChangeUserPlan(u.username, 'free')}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-[11px] font-bold"
                        >
                          Free
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeUserPlan(u.username, 'pro', 30)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#F3F0FF] text-[#6545D8] hover:bg-indigo-100 text-[11px] font-bold"
                        >
                          +Pro 30D
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeUserPlan(u.username, 'vip', 365)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-bold"
                        >
                          +VIP 1Y
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.username)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 ml-1"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: THANH TOÁN & DUYỆT ĐƠN (PAYMENTS) */}
      {/* ===================================================================== */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột cấu hình ngân hàng VietQR */}
          <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs space-y-4 lg:col-span-1">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#6545D8] flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Tài Khoản Ngân Hàng Nhận Tiền (VietQR)
            </h3>
            <p className="text-xs text-gray-500">
              Cấu hình tài khoản ngân hàng hiển thị trên mã QR khi người dùng đăng ký gói mua.
            </p>

            <form onSubmit={handleSaveBillingSettings} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Ngân hàng thụ hưởng</label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-xs font-bold"
                >
                  <option value="MB">MBBank (Ngân hàng Quân Đội)</option>
                  <option value="VCB">Vietcombank (VCB)</option>
                  <option value="TCB">Techcombank (TCB)</option>
                  <option value="ACB">ACB (Á Châu)</option>
                  <option value="BIDV">BIDV</option>
                  <option value="ICB">VietinBank (ICB)</option>
                  <option value="VPB">VPBank</option>
                  <option value="TPB">TPBank</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Số tài khoản</label>
                <Input
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  placeholder="VD: 0988888888"
                  className="h-10 text-xs font-bold rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Tên chủ tài khoản</label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="VD: TRAN ANH VIET"
                  className="h-10 text-xs font-bold rounded-xl uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Số Zalo / Hotline hỗ trợ</label>
                <Input
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  placeholder="0923678668"
                  className="h-10 text-xs font-bold rounded-xl"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-[11px] text-emerald-800 dark:text-emerald-200">
                🛡️ <strong>Chế độ duyệt thanh toán:</strong> Bắt buộc Quản trị viên xác nhận đã nhận tiền mới sinh và gửi Mã Code kích hoạt.
              </div>

              <Button
                type="submit"
                disabled={isSavingSettings}
                className="w-full h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-xs"
              >
                {isSavingSettings ? 'Đang lưu...' : 'Lưu Cấu Hình Ngân Hàng'}
              </Button>
            </form>
          </Card>

          {/* Cột danh sách đơn đăng ký gói */}
          <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-foreground">
                  Quản Lý Đơn Mua Gói & Xác Nhận Tiền Về ({filteredOrders.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Chỉ khi bạn bấm &ldquo;Xác nhận đã nhận tiền & Gửi mã&rdquo;, khách hàng mới nhận được mã kích hoạt.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'pending', 'code_sent', 'cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      orderFilter === st
                        ? 'bg-[#6545D8] text-white'
                        : 'bg-[#F5F6FA] dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {st === 'all' && `Tất cả (${orders.length})`}
                    {st === 'pending' && `Chờ duyệt (${pendingOrders.length})`}
                    {st === 'code_sent' && 'Đã gửi mã'}
                    {st === 'cancelled' && 'Đã hủy'}
                  </button>
                ))}
              </div>
            </div>

            {renderOrderTable(filteredOrders)}
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: MÃ KÍCH HOẠT & ƯU ĐÃI (CODES & COUPONS) */}
      {/* ===================================================================== */}
      {activeTab === 'codes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Phát hành mã kích hoạt thủ công */}
            <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#6545D8] flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> Phát Hành Mã Kích Hoạt (License Code)
              </h3>
              <p className="text-xs text-gray-500">
                Tạo mã kích hoạt gói Pro / VIP để cấp trực tiếp hoặc gửi Email cho học viên.
              </p>

              <form onSubmit={handleGenerateLicenseCodes} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Gói dịch vụ (Niêm yết 08/11/2026)</label>
                  <select
                    value={genPlan}
                    onChange={(e) => setGenPlan(e.target.value as SubscriptionPlan)}
                    className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-xs font-bold"
                  >
                    <option value="hs_basic">Học Sinh Cơ Bản (39.000đ · 250 Điểm AI)</option>
                    <option value="hs_plus">Học Sinh Plus (69.000đ · 500 Điểm AI)</option>
                    <option value="gv_basic">Giáo Viên Cơ Bản (129.000đ · 1.000 Điểm AI)</option>
                    <option value="gv_pro">Giáo Viên Pro (249.000đ · 2.000 Điểm AI)</option>
                    <option value="topup_small">Gói Nạp Thêm Nhỏ (19.000đ · 100 Điểm AI)</option>
                    <option value="topup_std">Gói Nạp Thêm Tiêu Chuẩn (49.000đ · 300 Điểm AI)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Kỳ hạn (Ngày)</label>
                    <select
                      value={genDays}
                      onChange={(e) => setGenDays(Number(e.target.value))}
                      className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-xs font-bold"
                    >
                      <option value={7}>7 Ngày</option>
                      <option value={30}>30 Ngày</option>
                      <option value={90}>90 Ngày</option>
                      <option value={365}>365 Ngày</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Số lượng mã</label>
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
                  <label className="text-xs font-bold text-gray-600 block mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Gửi tới Email người nhận (Tùy chọn)
                  </label>
                  <Input
                    type="email"
                    value={genEmail}
                    onChange={(e) => setGenEmail(e.target.value)}
                    placeholder="VD: hocsinh@gmail.com"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-bold text-xs"
                >
                  {isGenerating ? 'Đang tạo mã...' : 'Sinh Mã Kích Hoạt'}
                </Button>
              </form>
            </Card>

            {/* Danh sách Mã Code đã phát hành */}
            <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs lg:col-span-2 flex flex-col">
              <h3 className="text-base font-black text-foreground mb-3">
                Kho Mã Kích Hoạt Đã Phát Hành ({licenses.length})
              </h3>
              <div className="overflow-x-auto max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F6FA] dark:bg-gray-950/60 text-gray-600 font-bold border-b border-gray-200 dark:border-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Mã Code (License Key)</th>
                      <th className="px-4 py-3">Gói / Kỳ hạn</th>
                      <th className="px-4 py-3">Email nhận / Người nạp</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Sao chép</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {licenses.map((lic) => (
                      <tr key={lic.code} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-2.5 font-mono font-black text-[#6545D8] dark:text-indigo-400">
                          {lic.code}
                        </td>
                        <td className="px-4 py-2.5 font-bold">
                          <Badge className={lic.plan === 'vip' ? 'bg-amber-500 text-white border-0' : 'bg-[#6545D8] text-white border-0'}>
                            {lic.plan.toUpperCase()} • {lic.durationDays}D
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {lic.redeemedBy ? `Đã nạp bởi: @${lic.redeemedBy}` : (lic.targetEmail || '---')}
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
                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600"
                          >
                            {copiedCode === lic.code ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Quản lý Mã giảm giá (Coupons) */}
          <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#6545D8]" />
              Quản Lý Mã Ưu Đãi Giảm Giá (Coupons)
            </h3>
            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Mã ưu đãi (VD: HOCVUI20)"
                className="h-10 text-xs font-mono font-bold uppercase rounded-xl"
              />
              <Input
                type="number"
                min={5}
                max={90}
                value={couponPercent}
                onChange={(e) => setCouponPercent(Number(e.target.value))}
                placeholder="% Giảm giá"
                className="h-10 text-xs font-bold rounded-xl"
              />
              <Input
                value={couponDesc}
                onChange={(e) => setCouponDesc(e.target.value)}
                placeholder="Mô tả chương trình ưu đãi..."
                className="h-10 text-xs rounded-xl"
              />
              <Button
                type="submit"
                disabled={isCreatingCoupon}
                className="h-10 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white text-xs font-bold"
              >
                {isCreatingCoupon ? 'Đang thêm...' : '+ Tạo Mã Ưu Đãi'}
              </Button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {coupons.map((cp) => (
                <div
                  key={cp.code}
                  className="p-3.5 rounded-xl bg-[#F5F6FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                >
                  <div>
                    <p className="font-mono font-black text-sm text-[#6545D8]">{cp.code}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{cp.description}</p>
                  </div>
                  <Badge className="bg-emerald-600 text-white border-0 font-bold">
                    {cp.discountPercent ? `-${cp.discountPercent}%` : `-${(cp.discountAmountVnd || 0).toLocaleString('vi-VN')}đ`}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: VẬN HÀNH HỆ THỐNG (OPERATIONS) */}
      {/* ===================================================================== */}
      {activeTab === 'operations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Trạng Thái Vận Hành & Lưu Trữ Bền Vững
            </h3>
            <div className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F6FA] dark:bg-gray-800">
                <span className="font-semibold">Cơ sở dữ liệu Đám mây (Firebase Firestore)</span>
                <Badge className="bg-emerald-600 text-white border-0">Đang hoạt động</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F6FA] dark:bg-gray-800">
                <span className="font-semibold">Cơ chế duyệt thanh toán gói dịch vụ</span>
                <Badge className="bg-[#6545D8] text-white border-0">Admin xác nhận tiền mới gửi mã</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F6FA] dark:bg-gray-800">
                <span className="font-semibold">Kiểm tra quyền nhạy cảm tại Máy chủ (Server API)</span>
                <Badge className="bg-emerald-600 text-white border-0">Đã bật (HttpOnly Session)</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F6FA] dark:bg-gray-800">
                <span className="font-semibold">Chống cộng trùng điểm XP & Lịch ôn (Idempotent Event ID)</span>
                <Badge className="bg-emerald-600 text-white border-0">Đã kích hoạt</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#6545D8]" />
              Kiểm Soát Chất Lượng & Chi Phí AI
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              • Khu vực Tiếng Anh (8 chủ đề · 24 bài học nền tảng) sử dụng ngân hàng câu hỏi, đáp án và lời giải tiếng Việt đã được biên soạn và duyệt sẵn, không tốn phí gọi AI cho mỗi câu trắc nghiệm đóng.
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              • Kết quả tóm tắt, thuật ngữ và câu hỏi của từng tài liệu được lưu bền vững gắn với mã định danh tài liệu để mở lại ngay lập tức mà không cần sinh lại.
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              • Tổng lượt gọi AI phát sinh hôm nay: <strong className="text-[#6545D8]">{stats.totalAiCallsToday} lượt</strong>.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
