'use client';

import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Award, 
  Sparkles, 
  Check, 
  Copy,
  Flame,
  Star
} from 'lucide-react';
import Image from 'next/image';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  score?: string; // e.g. "10/10" or "9.5/10"
  streak?: number;
  testTitle?: string;
  language?: 'vi' | 'en';
}

export default function SocialShareModal({
  isOpen,
  onClose,
  username,
  score = '10/10',
  streak = 7,
  testTitle = 'Bài Thi Đánh Giá Năng Lực AI',
  language = 'vi',
}: SocialShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ai-study-assistant-orcin.vercel.app';
  const shareText = `🎉 Mình vừa đạt điểm ${score} trong bài kiểm tra "${testTitle}" trên EduGenie AI! Nền tảng học tập AI thông minh đỉnh cao: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignored
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      // Render canvas dynamically using html2canvas or native Canvas drawing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1080;
      canvas.height = 1350; // Standard Instagram/Facebook Story ratio 4:5

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#31104b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1350);

      // Gold Border Frame
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, 1000, 1270);

      // Inner subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 55, 970, 1240);

      // App Title
      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EDUGENIE AI • CHỨNG NHẬN THÀNH TÍCH', 540, 140);

      // Badge Icon Circle
      ctx.beginPath();
      ctx.arc(540, 260, 70, 0, 2 * Math.PI);
      ctx.fillStyle = '#4f46e5';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Trophy symbol
      ctx.fillStyle = '#fbbf24';
      ctx.font = '70px sans-serif';
      ctx.fillText('🏆', 540, 285);

      // Congratulation Text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 52px sans-serif';
      ctx.fillText('XUẤT SẮC HOÀN THÀNH', 540, 400);

      // User Name
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'black 64px sans-serif';
      ctx.fillText(username.toUpperCase(), 540, 490);

      // Score Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.roundRect(240, 560, 600, 220, 24);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('ĐIỂM SỐ ĐẠT ĐƯỢC', 540, 620);

      ctx.fillStyle = '#4ade80';
      ctx.font = 'black 100px sans-serif';
      ctx.fillText(score, 540, 730);

      // Test Title
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'medium 34px sans-serif';
      const cleanTestTitle = testTitle.length > 40 ? testTitle.substring(0, 37) + '...' : testTitle;
      ctx.fillText(`Bài thi: "${cleanTestTitle}"`, 540, 840);

      // Streak & XP pill
      ctx.fillStyle = '#fb923c';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`🔥 Chuỗi ngày học liên tiếp: ${streak} ngày Streak`, 540, 920);

      // Footer call to action
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.roundRect(140, 1020, 800, 180, 20);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('Học thông minh gấp 10 lần cùng AI', 540, 1080);

      ctx.fillStyle = '#a5b4fc';
      ctx.font = '30px sans-serif';
      ctx.fillText('Truy cập ngay: trolyhoctap.id.vn', 540, 1140);

      // Download triggered
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Chung_nhan_${username}_${score.replace('/', '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Ignored
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#12141e] border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KHOE THÀNH TÍCH VẺ VANG</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Chia Sẻ Thành Tích Học Tập
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tải thẻ chứng nhận hoặc sao chép link chia sẻ lên Facebook/Zalo Story!
          </p>
        </div>

        {/* Certificate Card Preview */}
        <div
          ref={cardRef}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white border-2 border-amber-400/80 shadow-xl relative overflow-hidden space-y-3.5 text-center"
        >
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-indigo-300">
            <span>EduGenie AI</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>Chứng nhận</span>
            </span>
          </div>

          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-white">
            <Award className="w-8 h-8 text-white" />
          </div>

          <div>
            <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Học viên xuất sắc</p>
            <h4 className="text-xl font-black text-amber-300 tracking-tight">{username}</h4>
          </div>

          <div className="py-2 px-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 inline-block">
            <span className="text-xs text-slate-300 mr-2 font-semibold">Điểm số:</span>
            <span className="text-2xl font-black text-emerald-400">{score}</span>
          </div>

          <p className="text-xs text-slate-300 font-medium truncate px-2">
            &quot;{testTitle}&quot;
          </p>

          <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-orange-400 pt-1 border-t border-white/10">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-orange-500" />
              {streak} ngày Streak
            </span>
            <span>•</span>
            <span className="text-slate-300">trolyhoctap.id.vn</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleDownloadCard}
            disabled={isExporting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Đang xuất ảnh độ nét cao...' : 'Tải Thẻ Ảnh Story HD (1080x1350)'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Đã sao chép nội dung & link khoe!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép nội dung khoe lên Zalo / Facebook</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
