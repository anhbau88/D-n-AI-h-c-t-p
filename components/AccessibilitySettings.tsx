'use client';

import React from 'react';
import { Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { useAccessibility } from './AccessibilityContext';

export default function AccessibilitySettings() {
  const { fontScale, setFontScale, fontFamily, setFontFamily } = useAccessibility();

  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center justify-center whitespace-nowrap w-10 h-10 rounded-full hover:bg-white/20 text-white border-0 backdrop-blur-sm transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50">
        <Type className="w-5 h-5" />
        <span className="sr-only">Cài đặt tiện dụng</span>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm leading-none">Cỡ chữ</h4>
            <p className="text-xs text-muted-foreground">Điều chỉnh kích thước văn bản.</p>
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-medium">A</span>
              <Slider
                value={[fontScale]}
                min={80}
                max={150}
                step={5}
                onValueChange={(val: number | readonly number[]) => setFontScale(Array.isArray(val) ? val[0] : val as number)}
                className="flex-1"
              />
              <span className="text-base font-medium">A</span>
            </div>
            <div className="text-right text-xs text-muted-foreground pt-1">{fontScale}%</div>
          </div>
          
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-medium text-sm leading-none">Phông chữ</h4>
            <p className="text-xs text-muted-foreground">Chọn phông chữ dễ đọc hơn.</p>
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                variant={fontFamily === 'geist-sans' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFontFamily('geist-sans')}
                className="w-full justify-start font-sans"
              >
                Mặc định (Geist)
              </Button>
              <Button 
                variant={fontFamily === 'roboto' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFontFamily('roboto')}
                className="w-full justify-start"
                style={{ fontFamily: 'var(--font-roboto, inherit)' }}
              >
                Roboto (Dễ đọc)
              </Button>
              <Button 
                variant={fontFamily === 'lexend' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFontFamily('lexend')}
                className="w-full justify-start"
                style={{ fontFamily: 'var(--font-lexend, inherit)' }}
              >
                Lexend (Hỗ trợ khó đọc)
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
