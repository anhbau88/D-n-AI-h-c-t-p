// components/ZaloSupportWidget.tsx
// Nút bấm hỗ trợ khách hàng nhanh qua Zalo / Hotline 24/7
// Trên Desktop: Nút nổi góc dưới màn hình
// Trên Mobile: Tích hợp vào Tab Cá nhân, Sidebar và Menu Hồ sơ (không làm che chắn bài học)

'use client';

import React from 'react';
import { Headphones, ExternalLink, ShieldCheck } from 'lucide-react';

interface ZaloSupportWidgetProps {
  phone?: string;
}

// 1. Widget nổi dành riêng cho màn hình Desktop (Màn hình rộng, không bị vướng)
export default function ZaloSupportWidget({ phone = '0923678668' }: ZaloSupportWidgetProps) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  return (
    <div className="hidden lg:flex fixed bottom-6 right-6 z-40 flex-col items-end gap-2 group">
      {/* Tooltip chào hỏi */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-xl opacity-90 group-hover:opacity-100 transition-all">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Hỗ trợ kỹ thuật & Gói cước: <span className="text-indigo-600 dark:text-indigo-400 font-black">{phone}</span>
      </div>

      {/* Nút bấm Zalo / Gọi */}
      <a
        href={`https://zalo.me/${cleanPhone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xs shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
        title="Chat Zalo Hỗ Trợ 24/7"
      >
        <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center font-black text-[11px] shrink-0">
          Z
        </div>
        <span className="tracking-wide">Chat Zalo CSKH</span>
      </a>
    </div>
  );
}

// 2. Thẻ CSKH chuyên nghiệp dành cho Tab Cá nhân & Sidebar (Hoàn hảo cho Mobile)
export function ZaloSupportCard({ phone = '0923678668' }: { phone?: string }) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              Hỗ Trợ Khách Hàng 24/7
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Giải đáp kỹ thuật, lỗi nạp thẻ & kích hoạt gói
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-indigo-100 dark:border-indigo-900/40 text-xs">
        <div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Hotline / Zalo:</span>
          <p className="font-black text-primary dark:text-indigo-400 text-sm">{phone}</p>
        </div>

        <a
          href={`https://zalo.me/${cleanPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition-all"
        >
          <div className="w-4 h-4 rounded-full bg-white text-blue-600 flex items-center justify-center font-black text-[9px]">
            Z
          </div>
          <span>Chat Zalo</span>
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </a>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Cam kết phản hồi trong vòng 5 phút • Hoàn tiền 100% trong 3 ngày</span>
      </div>
    </div>
  );
}
