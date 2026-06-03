'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface TextStreamLoaderProps {
  messages: string[];
  interval?: number; // Time in milliseconds between messages
  className?: string;
}

export default function TextStreamLoader({
  messages,
  interval = 3000,
  className = ''
}: TextStreamLoaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [messages, interval]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative mb-6">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <div className="absolute inset-0 w-12 h-12 border-3 border-purple-500/30 rounded-full animate-ping"></div>
      </div>
      
      <div className="h-8 relative w-full max-w-[280px] flex justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute text-purple-600 dark:text-purple-400 font-bold text-center w-full"
          >
            {messages[currentIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
      
      <p className="text-gray-400 text-xs mt-3 max-w-xs text-center leading-relaxed">
        Quá trình phân tích chi tiết có thể mất từ 10 - 20 giây. Vui lòng không đóng trình duyệt hoặc tải lại trang.
      </p>
    </div>
  );
}
