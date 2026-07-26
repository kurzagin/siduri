"use client";

import React, { useState, useEffect } from "react";

interface SubtitlePanelProps {
  speaker?: string;
  text?: string;
  visible?: boolean;
  className?: string;
  playing?: boolean;
  audioDuration?: number;
}

// Bottom caption overlay — fades up from the screen edge instead of sitting
// in a boxed card. Built for full-bleed mobile recording frames.
export function SubtitlePanel({
  speaker = "SIDURI",
  text = "",
  visible = true,
  className = "",
  playing = true,
  audioDuration,
}: SubtitlePanelProps) {
  if (!visible || !text || !playing) return null;
  
  // Default fallback duration based on text length, or use exact audio duration
  const currentDuration = audioDuration ? (audioDuration * 0.95) : Math.max(1000, text.length * 60);

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-10 px-6 pt-20 bg-gradient-to-t from-[#050403] via-[#050403]/88 to-transparent ${className}`}
      style={{ paddingBottom: "max(3rem, env(safe-area-inset-bottom))" }}
    >
      <style>{`
        @keyframes subtitle-fade {
          0% { opacity: 0; transform: translateY(10px); }
          5% { opacity: 1; transform: translateY(0); }
          95% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-5px); }
        }
        .animate-subtitle-fade {
          animation: subtitle-fade var(--duration) ease-in-out forwards;
        }
      `}</style>
      <div className="mx-auto max-w-2xl text-center flex flex-col items-center justify-end min-h-[6rem] pb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#cf9f56] mb-3">
          {speaker}
        </div>
        
        <p 
          key={text}
          className="font-sans font-bold text-2xl md:text-3xl text-[#ece4d2] animate-subtitle-fade drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-relaxed"
          style={{ "--duration": `${currentDuration}ms` } as React.CSSProperties}
        >
          {text}
        </p>
      </div>
    </div>
  );
}