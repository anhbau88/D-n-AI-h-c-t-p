'use client';

import React from 'react';
import {
  CalendarCheck,
  FileText,
  Brain,
  Languages,
  TrendingUp,
  Users,
  BookOpen,
  UploadCloud,
  Award,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeDoc: boolean;
  onOpenDocWorkspace?: () => void;
  onOpenUpgrade?: () => void;
  userPlan?: string;
  language?: 'vi' | 'en';
  isTeachingMode?: boolean;
  hidden?: boolean;
}

export default function MobileBottomNav({
  currentTab,
  onSelectTab,
  activeDoc,
  language = 'vi',
  isTeachingMode = false,
  hidden = false,
}: MobileBottomNavProps) {
  if (hidden) return null;

  const studentTabs = [
    {
      id: 'dashboard',
      label: language === 'vi' ? 'Hôm nay' : 'Today',
      icon: CalendarCheck,
    },
    {
      id: 'library',
      label: language === 'vi' ? 'Tài liệu' : 'Docs',
      icon: FileText,
    },
    {
      id: 'practice',
      label: language === 'vi' ? 'Luyện tập' : 'Practice',
      icon: Brain,
    },
    {
      id: 'english',
      label: language === 'vi' ? 'Tiếng Anh' : 'English',
      icon: Languages,
    },
    {
      id: 'progress',
      label: language === 'vi' ? 'Tiến độ' : 'Progress',
      icon: TrendingUp,
    },
  ];

  const teacherTabs = [
    {
      id: 'dashboard',
      label: language === 'vi' ? 'Tổng quan' : 'Overview',
      icon: TrendingUp,
    },
    {
      id: 'class-management',
      label: language === 'vi' ? 'Lớp học' : 'Classes',
      icon: Users,
    },
    {
      id: 'library',
      label: language === 'vi' ? 'Học liệu' : 'Materials',
      icon: BookOpen,
    },
    {
      id: 'upload',
      label: language === 'vi' ? 'Soạn bài' : 'Authoring',
      icon: UploadCloud,
    },
    {
      id: 'progress',
      label: language === 'vi' ? 'Kết quả' : 'Results',
      icon: Award,
    },
  ];

  const items = isTeachingMode ? teacherTabs : studentTabs;

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b0c10]/95 backdrop-blur-xl border-t border-[#E4E7F0] dark:border-white/10 safe-area-bottom transition-all duration-200"
    >
      <div className="grid grid-cols-5 items-center px-1.5 py-1 h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeDoc && item.id === 'library'
              ? true
              : !activeDoc && currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center rounded-xl py-1 px-1 transition-all active:scale-95 ${
                isActive
                  ? 'bg-[#EFEAFC] dark:bg-indigo-950/60 text-[#6545D8] dark:text-indigo-300 font-black'
                  : 'text-[#5A6478] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white font-semibold'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[11px] mt-1 tracking-tight leading-none truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
