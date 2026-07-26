"use client";

import React, { useMemo, useState, useEffect } from "react";

export type SiduriAvatarState = "idle" | "observing" | "listening" | "thinking" | "speaking" | "reasoning" | "investigating" | "reading" | "advising" | "dormant" | "awakening" | "selfTesting" | "detecting" | "observingViewer" | "curious" | "embarrassed" | "introducing" | "inviting";

function useMotes(count: number) {
  return useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        radius: 90 + Math.random() * 130,
        angle: Math.random() * 360,
        dur: 34 + Math.random() * 40,
        reverse: Math.random() > 0.5,
        size: 2 + Math.random() * 2.4,
        bobDur: 4 + Math.random() * 3,
        bobDelay: Math.random() * 4,
      });
    }
    return arr;
  }, [count]);
}

interface MotesProps {
  motes: any[];
  state: string;
}

function Motes({ motes, state }: MotesProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="motes" data-state={state}>
      {isMounted && motes.map((m) => (
        <div
          key={m.id}
          className="mote-orbit"
          style={{
            width: m.radius * 2,
            height: m.radius * 2,
            marginLeft: -m.radius,
            marginTop: -m.radius,
            animationDuration: `${m.dur}s`,
            animationDirection: m.reverse ? "reverse" : "normal",
          }}
        >
          <span
            className="mote"
            style={{
              width: m.size,
              height: m.size,
              animationDuration: `${m.bobDur}s`,
              animationDelay: `${m.bobDelay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

interface SiduriAvatarProps {
  state?: SiduriAvatarState;
  size?: "presence" | "default" | "compact" | "stage";
  showMotes?: boolean;
}

// "stage" is viewport-responsive (via CSS clamp) instead of a fixed px value —
// use it for full-bleed mobile recording frames so the orb scales with screen size.
const sizeMap: Record<string, number | string> = {
  presence: 210,
  default: 120,
  compact: 40,
  stage: "clamp(150px, 48vw, 300px)",
};

export function SiduriAvatar({ state = "idle", size = "presence", showMotes = true }: SiduriAvatarProps) {
  const raw = sizeMap[size] ?? sizeMap.presence;
  const s = typeof raw === "number" ? `${raw}px` : raw;
  const rich = size === "presence" || size === "default" || size === "stage";
  const motes = useMotes(7);

  return (
    <div className="orb-stage">
      <div className={`orb orb-${size}`} data-state={state} style={{ "--s": s } as React.CSSProperties}>
        {rich && <div className="orb-corona" />}
        <div className="orb-halo" />
        <div className="orb-ring r1"><div className="orb-spin"><span className="orb-light" /></div></div>
        <div className="orb-ring r2"><div className="orb-spin"><span className="orb-light l2" /></div></div>
        <div className="orb-ring r3"><div className="orb-spin"><span className="orb-light" /></div></div>
        {rich && <div className="orb-scan" />}
        <div className="orb-sphere">
          <div className="orb-body" />
          <div className="orb-bands" />
          <div className="orb-scanline" />
          <div className="orb-terminator" />
        </div>
      </div>
      {showMotes && rich && <Motes motes={motes} state={state} />}
    </div>
  );
}