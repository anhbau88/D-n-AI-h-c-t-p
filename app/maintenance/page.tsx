"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Wrench, Clock } from 'lucide-react';

const codeSnippet = `// Khởi tạo quy trình nâng cấp hệ thống
async function upgradeSystem() {
  console.log("Đang tải dữ liệu AI...");
  await system.loadModules(['nlp', 'reasoning', 'memory']);
  
  console.log("Đang tối ưu hoá bộ não AI...");
  const status = await core.optimize({
    speed: "maximum",
    accuracy: "100%",
    bugs: 0
  });
  
  if (status === "success") {
    console.log("Nâng cấp hoàn tất! Sẵn sàng phục vụ.");
  }
  
  return {
    version: "2.0.0",
    experience: "elevated"
  };
}`;

export default function MaintenancePage() {
  const [displayedCode, setDisplayedCode] = useState("");
  
  // Hiệu ứng gõ code
  useEffect(() => {
    let i = 0;
    let typingInterval: NodeJS.Timeout;

    const typeCode = () => {
      if (i < codeSnippet.length) {
        setDisplayedCode(codeSnippet.substring(0, i + 1));
        

        i++;
        // Tốc độ gõ ngẫu nhiên từ 30ms đến 80ms
        const nextDelay = Math.random() * 50 + 30; 
        typingInterval = setTimeout(typeCode, nextDelay);
      } else {
        // Chờ 5s rồi lặp lại
        setTimeout(() => {
          i = 0;
          setDisplayedCode("");
          typeCode();
        }, 5000);
      }
    };

    typeCode();

    return () => clearTimeout(typingInterval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-white">
      {/* Hiệu ứng ánh sáng nền */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Cột trái: Video nhân vật */}
        <div className="lg:col-span-5 relative flex flex-col items-center">
          <div className="relative z-10 drop-shadow-[0_0_40px_rgba(59,130,246,0.2)] group">
             {/* Khung chứa Video */}
             <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border-8 border-[#1a1d24] shadow-2xl bg-[#1a1d24]">
                 <video 
                   autoPlay 
                   loop 
                   muted 
                   playsInline
                   preload="auto"
                   className="w-full h-full object-cover"
                 >
                   <source src="/anh-bau.mp4" type="video/mp4" />
                   Trình duyệt của bạn không hỗ trợ thẻ video.
                 </video>
                 <div className="absolute inset-0 bg-gradient-to-t from-[#1a1d24] via-transparent to-transparent opacity-60 pointer-events-none" />
             </div>
             
          </div>

          {/* Bóng đổ dưới bàn */}
          <div className="w-4/5 h-8 bg-black/50 rounded-[100%] blur-xl mt-4 z-0" />
        </div>

        {/* Cột phải: Editor & Thông tin */}
        <div className="lg:col-span-7 flex flex-col space-y-8">
            <div>
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-4 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                >
                    <Wrench className="w-4 h-4 animate-pulse" />
                    HỆ THỐNG ĐANG BẢO TRÌ
                </motion.div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
                    Anh Bầu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">đang vibe code...</span>
                </h1>
                <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-xl">
                    Hệ thống AI Study Assistant đang được nâng cấp để mang lại trải nghiệm mượt mà hơn. Vui lòng đợi trong giây lát!
                </p>
            </div>

            {/* Trình soạn thảo Code (Code Editor) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="w-full bg-[#1e2128] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5"
            >
                {/* Header Editor */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#181a1f] border-b border-black/50">
                    <div className="flex gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
                        <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                        <Code size={14} /> core-upgrade.ts
                    </div>
                </div>
                
                {/* Body Editor */}
                <div className="p-5 md:p-6 font-mono text-sm md:text-base h-[320px] overflow-y-auto bg-[#0d1117] relative scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    <pre className="text-blue-300 whitespace-pre-wrap leading-relaxed">
                        {displayedCode}
                        <motion.span 
                            animate={{ opacity: [1, 0] }} 
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="inline-block w-2.5 h-5 bg-blue-400 ml-1 -mb-1 align-baseline"
                        />
                    </pre>
                </div>
            </motion.div>

            {/* Trạng thái / Thời gian */}
            <div className="flex items-center gap-4 text-zinc-400 bg-white/5 p-4 rounded-xl border border-white/5 w-fit">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Trạng thái</span>
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Đang biên dịch mã nguồn...
                    </span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
