"use client";

import React from "react";

interface AudioVisualizerProps {
  active?: boolean;
  barCount?: number;
  className?: string;
}

export function AudioVisualizer({ active = true, barCount = 18, className = "" }: AudioVisualizerProps) {
  return (
    <div className={`flex items-end justify-center gap-1.5 h-10 px-4 py-2 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => {
        // Vary heights dynamically with CSS animation delay
        const delay = (i * 0.15) % 1.2;
        const duration = 0.8 + (i % 3) * 0.3;
        return (
          <div
            key={i}
            className={`w-1 rounded-full bg-gradient-to-t from-[#cf9f56] via-[#f0c67e] to-[#6f8fd6] transition-all ${
              active ? "animate-pulse" : "h-1 opacity-30"
            }`}
            style={
              active
                ? {
                    height: `${Math.sin((i + 1) * 0.8) * 16 + 22}px`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                  }
                : { height: "4px" }
            }
          />
        );
      })}
    </div>
  );
}
