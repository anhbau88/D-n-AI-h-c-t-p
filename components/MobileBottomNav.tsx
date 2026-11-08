'use client';

import React from 'react';
import { 
  TrendingUp, 
  Library, 
  Plus, 
  MessageSquare, 
  User, 
  FileText,
  Crown
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeDoc: boolean;
  onOpenDocWorkspace?: () => void;
  onOpenUpgrade?: () => void;
  userPlan?: string;
  language?: 'vi' | 'en';
}

export default function MobileBottomNav({
  currentTab,
  onSelectTab,
  activeDoc,
  onOpenDocWorkspace,
  onOpenUpgrade,
  userPlan = 'free',
  language = 'vi',
}: MobileBottomNavProps) {
  const isVip = userPlan === 'vip' || userPlan === 'pro';

  return (
    <nav 
      aria-label="Thanh điều hướng di động"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b0c10]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-white/10 mobile-nav-shadow safe-area-bottom transition-all duration-300"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-lg mx-auto">
        
        {/* Tab 1: Tổng quan (Dashboard) */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
            currentTab === 'dashboard' && !activeDoc
              ? 'text-primary dark:text-indigo-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold'
          }`}
        >
          <div className="relative">
            <TrendingUp className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'dashboard' && !activeDoc ? 'scale-110' : ''}`} />
            {currentTab === 'dashboard' && !activeDoc && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary dark:bg-indigo-400 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {language === 'vi' ? 'Tổng quan' : 'Home'}
          </span>
        </button>

        {/* Tab 2: Tủ sách tài liệu (Library) */}
        <button
          type="button"
          onClick={() => onSelectTab('library')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
            currentTab === 'library' && !activeDoc
              ? 'text-primary dark:text-indigo-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold'
          }`}
        >
          <div className="relative">
            <Library className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'library' && !activeDoc ? 'scale-110' : ''}`} />
            {currentTab === 'library' && !activeDoc && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary dark:bg-indigo-400 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {language === 'vi' ? 'Tủ sách' : 'Library'}
          </span>
        </button>

        {/* Tab 3 (Center Action Button): Tải tài liệu / Bài học mới */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-4">
          <button
            type="button"
            onClick={() => onSelectTab('upload')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white dark:border-slate-900"
            title={language === 'vi' ? 'Tải lên hoặc dán bài học mới' : 'New study material'}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-bold text-primary dark:text-indigo-300 mt-1">
            {language === 'vi' ? 'Tạo mới' : 'New'}
          </span>
        </div>

        {/* Tab 4: Chat AI hoặc Bài đang mở */}
        {activeDoc && onOpenDocWorkspace ? (
          <button
            type="button"
            onClick={onOpenDocWorkspace}
            className="flex-1 flex flex-col items-center justify-center py-1 text-primary dark:text-indigo-400 font-black transition-all active:scale-90"
            title="Quay lại bài học đang mở"
          >
            <div className="relative">
              <FileText className="w-5 h-5 scale-110 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[10px] mt-1 tracking-tight text-emerald-600 dark:text-emerald-400 font-black">
              {language === 'vi' ? 'Đang học' : 'Active'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelectTab('chat')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
              currentTab === 'chat'
                ? 'text-primary dark:text-indigo-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold'
            }`}
          >
            <div className="relative">
              <MessageSquare className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'chat' ? 'scale-110' : ''}`} />
              {currentTab === 'chat' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary dark:bg-indigo-400 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">
              {language === 'vi' ? 'Trợ lý AI' : 'AI Tutor'}
            </span>
          </button>
        )}

        {/* Tab 5: Cá nhân / Cài đặt / Gói cước */}
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
            currentTab === 'settings' && !activeDoc
              ? 'text-primary dark:text-indigo-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold'
          }`}
        >
          <div className="relative">
            {isVip ? (
              <Crown className="w-5 h-5 text-amber-500" />
            ) : (
              <User className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'settings' && !activeDoc ? 'scale-110' : ''}`} />
            )}
            {currentTab === 'settings' && !activeDoc && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary dark:bg-indigo-400 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {language === 'vi' ? 'Cá nhân' : 'Profile'}
          </span>
        </button>

      </div>
    </nav>
  );
}
