'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type FontFamily = 'geist-sans' | 'roboto' | 'lexend';

interface AccessibilityContextType {
  fontScale: number;
  setFontScale: (scale: number) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScale] = useState<number>(100);
  const [fontFamily, setFontFamily] = useState<FontFamily>('geist-sans');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const savedScale = localStorage.getItem('fontScale');
    const savedFont = localStorage.getItem('fontFamily') as FontFamily;
    
    if (savedScale) {
      setFontScale(parseInt(savedScale, 10));
    }
    if (savedFont) {
      setFontFamily(savedFont);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    localStorage.setItem('fontScale', fontScale.toString());
    localStorage.setItem('fontFamily', fontFamily);
    
    // Apply changes to document
    document.documentElement.style.fontSize = `${fontScale}%`;
    
    // For font family, we can set a CSS variable that tailwind's font-sans can use, or just apply it directly
    if (fontFamily === 'geist-sans') {
      document.documentElement.style.setProperty('--font-sans', 'var(--font-geist-sans)');
    } else if (fontFamily === 'roboto') {
      document.documentElement.style.setProperty('--font-sans', 'var(--font-roboto)');
    } else if (fontFamily === 'lexend') {
      document.documentElement.style.setProperty('--font-sans', 'var(--font-lexend)');
    }
    
  }, [fontScale, fontFamily, isMounted]);

  return (
    <AccessibilityContext.Provider value={{ fontScale, setFontScale, fontFamily, setFontFamily }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
