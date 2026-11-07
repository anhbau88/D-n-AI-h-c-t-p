// app/manifest.ts
// Cấu hình Progressive Web App (PWA) giúp người dùng cài đặt AI Study Assistant lên màn hình chính iPhone / Android / Desktop như ứng dụng gốc

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI Study Assistant Pro — Nền tảng Học tập & Khảo thí AI All-in-One',
    short_name: 'AI Study Pro',
    description:
      'Trợ lý học tập và giảng dạy thông minh tích hợp Đa Mô Hình AI (Flash 2.5, Pro Reasoning, Ultra Academic), Mindmap, Podcast, Flashcards 3D, Chấm bài Tự luận OCR và Quản lý Lớp học.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#4f46e5',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon',
      },
    ],
  };
}
