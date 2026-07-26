"use client";

import React, { useEffect, useRef } from "react";

export function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const numStars = Math.floor((width * height) / 9000);
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.05 + 0.01,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep celestial radial backdrop
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      grad.addColorStop(0, "rgba(18, 16, 11, 0.4)");
      grad.addColorStop(0.5, "rgba(10, 9, 6, 0.8)");
      grad.addColorStop(1, "rgba(5, 4, 3, 0.98)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render drifting stars
      stars.forEach((star) => {
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        star.alpha += (Math.random() - 0.5) * star.twinkleSpeed;
        if (star.alpha < 0.1) star.alpha = 0.1;
        if (star.alpha > 0.85) star.alpha = 0.85;

        ctx.fillStyle = `rgba(236, 228, 210, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Occasional gold accent stars
        if (star.size > 1.3) {
          ctx.fillStyle = `rgba(240, 198, 126, ${star.alpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
