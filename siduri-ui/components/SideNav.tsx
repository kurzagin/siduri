"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Tv, Layers, Brain, FolderKanban, CalendarCheck, Plug, Settings, History } from "lucide-react";

interface SideNavProps {
  onOpenHistory?: () => void;
}

export function SideNav({ onOpenHistory }: SideNavProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const navItems = [
    { name: "Chat", href: "/", icon: Sparkles },
    { name: "Stage", href: "/stage", icon: Tv },
    { name: "Overlay", href: "/overlay", icon: Layers },
    { name: "Memories", href: "/memories", icon: Brain },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Plans", href: "/plans", icon: CalendarCheck },
    { name: "Integrations", href: "/integrations", icon: Plug },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="relative z-50 flex h-full w-20 flex-shrink-0 flex-col items-center py-6 bg-[#0a090e] border-r border-[#cf9f56]/10">

      {/* Primary Navigation */}
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              className="relative flex h-12 w-12 items-center justify-center"
            >
              {isActive && (
                <span className="absolute -left-4 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-md bg-[#cf9f56] shadow-[0_0_10px_#cf9f56]" />
              )}
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${isActive
                    ? "bg-[#cf9f56]/20 text-[#f0c67e] shadow-[0_0_15px_rgba(207,159,86,0.2)]"
                    : "text-[#a89f8c] hover:text-[#ece4d2] hover:bg-white/5"
                  }`}
              >
                <Icon className="w-5 h-5" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* History Button (if on chat view) */}
      {onOpenHistory && (
        <button
          onClick={onOpenHistory}
          title="Past Sessions"
          className="mt-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-[#a89f8c] hover:text-[#ece4d2] hover:bg-white/5 transition-all"
        >
          <History className="w-5 h-5" />
        </button>
      )}
    </nav>
  );
}