"use client";

import React, { useMemo, useState, useEffect } from "react";

function useStars(count: number) {
  return useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() < 0.15 ? 2 : 1,
        dur: 3 + Math.random() * 5,
        delay: Math.random() * 6,
        depth: 0.2 + Math.random() * 0.8,
      });
    }
    return arr;
  }, [count]);
}

interface CosmicBackgroundProps {
  parallaxX?: number;
  parallaxY?: number;
}

export function CosmicBackground({ parallaxX = 0, parallaxY = 0 }: CosmicBackgroundProps) {
  const [isMounted, setIsMounted] = useState(false);
  const stars = useStars(70);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className="cosmic-field"
      style={{ transform: `translate(${parallaxX * -6}px, ${parallaxY * -6}px)` }}
    >
      <div className="stars">
        {isMounted && stars.map((st) => (
          <div
            key={st.id}
            className="star"
            style={{
              top: `${st.top}%`,
              left: `${st.left}%`,
              width: st.size,
              height: st.size,
              animationDuration: `${st.dur}s`,
              animationDelay: `${st.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="nebula n1" />
      <div className="nebula n2" />
      <div className="nebula n3" />
    </div>
  );
}
