// components/UpgradeModal.tsx
// Cửa sổ Nâng Cấp Gói Cước (Pro / VIP) & Mở Khóa Model AI Mạnh Hơn
// Quy trình chuẩn: (1) Chọn Gói & Thời Hạn -> Quét VietQR & Gửi Yêu Cầu Xác Nhận Chuyển Khoản (Chờ Admin duyệt tiền về mới gửi Mã Code), (2) Nhập Mã Code Kích Hoạt

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, SubscriptionOrder } from '@/types';
import {
  X,
  Zap,
  Brain,
  Crown,
  Check,
  KeyRound,
  Mail,
  QrCode,
  Sparkles,
  Copy,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpgradeSuccess: (updatedUser: User, message: string) => void;
  initialHighlightReason?: string;
}

const DURATION_OPTIONS = [
  { days: 7, label: '7 Ngày (Trải nghiệm)', discountBadge: '' },
  { days: 30, label: '30 Ngày (1 Tháng)', discountBadge: 'Phổ biến' },
  { days: 90, label: '90 Ngày (3 Tháng)', discountBadge: '-15%' },
  { days: 365, label: '365 Ngày (1 Năm)', discountBadge: 'Tiết kiệm 35%' },
];

const PRICING_TABLE: Record<'pro' | 'vip', Record<number, number>> = {
  pro: { 7: 29000, 30: 99000, 90: 249000, 365: 799000 },
  vip: { 7: 79000, 30: 299000, 90: 749000, 365: 2390000 },
};

