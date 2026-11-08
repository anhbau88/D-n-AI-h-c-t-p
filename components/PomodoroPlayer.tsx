'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  X, 
  Coffee, 
  Brain,
  CloudRain,
  Waves
} from 'lucide-react';

interface PomodoroPlayerProps {
  language?: 'vi' | 'en';
}

type SoundMode = 'none' | 'alpha' | 'rain' | 'waves';

export default function PomodoroPlayer({ language = 'vi' }: PomodoroPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [soundMode, setSoundMode] = useState<SoundMode>('none');
  const [volume, setVolume] = useState(0.3);

  // Audio nodes refs for Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodesRef = useRef<{ stop: () => void }[]>([]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Play completion chime
      playCompletionChime();
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Play chime using Web Audio API
  const playCompletionChime = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio autoplay restrictions
    }
  };

  const getAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const stopAmbientSound = () => {
    sourceNodesRef.current.forEach((n) => {
      try {
        n.stop();
      } catch {
        // Ignored
      }
    });
    sourceNodesRef.current = [];
  };

  const startAmbientSound = (type: SoundMode) => {
    stopAmbientSound();
    if (type === 'none') return;

    try {
      const ctx = getAudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      if (type === 'alpha') {
        // Alpha Binaural Beat: 200Hz left, 210Hz right (10Hz difference)
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        const merger = ctx.createChannelMerger(2);

        oscL.type = 'sine';
        oscL.frequency.value = 200;
        oscR.type = 'sine';
        oscR.frequency.value = 210;

        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        merger.connect(masterGain);

        oscL.start();
        oscR.start();

        sourceNodesRef.current.push({
          stop: () => {
            try {
              oscL.stop();
              oscR.stop();
            } catch {}
          },
        });
      } else if (type === 'rain') {
        // Rain Sound Generator using filtered White/Pink noise buffer
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02; // Pink noise filter
          lastOut = output[i];
          output[i] *= 2.5;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        sourceNodesRef.current.push({
          stop: () => {
            try {
              whiteNoise.stop();
            } catch {}
          },
        });
      } else if (type === 'waves') {
        // Ocean waves: modulated noise
        const bufferSize = 3 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;

        const swellGain = ctx.createGain();
        swellGain.gain.setValueAtTime(0.2, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(swellGain);
        swellGain.connect(masterGain);
        whiteNoise.start();

        // LFO for wave modulation
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.12; // 1 wave every ~8 seconds
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.3;
        lfo.connect(swellGain.gain);
        lfo.start();

        sourceNodesRef.current.push({
          stop: () => {
            try {
              whiteNoise.stop();
              lfo.stop();
            } catch {}
          },
        });
      }
    } catch {
      // Audio setup error fallback
    }
  };

  const handleSoundChange = (newSound: SoundMode) => {
    setSoundMode(newSound);
    if (newSound === 'none') {
      stopAmbientSound();
    } else {
      startAmbientSound(newSound);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol, audioCtxRef.current.currentTime);
    }
  };

  const toggleTimer = () => {
    if (!isRunning && soundMode === 'none') {
      // Default to Rain when starting Pomodoro if no sound selected
      handleSoundChange('rain');
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating Trigger Pill on Header/Navbar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all shadow-xs ${
          isRunning
            ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white animate-pulse'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
        }`}
        title="Đồng hồ Pomodoro & Nhạc sóng não tập trung"
      >
        <Timer className="w-3.5 h-3.5" />
        <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
      </button>

      {/* Floating Card Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-80 p-5 rounded-3xl bg-white/95 dark:bg-[#12141e]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-2xl space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'vi' ? 'Đồng Hồ Pomodoro' : 'Pomodoro Timer'}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode switch */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => switchMode('work')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'work'
                    ? 'bg-white dark:bg-slate-800 text-primary dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Tập trung 25p' : 'Focus 25m'}</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('break')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'break'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Nghỉ ngơi 5p' : 'Break 5m'}</span>
              </button>
            </div>

            {/* Timer countdown display */}
            <div className="text-center py-2">
              <div className="text-4xl font-black font-mono tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {formatTime(timeLeft)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {mode === 'work'
                  ? (language === 'vi' ? '🎯 Phiên học tập trung sâu' : 'Deep focus session')
                  : (language === 'vi' ? '☕ Thư giãn mắt & uống nước' : 'Rest eyes & drink water')}
              </p>
            </div>

            {/* Timer action controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={toggleTimer}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                title={isRunning ? 'Tạm dừng' : 'Bắt đầu'}
              >
                {isRunning ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                title="Đặt lại thời gian"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Ambient Audio Sounds (Web Audio API) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-primary" />
                  <span>{language === 'vi' ? 'Âm thanh sóng não tập trung' : 'Ambient focus sound'}</span>
                </span>
                {soundMode !== 'none' && (
                  <button
                    type="button"
                    onClick={() => handleSoundChange('none')}
                    className="text-rose-500 hover:underline flex items-center gap-0.5 text-[10px]"
                  >
                    <VolumeX className="w-3 h-3" />
                    <span>Tắt</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSoundChange('rain')}
                  className={`p-2 rounded-xl text-center border text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
                    soundMode === 'rain'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-primary text-primary'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                  <span>Mưa rơi</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSoundChange('alpha')}
                  className={`p-2 rounded-xl text-center border text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
                    soundMode === 'alpha'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-primary text-primary'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 text-purple-500" />
                  <span>Sóng Alpha</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSoundChange('waves')}
                  className={`p-2 rounded-xl text-center border text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
                    soundMode === 'waves'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-primary text-primary'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5 text-teal-500" />
                  <span>Sóng biển</span>
                </button>
              </div>

              {soundMode !== 'none' && (
                <div className="flex items-center gap-2 pt-1 px-1">
                  <span className="text-[10px] text-slate-400 font-semibold">Âm lượng</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
