'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Kiểm tra xem đã dismiss trước đó chưa (trong vòng 7 ngày)
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Kiểm tra nếu đang chạy ở chế độ standalone (đã cài đặt) thì không hiện
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      // @ts-expect-error iOS navigator property
      window.navigator.standalone === true;
    if (isStandalone) {
      return;
    }

    // Phát hiện thiết bị iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Trên iOS hiện gợi ý sau 3 giây
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Trên Android / Chrome / Edge bắt sự kiện beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } catch {
      // Ignored
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed top-18 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="p-3.5 bg-white/95 dark:bg-[#12141e]/95 backdrop-blur-xl border border-indigo-200 dark:border-indigo-900/60 rounded-2xl shadow-xl shadow-indigo-500/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0 border border-slate-200 dark:border-slate-800 bg-white p-0.5">
            <Image src="/logo.png" alt="AI Study" width={40} height={40} className="w-full h-full object-contain" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Cài Đặt Ứng Dụng Học Tập</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[9px] font-black">
                FREE APP
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Mở toàn màn hình, học mượt & không quảng cáo.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-black shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cài đặt</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hướng dẫn cài trên iOS Safari */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12141e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <span>Cài Đặt Trên iPhone / iPad</span>
              </h3>
              <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  1
                </div>
                <p className="leading-relaxed">
                  Nhấn vào biểu tượng <strong>Chia sẻ (Share)</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-primary" /> ở thanh dưới cùng Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  2
                </div>
                <p className="leading-relaxed">
                  Cuộn xuống và chọn <strong>&quot;Thêm vào MH chính&quot;</strong> (Add to Home Screen) <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-primary" />.
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  3
                </div>
                <p className="leading-relaxed">
                  Nhấn nút <strong>Thêm (Add)</strong> ở góc trên bên phải để hoàn tất!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:brightness-110 active:scale-95 transition-all"
            >
              Đã hiểu, quay lại học tập
            </button>
          </div>
        </div>
      )}
    </>
  );
}
