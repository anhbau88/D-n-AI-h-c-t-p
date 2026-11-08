// components/EduGenieLogo.tsx
// Bộ nhận diện thương hiệu Logo chính thức của EduGenie AI
// Hỗ trợ vector SVG siêu nét, hiển thị hoàn hảo ở mọi kích thước từ 24px đến 512px

'use client';

import React from 'react';

interface EduGenieLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full' | 'horizontal';
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
  animated?: boolean;
}

export const EduGenieIconMark: React.FC<{ sizePx?: number; className?: string; animated?: boolean }> = ({
  sizePx = 40,
  className = '',
  animated = false,
}) => {
  return (
    <div
      style={{ width: sizePx, height: sizePx }}
      className={`relative shrink-0 rounded-2xl p-[1.5px] bg-gradient-to-tr from-[#4F46E5] via-[#7C3AED] to-[#EC4899] shadow-md shadow-indigo-500/25 ${
        animated ? 'hover:scale-105 transition-transform duration-300' : ''
      } ${className}`}
    >
      <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#6545D8] via-[#5B3BC7] to-[#432A9A] flex items-center justify-center overflow-hidden relative">
        {/* Lớp ánh sáng nền aurora phát quang */}
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-pink-400/30 blur-md pointer-events-none" />
        <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-cyan-400/20 blur-md pointer-events-none" />

        {/* Vector biểu tượng EduGenie: Đèn Thần + Mũ Cử Nhân + Ngôi Sao AI Tri Thức */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[72%] h-[72%] relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
        >
          {/* Cánh sách tri thức mở (Wings of Knowledge) */}
          <path
            d="M8 34C13 31 19 31 24 33.5C29 31 35 31 40 34V15C35 12 29 12 24 14.5C19 12 13 12 8 15V34Z"
            fill="white"
            fillOpacity="0.22"
          />
          <path
            d="M8 34C13 31 19 31 24 33.5M24 33.5C29 31 35 31 40 34M24 33.5V14.5M24 14.5C19 12 13 12 8 15V34M24 14.5C29 12 35 12 40 15V34"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Mũ cử nhân cách điệu vươn cao (Academic Diamond Peak) */}
          <path
            d="M24 8L34 13L24 18L14 13L24 8Z"
            fill="url(#cap-gradient)"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Tia sáng Genie lấp lánh (Spark of Intelligence) */}
          <path
            d="M24 18V28M19 23H29"
            stroke="#FDE047"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="24" cy="23" r="2.8" fill="#F59E0B" />
          <circle cx="24" cy="23" r="1.4" fill="#FFFFFF" />

          {/* Ngôi sao ma thuật nhỏ phía trên bên phải */}
          <path
            d="M36 8L37.2 10.8L40 12L37.2 13.2L36 16L34.8 13.2L32 12L34.8 10.8L36 8Z"
            fill="#FBBF24"
          />

          <defs>
            <linearGradient id="cap-gradient" x1="14" y1="8" x2="34" y2="18" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" />
              <stop offset="1" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default function EduGenieLogo({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  subtitleText,
  className = '',
  animated = true,
}: EduGenieLogoProps) {
  const sizeMap = {
    xs: { px: 28, text: 'text-sm', sub: 'text-[9px]' },
    sm: { px: 34, text: 'text-base', sub: 'text-[10px]' },
    md: { px: 40, text: 'text-lg', sub: 'text-[11px]' },
    lg: { px: 48, text: 'text-xl', sub: 'text-xs' },
    xl: { px: 56, text: 'text-2xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  if (variant === 'icon') {
    return <EduGenieIconMark sizePx={currentSize.px} className={className} animated={animated} />;
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <EduGenieIconMark sizePx={currentSize.px} animated={animated} />

      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight ${currentSize.text} text-slate-900 dark:text-white`}>
            Edu<span className="bg-gradient-to-r from-[#6545D8] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">Genie</span>
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400/20 to-amber-500/20 border border-amber-400/40 text-[9px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            AI
          </span>
        </div>

        {showSubtitle && (
          <p className={`${currentSize.sub} font-bold text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight`}>
            {subtitleText || 'Trí tuệ học tập thế hệ mới'}
          </p>
        )}
      </div>
    </div>
  );
}