export default function UpgradeModal({
  isOpen,
  onClose,
  user,
  onUpgradeSuccess,
  initialHighlightReason,
}: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'vip'>('pro');
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [emailInput, setEmailInput] = useState<string>(user.email || '');
  const [redeemCodeInput, setRedeemCodeInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<SubscriptionOrder[]>([]);

  // Mã giảm giá (Coupon / Voucher)
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountVnd, setDiscountVnd] = useState(0);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');

  const [bankInfo, setBankInfo] = useState({
    bankId: 'MB',
    accountNo: '0988888888',
    accountName: 'AI STUDY ASSISTANT',
  });

  const fetchBillingInfo = useCallback(async () => {
    setIsRefreshingOrders(true);
    try {
      const r = await fetch(`/api/billing?username=${encodeURIComponent(user.username)}`);
      const data = await r.json();
      if (data.bankConfig) {
        setBankInfo({
          bankId: data.bankConfig.bankId || 'MB',
          accountNo: data.bankConfig.accountNo || '0988888888',
          accountName: data.bankConfig.accountName || 'AI STUDY ASSISTANT',
        });
      }
      if (Array.isArray(data.myOrders)) {
        const sorted = [...data.myOrders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMyOrders(sorted);
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshingOrders(false);
    }
  }, [user.username]);

  useEffect(() => {
    if (isOpen) {
      setEmailInput(user.email || '');
      setErrorMessage('');
      setStatusMessage('');
      fetchBillingInfo();
    }
  }, [isOpen, user.email, fetchBillingInfo]);

  if (!isOpen) return null;

  const rawAmount = PRICING_TABLE[selectedPlan][selectedDays] || 99000;
  const currentAmount = Math.max(10000, rawAmount - discountVnd);
  const transferContent = `AISA ${user.username.toUpperCase()} ${selectedPlan.toUpperCase()}${selectedDays}D`;
  const vietQrUrl = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${currentAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

  const handleApplyCoupon = async () => {
    setCouponMessage('');
    if (!couponInput.trim()) return;
    setIsCheckingCoupon(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_coupon',
          code: couponInput.trim(),
          amountVnd: rawAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mã giảm giá không hợp lệ.');
      setDiscountVnd(data.discountVnd || 0);
      setAppliedCoupon(data.code);
      setCouponMessage(data.message || 'Áp dụng mã thành công!');
    } catch (err) {
      setDiscountVnd(0);
      setAppliedCoupon(null);
      setCouponMessage(err instanceof Error ? err.message : 'Lỗi kiểm tra mã.');
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  // Gửi yêu cầu đăng ký gói (Tạo đơn chờ Quản trị viên xác nhận đã nhận tiền)
  const handleSubmitPaymentOrder = async () => {
    setErrorMessage('');
    setStatusMessage('');

    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ Email hợp lệ để nhận Mã Code kích hoạt gói sau khi Admin duyệt.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_plan',
          username: user.username,
          plan: selectedPlan,
          durationDays: selectedDays,
          email: emailInput.trim(),
          couponCode: appliedCoupon || undefined,
          amountVnd: currentAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi gửi yêu cầu đăng ký gói.');
      }

      setStatusMessage(data.message);
      await fetchBillingInfo();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Nhập Mã Code -> Kích hoạt gói trong thời hạn đăng ký
  const handleRedeemCode = async (e?: React.FormEvent, codeOverride?: string) => {
    e?.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    const targetCode = (codeOverride || redeemCodeInput).trim();
    if (!targetCode) {
      setErrorMessage('Vui lòng nhập Mã Code kích hoạt gói (VD: AISA-PRO-30D-XXXX-XXXX).');
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem_code',
          username: user.username,
          code: targetCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Mã kích hoạt không hợp lệ.');
      }

      onUpgradeSuccess(data.user, data.message);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi kích hoạt mã.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-5xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#6545D8] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-400 text-gray-950 font-black text-[10px] px-2.5 py-0.5 border-0">
                GÓI DỊCH VỤ & MÃ KÍCH HOẠT
              </Badge>
              <span className="text-xs font-bold text-indigo-100">
                Gói hiện tại: <strong className="uppercase text-white">{user.plan || 'FREE'}</strong>
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black mt-1 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-300" />
              Nâng Cấp Gói Dịch Vụ & Mở Khóa Công Cụ Học Tập Chuyên Sâu
            </h2>
            {initialHighlightReason && (
              <p className="text-xs text-amber-200 font-semibold mt-1">
                💡 {initialHighlightReason}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* 1. Bảng so sánh 3 gói cước */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gói FREE */}
            <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-gray-500">Gói Khởi Đầu</span>
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-xl font-black text-foreground">Miễn Phí (Free)</h3>
                <p className="text-xs text-gray-500 mt-1">Mặc định cho mọi tài khoản</p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                    <Check className="w-4 h-4 shrink-0" /> 12 lượt hỗ trợ AI / ngày
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Đọc hiểu tài liệu, Trắc nghiệm & Tự luận cơ bản
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Lộ trình Tiếng Anh nền tảng & Lịch ôn
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-200/60 dark:border-gray-800 text-center">
                <span className="text-xs font-bold text-gray-400">Đang kích hoạt sẵn</span>
              </div>
            </div>

            {/* Gói PRO */}
            <div
              onClick={() => setSelectedPlan('pro')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                selectedPlan === 'pro'
                  ? 'border-[#6545D8] bg-[#F3F0FF]/60 dark:bg-indigo-950/30 shadow-md'
                  : 'border-gray-200 dark:border-gray-800 hover:border-indigo-400'
              }`}
            >
              <Badge className="absolute -top-2.5 right-4 bg-[#6545D8] text-white border-0 text-[10px] font-black">
                PHỔ BIẾN NHẤT
              </Badge>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-[#6545D8] dark:text-indigo-400">Học Sinh Chuyên Sâu</span>
                  <Brain className="w-5 h-5 text-[#6545D8]" />
                </div>
                <h3 className="text-xl font-black text-foreground">Gói Pro</h3>
                <p className="text-lg font-black text-[#6545D8] dark:text-indigo-400 mt-1">
                  {PRICING_TABLE.pro[selectedDays].toLocaleString('vi-VN')}đ <span className="text-xs font-semibold text-gray-500">/ {selectedDays} ngày</span>
                </p>
                <div className="mt-4 pt-4 border-t border-indigo-200/60 dark:border-indigo-800/60 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-black text-indigo-700 dark:text-indigo-300">
                    <Check className="w-4 h-4 shrink-0" /> 200 lượt AI suy luận sâu / ngày
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Chấm bài tự luận viết tay qua ảnh OCR
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Sơ đồ tư duy Mindmap, Podcast & Flashcard
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Sổ lỗi thông minh & Kế hoạch ôn theo ngày thi
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => setSelectedPlan('pro')}
                className={`w-full mt-5 rounded-xl h-11 text-xs font-bold ${
                  selectedPlan === 'pro' ? 'bg-[#6545D8] text-white' : 'bg-gray-200 dark:bg-gray-800 text-foreground'
                }`}
              >
                {selectedPlan === 'pro' ? '✓ Đang chọn gói Pro' : 'Chọn gói Pro'}
              </Button>
            </div>

            {/* Gói VIP */}
            <div
              onClick={() => setSelectedPlan('vip')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                selectedPlan === 'vip'
                  ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/25 shadow-md'
                  : 'border-gray-200 dark:border-gray-800 hover:border-amber-400'
              }`}
            >
              <Badge className="absolute -top-2.5 right-4 bg-amber-500 text-white border-0 text-[10px] font-black">
                GIÁO VIÊN & TRUNG TÂM
              </Badge>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">Không Giới Hạn</span>
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-foreground">Gói VIP Ultra</h3>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                  {PRICING_TABLE.vip[selectedDays].toLocaleString('vi-VN')}đ <span className="text-xs font-semibold text-gray-500">/ {selectedDays} ngày</span>
                </p>
                <div className="mt-4 pt-4 border-t border-amber-200/60 dark:border-amber-800/60 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-black text-amber-700 dark:text-amber-300">
                    <Check className="w-4 h-4 shrink-0" /> Không giới hạn lượt gọi AI & Lớp học
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Soạn Giáo án 5512 & Đề thi Học sinh giỏi
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Chẩn đoán lỗ hổng kiến thức toàn lớp
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Xuất sổ điểm Excel & Báo cáo chuyên sâu
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => setSelectedPlan('vip')}
                className={`w-full mt-5 rounded-xl h-11 text-xs font-bold ${
                  selectedPlan === 'vip' ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-foreground'
                }`}
              >
                {selectedPlan === 'vip' ? '✓ Đang chọn gói VIP' : 'Chọn gói VIP'}
              </Button>
            </div>
          </div>

          {/* 2. Chọn Kỳ hạn Đăng ký */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
            <label className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5 mb-3">
              <Clock className="w-4 h-4 text-[#6545D8]" /> Bước 1: Chọn Thời Hạn Đăng Ký ({selectedPlan.toUpperCase()})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = selectedDays === opt.days;
                const price = PRICING_TABLE[selectedPlan][opt.days];
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setSelectedDays(opt.days)}
                    className={`p-3 rounded-xl border text-left transition-all relative min-h-14 ${
                      isSelected
                        ? 'border-[#6545D8] bg-[#F3F0FF] dark:bg-indigo-950/50 ring-2 ring-[#6545D8]/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-300'
                    }`}
                  >
                    {opt.discountBadge && (
                      <span className="absolute -top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                        {opt.discountBadge}
                      </span>
                    )}
                    <p className="text-xs font-black text-foreground">{opt.label}</p>
                    <p className="text-sm font-black text-[#6545D8] dark:text-indigo-400 mt-1">
                      {price.toLocaleString('vi-VN')}đ
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Hai Cột: (Trái) Quét VietQR & Gửi Yêu Cầu Xác Nhận Chuyển Khoản | (Phải) Đơn Chờ Duyệt & Nhập Mã Code Kích Hoạt */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Cột trái: Thanh toán VietQR & Gửi yêu cầu cho Admin duyệt */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-indigo-900/60 bg-[#F5F6FA] dark:bg-indigo-950/15 space-y-4">
              <h4 className="text-sm font-black text-[#172033] dark:text-indigo-200 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#6545D8]" />
                Bước 2: Chuyển Khoản VietQR & Gửi Yêu Cầu Xác Nhận
              </h4>

              <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vietQrUrl}
                  alt="VietQR Payment"
                  className="w-32 h-32 object-contain rounded-lg border border-gray-100 shrink-0"
                />
                <div className="text-xs space-y-1.5 flex-1">
                  <p className="font-black text-gray-800 dark:text-gray-100">
                    Thông tin chuyển khoản ngân hàng:
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Ngân hàng: <strong className="text-foreground">{bankInfo.bankId}</strong> — STK: <strong className="text-foreground font-mono">{bankInfo.accountNo}</strong>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Chủ TK: <strong className="text-foreground">{bankInfo.accountName}</strong>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Số tiền: <strong className="text-[#6545D8] font-black text-sm">{currentAmount.toLocaleString('vi-VN')} VNĐ</strong> ({selectedDays} ngày)
                    {discountVnd > 0 && <span className="ml-1.5 text-[11px] line-through text-gray-400">({rawAmount.toLocaleString('vi-VN')}đ)</span>}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Nội dung CK: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-bold text-[#6545D8]">{transferContent}</code>
                  </p>
                </div>
              </div>

              {/* Ô Nhập Mã Giảm Giá */}
              <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-indigo-800 space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Mã ưu đãi nếu có (VD: CHAOHOC2026)..."
                    className="h-10 text-xs rounded-lg uppercase font-mono font-bold"
                  />
                  <Button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isCheckingCoupon}
                    variant="outline"
                    className="h-10 px-4 rounded-lg text-xs font-bold border-[#6545D8] text-[#6545D8] shrink-0"
                  >
                    {isCheckingCoupon ? '...' : 'Áp dụng'}
                  </Button>
                </div>
                {couponMessage && (
                  <p className={`text-[11px] font-bold ${appliedCoupon ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {appliedCoupon ? '🏷️ ' : '⚠️ '}{couponMessage}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#6545D8]" />
                  Email nhận Mã Code (sau khi Quản trị viên xác nhận tiền về):
                </label>
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Nhập email của bạn (VD: hocsinh@gmail.com)..."
                  className="h-11 text-xs rounded-xl bg-white dark:bg-gray-900"
                />
                <Button
                  type="button"
                  onClick={handleSubmitPaymentOrder}
                  disabled={isSubmittingOrder}
                  className="w-full h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white text-xs font-black shadow-sm"
                >
                  {isSubmittingOrder ? 'Đang gửi yêu cầu xác nhận...' : '✅ Tôi Đã Chuyển Khoản — Gửi Yêu Cầu Xác Nhận'}
                </Button>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                  <strong>Quy trình bảo mật:</strong> Sau khi bạn bấm gửi yêu cầu, đơn đăng ký sẽ chuyển tới <strong>Quản trị viên</strong>. Chỉ khi Quản trị viên <strong>xác nhận đã nhận được tiền</strong>, hệ thống mới phát hành và gửi Mã Code kích hoạt về Email & hiển thị ở cột bên phải.
                </div>
              </div>
            </div>

            {/* Cột phải: Trạng thái đơn chờ duyệt & Nhập Mã Code Kích Hoạt */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-purple-900/60 bg-white dark:bg-purple-950/15 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-[#172033] dark:text-purple-200 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#6545D8]" />
                  Bước 3: Theo Dõi Duyệt Đơn & Nhập Mã Kích Hoạt
                </h4>

                {/* Danh sách đơn đăng ký gói của người dùng */}
                <div className="p-3.5 rounded-xl bg-[#F5F6FA] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#6545D8]" />
                      Đơn đăng ký gói của bạn ({myOrders.length})
                    </span>
                    <button
                      type="button"
                      onClick={fetchBillingInfo}
                      disabled={isRefreshingOrders}
                      className="text-xs font-bold text-[#6545D8] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                      Kiểm tra duyệt
                    </button>
                  </div>

                  {myOrders.length === 0 ? (
                    <p className="text-xs text-gray-500 py-2">
                      Bạn chưa có đơn đăng ký nào. Hãy chọn gói và gửi yêu cầu ở Bước 2, hoặc nhập trực tiếp Mã Code bên dưới nếu đã có.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {myOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-foreground">
                              #{ord.id} • Gói {ord.plan.toUpperCase()} ({ord.durationDays} ngày)
                            </span>
                            <span className="font-bold text-gray-600 dark:text-gray-300">
                              {(ord.amountVnd || 0).toLocaleString('vi-VN')}đ
                            </span>
                          </div>

                          {ord.status === 'pending' && (
                            <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Chờ Quản trị viên xác nhận đã nhận tiền
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {new Date(ord.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}

                          {ord.status === 'code_sent' && ord.licenseCode && (
                            <div className="pt-1.5 border-t border-emerald-100 dark:border-emerald-900/50 space-y-1.5">
                              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Admin đã xác nhận tiền & gửi mã:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(ord.licenseCode);
                                    setCopiedCode(ord.licenseCode);
                                    setTimeout(() => setCopiedCode(null), 2000);
                                  }}
                                  className="text-[11px] text-[#6545D8] hover:underline flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  {copiedCode === ord.licenseCode ? 'Đã chép' : 'Sao chép'}
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 font-mono font-black text-center text-[#6545D8] dark:text-emerald-300">
                                  {ord.licenseCode}
                                </code>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    setRedeemCodeInput(ord.licenseCode);
                                    handleRedeemCode(undefined, ord.licenseCode);
                                  }}
                                  className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                  Kích hoạt ngay
                                </Button>
                              </div>
                            </div>
                          )}

                          {ord.status === 'cancelled' && (
                            <p className="text-red-600 font-bold pt-1 border-t border-gray-100 dark:border-gray-700">
                              ❌ Đơn đã bị từ chối (Chưa nhận được thanh toán).
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form nhập mã kích hoạt */}
                <form onSubmit={(e) => handleRedeemCode(e)} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Nhập Mã Code Kích Hoạt (License Key):
                    </label>
                    <Input
                      type="text"
                      value={redeemCodeInput}
                      onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                      placeholder="VD: AISA-PRO-30D-8K4M-F92A"
                      className="h-11 text-sm font-mono font-black tracking-wider uppercase text-center rounded-xl bg-white dark:bg-gray-900 border-gray-300 dark:border-purple-700"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isRedeeming}
                    className="w-full h-11 rounded-xl bg-[#6545D8] hover:bg-[#5435C2] text-white font-black text-xs shadow-sm"
                  >
                    {isRedeeming ? 'Đang kiểm tra & kích hoạt...' : 'Kích Hoạt Gói Bằng Mã Code'}
                  </Button>
                </form>

                {statusMessage && (
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200">
                    ✅ {statusMessage}
                  </p>
                )}
                {errorMessage && (
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200">
                    ⚠️ {errorMessage}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F6FA] dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                <p className="font-bold text-foreground">🔒 Cơ chế Quản lý Thời hạn & Hỗ trợ:</p>
                <p>• Nếu tài khoản còn hạn sử dụng, khi nhập mã mới hệ thống sẽ <strong>cộng dồn thêm số ngày</strong>.</p>
                <p>• Cần hỗ trợ duyệt đơn nhanh qua Zalo/Hotline: <a href="https://zalo.me/0923678668" target="_blank" rel="noreferrer" className="underline font-black text-[#6545D8]">0923678668</a></p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
