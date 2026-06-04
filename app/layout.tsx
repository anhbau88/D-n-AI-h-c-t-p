import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Lexend, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AccessibilityProvider } from "@/components/AccessibilityContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto",
});

const lexend = Lexend({
  subsets: ["latin", "vietnamese"],
  variable: "--font-lexend",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-plus-jakarta-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "AI Study Assistant - Trợ lý học tập thông minh",
  description: "Ứng dụng AI giúp sinh viên tóm tắt tài liệu PDF, chat hỏi đáp và tạo câu hỏi trắc nghiệm ôn tập. Powered by Google Gemini.",
  keywords: ["AI", "học tập", "PDF", "tóm tắt", "trắc nghiệm", "sinh viên"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} ${lexend.variable} ${plusJakartaSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Theme
                  const savedTheme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }

                  // Accessibility: Font Scale and Font Family
                  const savedScale = localStorage.getItem('fontScale');
                  const savedFont = localStorage.getItem('fontFamily');
                  
                  if (savedScale) {
                    document.documentElement.style.fontSize = savedScale + '%';
                  }
                  
                  if (savedFont === 'roboto') {
                    document.documentElement.style.setProperty('--font-sans', 'var(--font-roboto)');
                  } else if (savedFont === 'lexend') {
                    document.documentElement.style.setProperty('--font-sans', 'var(--font-lexend)');
                  } else {
                    document.documentElement.style.setProperty('--font-sans', 'var(--font-plus-jakarta-sans)');
                  }
                  
                  document.documentElement.style.setProperty('--font-mono', 'var(--font-jetbrains-mono)');
                } catch (_) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  );
}
