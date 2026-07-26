"use client";

import React, { useState, useRef, useCallback } from "react";
import { Send, Mic, X } from "lucide-react";
import { voiceEngine } from "@/lib/voice/speech";
import { synthesizeVoice } from "@/lib/voicevox";
import { SiduriAvatar, SiduriAvatarState } from "@/components/SiduriAvatar";
import { CosmicBackground } from "@/components/CosmicBackground";
import { SideNav } from "@/components/SideNav";

/* ============================================================
   Demo data
   ============================================================ */
const PAST_SESSIONS = [
  { id: 1, title: "Evaluating beginner progression", time: "Today" },
  { id: 2, title: "Trade route optimization", time: "Today" },
  { id: 3, title: "Star chart alignment query", time: "Yesterday" },
  { id: 4, title: "Resource preservation strategy", time: "3 days ago" },
];

const SUGGESTIONS = [
  "Evaluate my current progression",
  "Recommend today's priorities",
  "Consult the star charts",
];

interface Message {
  role: "user" | "siduri";
  text: string;
}

/* ============================================================
   Main experience
   ============================================================ */
export default function SiduriImmersive() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [orbState, setOrbState] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setParallax({ x, y });
      rafRef.current = null;
    });
  }, []);

  async function sendMessage(text?: string) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || busy) return;

    setMicOn(false);
    voiceEngine.stopListening();

    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setBusy(true);
    setOrbState("thinking");

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", text: trimmed }].map((m) => ({
            role: m.role === "siduri" ? "assistant" : "user",
            content: m.text,
          })),
          provider: "zhipu",
          model: "glm-4.7-flash",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "API request failed");
      }

      const rawReply = data.content || "Siduri processed your request.";

      let japaneseText = "処理が完了しました。";
      let englishText = rawReply;

      if (rawReply.includes("[JAPANESE]") && rawReply.includes("[ENGLISH]")) {
        const parts = rawReply.split("[ENGLISH]");
        japaneseText = parts[0].replace("[JAPANESE]", "").trim();
        englishText = parts[1].trim();
      }

      setMessages((m) => [...m, { role: "siduri", text: englishText }]);
      setOrbState("speaking");

      const audioUrl = await synthesizeVoice(japaneseText);
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(e => {
          console.warn("Autoplay blocked for voice", e);
          setOrbState("idle");
          setBusy(false);
        });
        audioRef.current.onended = () => {
          setOrbState("idle");
          setBusy(false);
        };
      } else {
        // Fallback if Voicevox is not running
        setTimeout(() => {
          setOrbState("idle");
          setBusy(false);
        }, 4000);
      }
    } catch (err) {
      console.error(err);
      setOrbState("idle");
      setBusy(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function toggleMic() {
    if (busy) return;
    setMicOn((on) => {
      const next = !on;
      if (next) {
        setOrbState("listening");
        voiceEngine.listen(
          (transcript) => {
            setMicOn(false);
            sendMessage(transcript);
          },
          () => {
            setMicOn(false);
            setOrbState("idle");
          }
        );
      } else {
        voiceEngine.stopListening();
        setOrbState("idle");
      }
      return next;
    });
  }

  function useSuggestion(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  const hasMessages = messages.length > 0;

  const headerLabel =
    orbState === "listening" ? "Listening" :
      orbState === "thinking" ? "Thinking" :
        orbState === "speaking" ? "Advising" : "Idle";

  const renderMarkdown = (text: string) => {
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/`([^`]+)`/g, '<code class="bg-[#1a1820] text-[#f0c67e] px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    html = html.replace(/\n/g, "<br />");
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#07060a]">

      {/* ---------------- sidebar navigation ---------------- */}
      <SideNav onOpenHistory={() => setDrawerOpen(true)} />

      {/* ---------------- main stage ---------------- */}
      <main
        className="relative flex-1 overflow-hidden flex flex-col items-center justify-center"
        onMouseMove={handleMouseMove}
      >
        <audio ref={audioRef} className="hidden" />
        <CosmicBackground parallaxX={parallax.x} parallaxY={parallax.y} />

        {/* ---------------- history drawer ---------------- */}
        <div
          className={`absolute inset-0 bg-black/60 z-[90] transition-opacity duration-300 ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 w-80 max-w-[85%] h-full bg-[#0a090e]/95 backdrop-blur-xl border-r border-[#cf9f56]/20 z-[100] transform transition-transform duration-300 ease-in-out flex flex-col ${drawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex items-center justify-between p-6 border-b border-[#cf9f56]/20">
            <span className="font-serif text-[#cf9f56] text-lg">Past sessions</span>
            <button
              className="text-[#a89f8c] hover:text-[#ece4d2] p-1 transition-colors"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close past sessions"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-6">
            <button
              className="w-full text-left text-[#f0c67e] font-mono text-sm hover:text-[#ece4d2] transition-colors flex items-center gap-2"
              onClick={() => {
                setMessages([]);
                setOrbState("idle");
                setBusy(false);
                setDrawerOpen(false);
              }}
            >
              + Begin new session
            </button>

            <div>
              <div className="text-xs font-mono text-[#5c5749] uppercase tracking-widest mb-3">Today</div>
              <div className="space-y-1">
                {PAST_SESSIONS.filter((s) => s.time === "Today").map((s) => (
                  <div
                    className="text-[#a89f8c] text-sm hover:text-[#ece4d2] hover:bg-[#cf9f56]/10 px-3 py-2 rounded cursor-pointer transition-colors"
                    key={s.id}
                  >
                    {s.title}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-mono text-[#5c5749] uppercase tracking-widest mb-3">Earlier</div>
              <div className="space-y-1">
                {PAST_SESSIONS.filter((s) => s.time !== "Today").map((s) => (
                  <div
                    className="text-[#a89f8c] text-sm hover:text-[#ece4d2] hover:bg-[#cf9f56]/10 px-3 py-2 rounded cursor-pointer transition-colors"
                    key={s.id}
                  >
                    {s.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- presence ---------------- */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">

          {/* ---------------- chat overlay (right side) ---------------- */}
          {hasMessages && (
            <div className="absolute right-8 top-20 bottom-28 w-80 lg:w-96 flex flex-col justify-end z-40 pointer-events-auto">
              <div
                className="flex flex-col gap-6 overflow-y-auto pr-2 pb-4 max-h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                style={{ maskImage: "linear-gradient(to bottom, transparent 5%, black 15%, black 95%, transparent)" }}
              >
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col relative w-full ${m.role === "user" ? "items-end text-right" : "items-start text-left"}`}>
                    <div className={`text-[9px] uppercase font-mono tracking-[0.2em] mb-2 flex items-center gap-2 ${m.role === "user" ? "text-[#a89f8c] justify-end" : "text-[#cf9f56]"}`}>
                      {m.role === "user" ? "You" : (
                        <>
                          <span className="animate-pulse opacity-80">✦</span> Siduri
                        </>
                      )}
                    </div>

                    <div className={`relative px-4 py-1 text-sm leading-relaxed ${m.role === "user" ? "text-[#f0c67e]" : "text-[#ece4d2]"}`}>
                      <div className={`absolute top-0 ${m.role === "user" ? "right-0 border-t border-r" : "left-0 border-t border-l"} w-2 h-2 border-[#cf9f56]/40`} />
                      <div className={`absolute bottom-0 ${m.role === "user" ? "right-0 border-b border-r" : "left-0 border-b border-l"} w-2 h-2 border-[#cf9f56]/40`} />
                      <div className={`absolute top-0 bottom-0 ${m.role === "user" ? "right-0" : "left-0"} w-[1px] bg-gradient-to-b from-transparent via-[#cf9f56]/20 to-transparent`} />
                      <div className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {renderMarkdown(m.text)}
                      </div>
                    </div>
                  </div>
                ))}
                {busy && orbState === "thinking" && (
                  <div className="flex flex-col items-start relative w-full">
                    <div className="text-[9px] uppercase font-mono tracking-[0.2em] mb-2 flex items-center gap-2 text-[#cf9f56]">
                      <span className="animate-pulse opacity-80">✦</span> Siduri
                    </div>
                    <div className="relative px-4 py-2">
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#cf9f56]/40" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#cf9f56]/40" />
                      <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-[#cf9f56]/20 to-transparent" />
                      <div className="flex items-center gap-1.5 opacity-80 pt-1">
                        <span className="w-1.5 h-1.5 bg-[#cf9f56] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-[#cf9f56] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-[#cf9f56] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
              </div>
            </div>
          )}

          {/* The Avatar */}
          <div className="pointer-events-auto" style={{ transform: `translate(${parallax.x * 4}px, ${parallax.y * 4}px)` }}>
            <SiduriAvatar state={orbState as SiduriAvatarState} size="default" showMotes={true} />
          </div>

          {/* State Label */}
          <div className="mt-8 text-[10px] font-mono uppercase tracking-[0.3em] text-[#a89f8c] pointer-events-auto flex items-center gap-2">
            {orbState !== "idle" && <span className="w-1.5 h-1.5 rounded-full bg-[#f0c67e] shadow-[0_0_8px_#f0c67e] animate-pulse" />}
            <span className="opacity-80">{headerLabel}</span>
          </div>
        </div>

        {/* ---------------- suggestions ---------------- */}
        {!hasMessages && (
          <div className="absolute bottom-28 left-8 flex flex-col gap-3 z-20 pointer-events-auto">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="text-left text-xs font-mono text-[#a89f8c] hover:text-[#f0c67e] cursor-pointer transition-colors flex items-center gap-2 group"
                onClick={() => useSuggestion(s)}
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">›</span> {s}
              </button>
            ))}
          </div>
        )}

        {/* ---------------- floating input ---------------- */}
        <div className="absolute bottom-8 w-full flex justify-center px-4 z-50 pointer-events-auto">
          <div className="flex items-center gap-3 bg-[#0a090e]/80 border border-[#cf9f56]/30 backdrop-blur-xl rounded-full px-5 py-3 w-full max-w-xl shadow-[0_0_30px_rgba(207,159,86,0.05)] focus-within:border-[#cf9f56]/60 focus-within:shadow-[0_0_20px_rgba(207,159,86,0.15)] transition-all">
            <button
              className={`p-2 rounded-full transition-colors ${micOn ? "bg-[#cf9f56]/20 text-[#f0c67e]" : "text-[#a89f8c] hover:text-[#ece4d2] hover:bg-white/5"}`}
              onClick={toggleMic}
              type="button"
              aria-label="Toggle microphone"
            >
              <Mic size={18} />
            </button>
            <input
              ref={inputRef}
              placeholder={micOn ? "Listening…" : "Speak with Siduri…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-[#ece4d2] font-mono text-sm placeholder:text-[#5c5749]"
            />
            <button
              className="p-2 rounded-full text-[#cf9f56] hover:text-[#f0c67e] hover:bg-[#cf9f56]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => sendMessage()}
              disabled={!input.trim() || busy}
              type="button"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}