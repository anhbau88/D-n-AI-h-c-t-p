// components/ThemeToggle.tsx
// Nút chuyển đổi giao diện Sáng / Tối

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Khôi phục cài đặt theme từ localStorage khi load trang
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme);
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Thay đổi theme và lưu lại cấu hình
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-xl border-white/10 hover:bg-white/20 text-white bg-white/10 h-10 w-10 shrink-0 shadow-lg transition-all duration-300"
      title="Chuyển đổi giao diện Sáng/Tối"
    >
      {theme === 'light' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-300 transition-all rotate-0 scale-100" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-blue-200 transition-all rotate-0 scale-100" />
      )}
      <span className="sr-only">Toggle Theme</span>
    </Button>
  );
}
