// components/ZaloSupportWidget.tsx
// Nút bấm nổi hỗ trợ khách hàng nhanh qua Zalo / Hotline 24/7

'use client';

import React from 'react';

interface ZaloSupportWidgetProps {
  phone?: string;
}

export default function ZaloSupportWidget({ phone = '0923678668' }: ZaloSupportWidgetProps) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 group">
      {/* Tooltip chào hỏi */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-xl opacity-90 group-hover:opacity-100 transition-all">
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
