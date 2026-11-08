'use client';

import React from 'react';
import { 
  Trophy, 
  X, 
  Flame, 
  Star, 
  Crown, 
  Medal, 
  Sparkles,
  Award
} from 'lucide-react';
import { User } from '@/types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  language?: 'vi' | 'en';
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  fullName: string;
  xp: number;
  streak: number;
  badge: string;
  isCurrentUser?: boolean;
}

export default function LeaderboardModal({
  isOpen,
  onClose,
  currentUser,
  language = 'vi',
}: LeaderboardModalProps) {
  if (!isOpen) return null;

  // Mocked competitive leaderboard calibrated around currentUser
  const userXp = currentUser.xp || 120;
  const userStreak = currentUser.streak || 3;

  const mockLeaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      username: 'nguyenvana',
      fullName: 'Nguyễn Văn An',
      xp: Math.max(850, userXp + 450),
      streak: Math.max(18, userStreak + 10),
      badge: '👑 Chiến Thần AI',
    },
    {
      rank: 2,
      username: 'tranminhduc',
      fullName: 'Trần Minh Đức',
      xp: Math.max(680, userXp + 280),
      streak: Math.max(14, userStreak + 6),
      badge: '🥈 Bậc Thầy Trắc Nghiệm',
    },
    {
      rank: 3,
      username: 'lethimai',
      fullName: 'Lê Thị Mai',
      xp: Math.max(520, userXp + 150),
      streak: Math.max(11, userStreak + 3),
      badge: '🥉 Học Giả Chăm Chỉ',
    },
    {
      rank: 4,
      username: currentUser.username,
      fullName: currentUser.fullName || currentUser.username,
      xp: userXp,
      streak: userStreak,
      badge: userStreak >= 7 ? '🔥 Kiên Trì Đỉnh Cao' : '⭐ Ngôi Sao Triển Vọng',
      isCurrentUser: true,
    },
    {
      rank: 5,
      username: 'phamhoangnam',
      fullName: 'Phạm Hoàng Nam',
      xp: Math.max(40, userXp - 30),
      streak: Math.max(1, userStreak - 1),
      badge: '🌱 Tân Binh Nỗ Lực',
    },
    {
      rank: 6,
      username: 'hoangthuytien',
      fullName: 'Hoàng Thủy Tiên',
      xp: Math.max(20, userXp - 60),
      streak: Math.max(1, userStreak - 2),
      badge: '📚 Người Đọc Tích Cực',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#12141e] border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-black">
            <Trophy className="w-3.5 h-3.5" />
            <span>BẢNG VINH DANH HỌC VIÊN XUẤT SẮC</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Bảng Xếp Hạng Toàn Hệ Thống Tuần Này
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tích lũy XP từ bài tập trắc nghiệm & chuỗi ngày học Streak để dẫn đầu!
          </p>
        </div>

        {/* Top 3 Podium Visual */}
        <div className="grid grid-cols-3 gap-2 pt-2 pb-1 shrink-0 items-end text-center">
          {/* Top 2 */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="w-9 h-9 mx-auto rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-xs">
              2
            </div>
            <p className="text-xs font-black truncate">{mockLeaderboard[1].fullName}</p>
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{mockLeaderboard[1].xp} XP</p>
          </div>

          {/* Top 1 */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-2 border-amber-400 space-y-1.5 -translate-y-2 shadow-lg shadow-amber-500/10">
            <div className="w-11 h-11 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs font-black text-amber-900 dark:text-amber-300 truncate">{mockLeaderboard[0].fullName}</p>
            <p className="text-xs font-black text-amber-600 dark:text-amber-400">{mockLeaderboard[0].xp} XP</p>
          </div>

          {/* Top 3 */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="w-9 h-9 mx-auto rounded-full bg-amber-700/30 flex items-center justify-center font-black text-amber-800 dark:text-amber-400 text-xs">
              3
            </div>
            <p className="text-xs font-black truncate">{mockLeaderboard[2].fullName}</p>
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{mockLeaderboard[2].xp} XP</p>
          </div>
        </div>

        {/* Scrollable Leaderboard List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
          {mockLeaderboard.map((item) => (
            <div
              key={item.username}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                item.isCurrentUser
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-primary shadow-sm ring-2 ring-primary/20'
                  : 'bg-white dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 text-center font-black text-xs ${
                    item.rank === 1
                      ? 'text-amber-500 text-sm'
                      : item.rank === 2
                      ? 'text-slate-400'
                      : item.rank === 3
                      ? 'text-amber-700'
                      : 'text-slate-500'
                  }`}
                >
                  #{item.rank}
                </span>

                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/20 text-primary flex items-center justify-center font-black text-xs capitalize shrink-0 border border-primary/20">
                  {item.username.charAt(0)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {item.fullName}
                    </p>
                    {item.isCurrentUser && (
                      <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[9px] font-black shrink-0">
                        BẠN
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.badge}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right shrink-0">
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs font-bold" title="Streak ngày học">
                  <Flame className="w-3.5 h-3.5 fill-orange-500" />
                  <span>{item.streak}d</span>
                </div>
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-black" title="Kinh nghiệm XP">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{item.xp} XP</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Motivational Footer */}
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-center shrink-0">
          <p className="text-[11px] text-amber-800 dark:text-amber-300 font-bold">
            💡 Mẹo: Hoàn thành 1 bài trắc nghiệm +50 XP, duy trì Streak mỗi ngày nhận x2 kinh nghiệm!
          </p>
        </div>

      </div>
    </div>
  );
}
