'use client';

import React, { useEffect } from 'react';
import { Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';

interface ZenFocusModeProps {
  isFocusMode: boolean;
  onToggle: () => void;
  language?: 'vi' | 'en';
}

export default function ZenFocusMode({
  isFocusMode,
  onToggle,
  language = 'vi',
}: ZenFocusModeProps) {
  // Bắt phím Escape để thoát Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        onToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, onToggle]);

  if (isFocusMode) {
    return (
      <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 text-xs font-black shadow-2xl backdrop-blur-md hover:scale-105 active:scale-95 transition-all border border-white/20 dark:border-slate-800"
          title="Nhấn để thoát chế độ tập trung (hoặc nhấn Esc)"
        >
          <Minimize2 className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
          <span>{language === 'vi' ? 'Thoát Chế Độ Tập Trung (Esc)' : 'Exit Focus (Esc)'}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="p-2 rounded-xl text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all flex items-center gap-1.5 text-xs font-bold"
      title={language === 'vi' ? 'Chế độ tập trung (Ẩn thanh công cụ xung quanh)' : 'Zen Focus Mode'}
    >
      <Maximize2 className="w-4 h-4" />
      <span className="hidden md:inline">{language === 'vi' ? 'Tập trung' : 'Focus'}</span>
    </button>
  );
}
