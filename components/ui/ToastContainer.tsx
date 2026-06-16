// components/ui/ToastContainer.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, Bell, X, ArrowRight } from 'lucide-react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'assignment';
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          let Icon = Info;
          let colorClass = 'text-blue-500 bg-blue-50 dark:bg-blue-950/30';
          let borderClass = 'border-blue-200/50 dark:border-blue-900/30';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            colorClass = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
            borderClass = 'border-emerald-200/50 dark:border-emerald-900/30';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            colorClass = 'text-red-500 bg-red-50 dark:bg-red-950/30';
            borderClass = 'border-red-200/50 dark:border-red-900/30';
          } else if (toast.type === 'assignment') {
            Icon = Bell;
            colorClass = 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30';
            borderClass = 'border-indigo-200/50 dark:border-indigo-900/30';
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
              className={`pointer-events-auto w-full bg-white/70 dark:bg-gray-900/70 border ${borderClass} shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] rounded-2xl p-4 flex gap-3 backdrop-blur-xl relative overflow-hidden`}
            >
              {/* Decorative progress animation background for auto-dismiss indicator */}
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: (toast.duration || 5000) / 1000, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-1 ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : toast.type === 'assignment' ? 'bg-indigo-500' : 'bg-blue-500'}`}
              />

              {/* Icon Container */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Text details */}
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="text-xs font-bold text-foreground leading-snug">{toast.title}</h4>
                {toast.description && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-semibold leading-relaxed">
                    {toast.description}
                  </p>
                )}
                
                {/* Action button if present */}
                {toast.type === 'assignment' && toast.onAction && (
                  <button
                    onClick={() => {
                      if (toast.onAction) toast.onAction();
                      onClose(toast.id);
                    }}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-bold transition-all shadow-sm"
                  >
                    <span>{toast.actionLabel || 'Xem ngay'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => onClose(toast.id)}
                className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-650 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
