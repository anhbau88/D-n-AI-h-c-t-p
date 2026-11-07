// components/UpgradeModal.tsx
// Cửa sổ Nâng Cấp Gói Cước (Pro / VIP) & Mở Khóa Model AI Mạnh Hơn (Gemini 2.5 Pro Reasoning / Ultra Academic)
// Hỗ trợ: (1) Chọn Gói & Thời Hạn -> Tự động sinh Mã Code gửi qua Email & Hiển thị VietQR, (2) Nhập Mã Code Kích Hoạt Tức Thì

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';
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
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [bankInfo, setBankInfo] = useState({
    bankId: 'MB',
    accountNo: '0988888888',
    accountName: 'AI STUDY ASSISTANT',
  });

  useEffect(() => {
    if (isOpen) {
      setEmailInput(user.email || '');
      setErrorMessage('');
      fetch(`/api/billing?username=${encodeURIComponent(user.username)}`)
        .then(r => r.json())
        .then(data => {
          if (data.bankConfig) {
            setBankInfo({
              bankId: data.bankConfig.bankId || 'MB',
              accountNo: data.bankConfig.accountNo || '0988888888',
              accountName: data.bankConfig.accountName || 'AI STUDY ASSISTANT',
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, user.email, user.username]);

  if (!isOpen) return null;

  const currentAmount = PRICING_TABLE[selectedPlan][selectedDays] || 99000;
  const transferContent = `AISA ${user.username.toUpperCase()} ${selectedPlan.toUpperCase()}${selectedDays}D`;
  const vietQrUrl = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${currentAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

  // Đăng ký gói -> Tự động sinh Mã Code gửi về Email
  const handleRegisterAndSendCode = async () => {
    setErrorMessage('');
    setStatusMessage('');

    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ Email hợp lệ để nhận Mã Code kích hoạt gói.');
      return;
    }

    setIsGenerating(true);
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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi đăng ký gói.');
      }

      setGeneratedCode(data.licenseCode);
      setRedeemCodeInput(data.licenseCode);
      setStatusMessage(data.message);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Nhập Mã Code -> Kích hoạt gói trong thời hạn đăng ký
  const handleRedeemCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (!redeemCodeInput.trim()) {
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
          code: redeemCodeInput.trim(),
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
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/65 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-5xl bg-white dark:bg-gray-900 border border-indigo-200/60 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-400 text-gray-950 font-black text-[10px] px-2.5 py-0.5 border-0">
                AI MODEL UPGRADE
              </Badge>
              <span className="text-xs font-bold text-indigo-100">
                Gói hiện tại: <strong className="uppercase text-white">{user.plan || 'FREE'}</strong>
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black mt-1 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-300" />
              Nâng Cấp Gói Để Mở Khóa Model AI Mạnh Hơn & Trọn Bộ Công Cụ Pro
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
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* 1. Bảng so sánh 3 tầng Model AI & Gói cước */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gói FREE */}
            <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-gray-500">Gói Khởi Đầu</span>
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-xl font-black text-foreground">Free Standard</h3>
                <p className="text-xs text-gray-500 mt-1">Mặc định cho mọi tài khoản mới</p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                    <Check className="w-4 h-4 shrink-0" /> Model: Gemini 2.5 Flash (Tiêu chuẩn)
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> 12 lượt gọi AI / ngày
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Tóm tắt, Trắc nghiệm & Tự luận cơ bản
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
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xl shadow-indigo-500/10'
                  : 'border-gray-200 dark:border-gray-800 hover:border-indigo-400'
              }`}
            >
              <Badge className="absolute -top-2.5 right-4 bg-indigo-600 text-white border-0 text-[10px] font-black">
                ĐƯỢC CHỌN NHIỀU NHẤT
              </Badge>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">Cá Nhân Chuyên Sâu</span>
                  <Brain className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-black text-foreground">AI Pro Reasoning</h3>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {PRICING_TABLE.pro[selectedDays].toLocaleString('vi-VN')}đ <span className="text-xs font-semibold text-gray-500">/ {selectedDays} ngày</span>
                </p>
                <div className="mt-4 pt-4 border-t border-indigo-200/60 dark:border-indigo-800/60 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-black text-indigo-700 dark:text-indigo-300">
                    <Check className="w-4 h-4 shrink-0" /> Mở khóa Model: Gemini 2.5 Pro (Tư duy sâu)
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> 200 lượt gọi AI chất lượng cao / ngày
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Chấm bài tự luận viết tay qua ảnh OCR
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> AI Podcast Bài Giảng, Mindmap & Flashcards
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Xuất sổ điểm Excel & Giáo án 5512
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => setSelectedPlan('pro')}
                className={`w-full mt-5 rounded-xl h-9 text-xs font-bold ${
                  selectedPlan === 'pro' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-foreground'
                }`}
              >
                {selectedPlan === 'pro' ? '✓ Đang chọn gói Pro' : 'Chọn gói Pro'}
              </Button>
            </div>

            {/* Gói VIP CENTER */}
            <div
              onClick={() => setSelectedPlan('vip')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                selectedPlan === 'vip'
                  ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/25 shadow-xl shadow-amber-500/10'
                  : 'border-gray-200 dark:border-gray-800 hover:border-amber-400'
              }`}
            >
              <Badge className="absolute -top-2.5 right-4 bg-linear-to-r from-amber-500 to-purple-600 text-white border-0 text-[10px] font-black">
                MẠNH NHẤT CHO GV & TRUNG TÂM
              </Badge>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">Giáo Viên & Trung Tâm</span>
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-foreground">VIP Ultra Academic</h3>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                  {PRICING_TABLE.vip[selectedDays].toLocaleString('vi-VN')}đ <span className="text-xs font-semibold text-gray-500">/ {selectedDays} ngày</span>
                </p>
                <div className="mt-4 pt-4 border-t border-amber-200/60 dark:border-amber-800/60 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-black text-amber-700 dark:text-amber-300">
                    <Check className="w-4 h-4 shrink-0" /> Mở khóa Model: AI Ultra Academic (Khảo thí QG)
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Không giới hạn lượt gọi AI & Lớp học
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Ra đề thi Học sinh giỏi / Đánh giá năng lực
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Chẩn đoán lỗ hổng kiến thức toàn lớp bằng AI
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => setSelectedPlan('vip')}
                className={`w-full mt-5 rounded-xl h-9 text-xs font-bold ${
                  selectedPlan === 'vip' ? 'bg-linear-to-r from-amber-500 to-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-foreground'
                }`}
              >
                {selectedPlan === 'vip' ? '✓ Đang chọn gói VIP' : 'Chọn gói VIP'}
              </Button>
            </div>
          </div>

          {/* 2. Chọn Kỳ hạn Đăng ký (7 ngày / 30 ngày / 90 ngày / 365 ngày) */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
            <label className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5 mb-3">
              <Clock className="w-4 h-4 text-indigo-500" /> Bước 1: Chọn Thời Hạn Đăng Ký Gói ({selectedPlan.toUpperCase()})
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
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-300'
                    }`}
                  >
                    {opt.discountBadge && (
                      <span className="absolute -top-2 right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                        {opt.discountBadge}
                      </span>
                    )}
                    <p className="text-xs font-black text-foreground">{opt.label}</p>
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1">
                      {price.toLocaleString('vi-VN')}đ
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Hai Cột: (Trái) Đăng ký nhận Mã Code tự sinh qua Email & VietQR | (Phải) Nhập Mã Code Kích Hoạt */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Cột trái: Đăng ký Gói & Tự Sinh Mã Code Gửi Email */}
            <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/15 space-y-4">
              <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600" />
                Bước 2: Đăng Ký Gói & Nhận Mã Code Tự Động Qua Email
              </h4>

              <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vietQrUrl}
                  alt="VietQR Payment"
                  className="w-28 h-28 object-contain rounded-lg border border-gray-100 shrink-0"
                />
                <div className="text-xs space-y-1 flex-1">
                  <p className="font-black text-gray-800 dark:text-gray-100 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Quét VietQR hoặc Nhận Mã Trải Nghiệm:
                  </p>
                  <p className="text-gray-500">Ngân hàng: <strong className="text-foreground">{bankInfo.bankId}</strong> — STK: <strong className="text-foreground font-mono">{bankInfo.accountNo}</strong></p>
                  <p className="text-gray-500">Số tiền: <strong className="text-indigo-600 font-black">{currentAmount.toLocaleString('vi-VN')} VNĐ</strong> ({selectedDays} ngày)</p>
                  <p className="text-gray-500">Nội dung CK: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-bold text-indigo-600">{transferContent}</code></p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block">
                  Địa chỉ Email nhận Mã Code kích hoạt:
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Nhập email của bạn (VD: teacher@gmail.com)..."
                    className="h-10 text-xs rounded-xl bg-white dark:bg-gray-900"
                  />
                  <Button
                    type="button"
                    onClick={handleRegisterAndSendCode}
                    disabled={isGenerating}
                    className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 shadow-md shadow-indigo-500/20"
                  >
                    {isGenerating ? 'Đang sinh mã...' : 'Nhận Mã Code Ngay'}
                  </Button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Hệ thống sẽ tự động sinh 1 <strong>Mã Code định danh ({selectedDays} ngày)</strong> và gửi về Email của bạn để kích hoạt ở cột bên phải.
                </p>
              </div>

              {generatedCode && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Mã Code Tự Sinh Của Bạn ({selectedDays} ngày):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> {copiedCode ? 'Đã sao chép!' : 'Sao chép'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-emerald-200 text-center font-mono text-sm font-black tracking-widest text-indigo-700 dark:text-indigo-300">
                    {generatedCode}
                  </div>
                </div>
              )}
            </div>

            {/* Cột phải: Nhập Mã Code Kích Hoạt Tức Thì */}
            <div className="p-5 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/15 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-600" />
                  Bước 3: Nhập Mã Code Để Mở Khóa Gói & Model AI
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Nhập mã Code bạn vừa nhận qua Email (hoặc mã do Quản trị viên cấp) vào ô bên dưới. Hệ thống sẽ kích hoạt gói tương ứng và tự động cộng đúng số ngày đăng ký vào tài khoản của bạn!
                </p>

                <form onSubmit={handleRedeemCode} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                      Mã Code Kích Hoạt (License Key):
                    </label>
                    <Input
                      type="text"
                      value={redeemCodeInput}
                      onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                      placeholder="VD: AISA-PRO-30D-8K4M-F92A"
                      className="h-11 text-sm font-mono font-black tracking-wider uppercase text-center rounded-xl bg-white dark:bg-gray-900 border-purple-300 dark:border-purple-700"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isRedeeming}
                    className="w-full h-11 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-purple-500/25"
                  >
                    {isRedeeming ? 'Đang kiểm tra & kích hoạt...' : '🚀 Kích Hoạt Gói & Mở Khóa Model AI Ngay'}
                  </Button>
                </form>

                {statusMessage && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200">
                    ✅ {statusMessage}
                  </p>
                )}
                {errorMessage && (
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/30 p-3 rounded-xl border border-red-200">
                    ⚠️ {errorMessage}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 space-y-1">
                <p className="font-bold text-foreground">🔒 Cơ chế Bảo hành & Quản lý Thời hạn tự động:</p>
                <p>• Nếu tài khoản của bạn đang còn ngày sử dụng, khi nhập mã Code mới hệ thống sẽ <strong>cộng dồn thêm số ngày</strong>.</p>
                <p>• Mở khóa tức thì <strong>Gemini 2.5 Pro Reasoning</strong> và <strong>Ultra Academic</strong> trên toàn bộ công cụ.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
