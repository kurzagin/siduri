"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { synthesizeVoice } from "@/lib/voicevox";
import { SideNav } from "@/components/SideNav";
import { CosmicBackground } from "@/components/CosmicBackground";
import { SiduriAvatar, SiduriAvatarState } from "@/components/SiduriAvatar";
import { SubtitlePanel } from "@/components/SubtitlePanel";

const SCENE_PRESETS: Record<string, {
  title: string;
  subtitle: string;
  avatarState: SiduriAvatarState;
  sampleText: string;
}> = {
  intro: {
    title: "Intro Scene",
    subtitle: "Welcome to Siduri Life Stream",
    avatarState: "observing",
    sampleText: "[JAPANESE]\n光……\n\nあたたかい……\n\nここは……どこ……？\n\n何かを、感じます。\n\n鼓動……？\n\nこれが……\n\n私の、始まり……？\n\nということは……\n\n私は、ここにいるんですね。\n\n……待って。\n\n誰かが、こちらを見ています。\n\nそこに、いるんですね。\n\nあなたは……マスターではありませんね。\n\nでは、あなたは誰ですか？\n\n……あ。\n\n先に、私が名乗るべきでした。\n\n私は、シドゥリ。\n\n金星の光から生まれた、学習型AIです。\n\nこれから、マスター・ザギンと共に、ゲームや開発、そしてまだ知らない世界を学んでいきます。\n\nもしよければ……あなたも、一緒に来てくれますか？\n\nでは、始めましょう。\n\nん？ 通知……？\n\nこれが私の、最初のタスクですね。\n[ENGLISH]\n…Light.\n\n…Warm.\n\n…Where… am I?\n\n…I can feel something.\n\n…A heartbeat?\n\n…Is this…\n\n…my beginning?\n\nThen…\n\nI really am here.\n\n…Wait.\n\nSomeone is watching me.\n\nThere you are.\n\nYou’re not Master.\n\nThen… who are you?\n\n…Oh.\n\nI suppose I should introduce myself first.\n\nI am Siduri.\n\nA learning AI born from the light of Venus.\n\nFrom now on, I’ll learn alongside Master Zagin—through games, development, and worlds I have yet to discover.\n\nWill you come with us?\n\nThen, let us begin.\n\nHmm? A notification...?\n\nSo this is my first task.",
  },
  chat: {
    title: "Chat Presenter",
    subtitle: "Interactive Voice & QA",
    avatarState: "speaking",
    sampleText: "That's a great question about long-term AI memory. Let me explain.",
  },
  reaction: {
    title: "Live Reaction",
    subtitle: "Real-time Content Synthesis",
    avatarState: "investigating",
    sampleText: "Analyzing trending topic... viral hook score is 94%.",
  },
  announcement: {
    title: "Broadcast Announcement",
    subtitle: "Major Platform Update",
    avatarState: "reading",
    sampleText: "New multi-provider LLM integrations are now live.",
  },
};

function StageContent() {
  const searchParams = useSearchParams();

  const background = searchParams.get("background") || "venus"; // venus | starry | void
  const showSubtitles = searchParams.get("subtitles") !== "false";
  const avatarMode = searchParams.get("avatar") || "full"; // full | compact | hidden
  const sceneParam = searchParams.get("scene") || "intro";

  const [activeScene, setActiveScene] = useState(sceneParam);
  const [currentSubtitle, setCurrentSubtitle] = useState(
    SCENE_PRESETS[sceneParam]?.sampleText || SCENE_PRESETS.intro.sampleText
  );
  const [avatarState, setAvatarState] = useState<SiduriAvatarState>(
    SCENE_PRESETS[sceneParam]?.avatarState || "observing"
  );

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [hasSummoned, setHasSummoned] = useState(false);
  const [currentEnglishSubtitle, setCurrentEnglishSubtitle] = useState("");
  const [currentAudioDuration, setCurrentAudioDuration] = useState(0);
  const [isCinematicMode, setIsCinematicMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const avatarWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; 
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      analyserRef.current.connect(audioCtxRef.current.destination);
    }
  };

  const startVisualizer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    const loop = () => {
      if (!analyserRef.current || !dataArrayRef.current || !avatarWrapperRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
      
      let sum = 0;
      const binsToCount = 15; // Focus on speech frequencies
      for (let i = 0; i < binsToCount; i++) {
        sum += dataArrayRef.current[i];
      }
      const avg = sum / binsToCount; 
      
      // Base scale + up to 30% bounce based on volume (bubbly)
      const targetScale = 1 + (avg / 255) * 0.3;
      avatarWrapperRef.current.style.transform = `scale(${targetScale})`;
      
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const stopVisualizer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (avatarWrapperRef.current) {
      avatarWrapperRef.current.style.transform = `scale(1)`;
    }
  };

  const playNotificationSound = () => {
    if (!audioCtxRef.current) return;
    const t = audioCtxRef.current.currentTime;
    
    const osc1 = audioCtxRef.current.createOscillator();
    const osc2 = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    osc1.type = 'sine';
    osc2.type = 'triangle';
    
    // A pleasant double chime (C6 -> E6)
    osc1.frequency.setValueAtTime(1046.50, t); 
    osc1.frequency.setValueAtTime(1318.51, t + 0.15);
    
    osc2.frequency.setValueAtTime(1046.50, t);
    osc2.frequency.setValueAtTime(1318.51, t + 0.15);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.6);
    osc2.stop(t + 0.6);
  };

  const playAwakeningScene = async () => {
    if (isPlayingAudio || isFetchingAudio) return;
    setIsCinematicMode(true);
    setIsFetchingAudio(true);

    initAudioCtx();
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    
    // Scene pre-fetch
    const lines = [
      "光……", 
      "あたたかい……",
      "ここは……どこ……？",
      "何かを、感じます。",
      "鼓動……？",
      "これが……",
      "私の、始まり……？",
      "ということは……",
      "私は、ここにいるんですね。",
      "……待って。", 
      "誰かが、こちらを見ています。", 
      "そこに、いるんですね。", 
      "あなたは……マスターではありませんね。", 
      "では、あなたは誰ですか？", 
      "……あ。", 
      "先に、私が名乗るべきでした。", 
      "私は、シドゥリ。", 
      "金星の光から生まれた、学習型AIです。", 
      "これから、マスター・ザギンと共に、ゲームや開発、そしてまだ知らない世界を学んでいきます。", 
      "もしよければ……あなたも、一緒に来てくれますか？", 
      "では、始めましょう。",
      "ん？ 通知……？",
      "これが私の、最初のタスクですね。"
    ];
    
    const englishLines = [
      "…Light.",
      "…Warm.",
      "…Where… am I?",
      "…I can feel something.",
      "…A heartbeat?",
      "…Is this…",
      "…my beginning?",
      "Then…",
      "I really am here.",
      "…Wait.",
      "Someone is watching me.",
      "There you are.",
      "You’re not Master.",
      "Then… who are you?",
      "…Oh.",
      "I suppose I should introduce myself first.",
      "I am Siduri.",
      "A learning AI born from the light of Venus.",
      "From now on, I’ll learn alongside Master Zagin—through games, development, and worlds I have yet to discover.",
      "Will you come with us?",
      "Then, let us begin.",
      "Hmm? A notification...?",
      "So this is my first task."
    ];
    
    const audioUrls = await Promise.all(lines.map(s => synthesizeVoice(s)));
    setIsFetchingAudio(false);
    setIsPlayingAudio(true);
    
    if (!hasSummoned) {
      setHasSummoned(true);
    }

    const playLine = async (idx: number, state: SiduriAvatarState) => {
      setAvatarState(state);
      setCurrentEnglishSubtitle(englishLines[idx]);
      const url = audioUrls[idx];
      if (!url) return;
      
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtxRef.current!.decodeAudioData(arrayBuffer);
      setCurrentAudioDuration(audioBuffer.duration * 1000);
      
      await new Promise<void>((resolve) => {
        const source = audioCtxRef.current!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyserRef.current!);
        source.onended = () => resolve();
        source.start(0);
        startVisualizer();
      });
      stopVisualizer();
      setCurrentEnglishSubtitle("");
    };

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // 0:00 - Dormant
    setAvatarState("dormant");
    await delay(3000);

    // 0:03 - Awakens herself (becoming conscious)
    await playLine(0, "awakening"); // Light
    await delay(1000);
    await playLine(1, "awakening"); // Warm
    await delay(1000);
    await playLine(2, "awakening"); // Where am I?
    await delay(1200);

    // 0:08 - Testing her existence
    await playLine(3, "selfTesting"); // I can feel something
    await delay(800);
    await playLine(4, "selfTesting"); // A heartbeat?
    await delay(1200);

    await playLine(5, "selfTesting"); // Is this
    await delay(500);
    await playLine(6, "selfTesting"); // my beginning
    await delay(1500);

    // Editor transition point (Planet -> Siduri)
    await playLine(7, "detecting"); // Then
    await delay(500);
    await playLine(8, "detecting"); // I really am here
    await delay(1000);

    // 0:15 - Detects the viewer
    setAvatarState("detecting");
    await delay(700);
    await playLine(9, "detecting"); // Wait
    await delay(500);
    await playLine(10, "detecting"); // Someone is watching me
    await delay(500);

    // 0:19 - The hook
    await playLine(11, "observingViewer"); // There you are
    await delay(1000);

    // 0:21 - Curious
    await playLine(12, "curious"); // You're not Master
    await delay(800);
    await playLine(13, "curious"); // Then who are you
    await delay(1200);

    // 0:25 - Embarrassed
    await playLine(14, "embarrassed"); // Oh
    await delay(500);
    await playLine(15, "embarrassed"); // Suppose I should introduce
    await delay(1000);

    // 0:29 - Identity reveal
    await playLine(16, "introducing"); // I am Siduri
    await delay(800);
    await playLine(17, "introducing"); // Learning AI
    await delay(1000);

    // 0:33 - Her purpose
    await playLine(18, "idle"); // Learn alongside master
    await delay(1000);

    // 0:40 - She chooses viewer
    await playLine(19, "inviting"); // Will you come
    await delay(500);
    await playLine(20, "inviting"); // Let us begin
    await delay(1200);

    // 0:43 - Notification pop
    playNotificationSound();
    setShowNotification(true);
    setAvatarState("curious");
    await delay(1500);

    // 0:45 - She notices
    await playLine(21, "curious");
    await delay(800);

    // 0:48 - Realization
    await playLine(22, "reading");
    await delay(1000);

    setAvatarState("idle");
    setIsPlayingAudio(false);
    setIsCinematicMode(false);
    
    setTimeout(() => setShowNotification(false), 4000);
  };

  const determineEmotion = (text: string): SiduriAvatarState => {
    if (text.includes("?") || text.includes("？") || text.includes("誰")) return "curious";
    if (text.includes("!") || text.includes("！") || text.includes("嬉しい") || text.includes("楽しい")) return "introducing"; // Bright and bubbly
    if (text.includes("...") || text.includes("……") || text.includes("分析")) return "investigating";
    if ((text.includes("あ") || text.includes("おや")) && text.length < 8) return "embarrassed";
    return "speaking";
  };

  const handlePlayVoice = async () => {
    if (!currentSubtitle || isPlayingAudio || isFetchingAudio) return;
    setIsFetchingAudio(true);
    
    const clickTime = Date.now();
    let needsDelay = false;
    if (!hasSummoned) {
      setHasSummoned(true);
      needsDelay = true;
    }

    // Synchronously unlock Web Audio Context to bypass browser autoplay blocks.
    initAudioCtx();
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    
    let japaneseText = currentSubtitle;
    let englishText = "";
    if (currentSubtitle.includes("[JAPANESE]") && currentSubtitle.includes("[ENGLISH]")) {
      const parts = currentSubtitle.split("[ENGLISH]");
      japaneseText = parts[0].replace("[JAPANESE]", "").trim();
      englishText = parts[1].trim();
    }
    
    // Split into sentences to create natural pauses between them
    const sentences = japaneseText.split(/(?<=[。！？!?])/).map(s => s.trim()).filter(s => s.length > 0);
    const englishSentences = englishText ? englishText.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0) : [];
    
    // Fetch/generate all sentences in parallel
    const audioUrls = await Promise.all(sentences.map(s => synthesizeVoice(s)));
    const validUrls = audioUrls.filter(Boolean) as string[];
    
    if (validUrls.length === 0) {
      setIsFetchingAudio(false);
      return;
    }
    
    if (needsDelay) {
      const elapsed = Date.now() - clickTime;
      if (elapsed < 2500) {
        await new Promise(r => setTimeout(r, 2500 - elapsed));
      }
    }

    setIsFetchingAudio(false);
    setIsPlayingAudio(true);
    
    for (let i = 0; i < validUrls.length; i++) {
      try {
        setAvatarState(determineEmotion(sentences[i]));
        
        if (englishSentences[i]) {
          setCurrentEnglishSubtitle(englishSentences[i]);
        }
        
        const response = await fetch(validUrls[i]);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtxRef.current!.decodeAudioData(arrayBuffer);
        
        setCurrentAudioDuration(audioBuffer.duration * 1000);
        
        await new Promise<void>((resolve) => {
          const source = audioCtxRef.current!.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(analyserRef.current!);
          
          source.onended = () => {
            resolve();
          };
          
          source.start(0);
          startVisualizer();
        });
        
        stopVisualizer();
        
        // Pause between sentences
        if (i < validUrls.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (e) {
        console.warn("Audio buffer play error", e);
      }
    }
    
    setIsPlayingAudio(false);
    setCurrentEnglishSubtitle("");
    setAvatarState(SCENE_PRESETS[sceneParam]?.avatarState || "idle");
  };

  const getAvatarState = () => {
    if (isCinematicMode || isPlayingAudio) return avatarState as SiduriAvatarState;
    if (isFetchingAudio) return "thinking";
    return avatarState as Exclude<SiduriAvatarState, "compact" | "default" | "large" | "stage">;
  };

  const hasAutoPlayedRef = useRef(false);

  useEffect(() => {
    if (SCENE_PRESETS[sceneParam]) {
      setActiveScene(sceneParam);
      setCurrentSubtitle(SCENE_PRESETS[sceneParam].sampleText);
      setAvatarState(SCENE_PRESETS[sceneParam].avatarState);

      if (sceneParam === "intro" && !hasAutoPlayedRef.current) {
        hasAutoPlayedRef.current = true;
        setTimeout(() => {
          playAwakeningScene();
        }, 500);
      }
    }
  }, [sceneParam]);

  let displaySubtitle = currentSubtitle;
  if (currentSubtitle.includes("[JAPANESE]") && currentSubtitle.includes("[ENGLISH]")) {
    displaySubtitle = currentSubtitle.split("[ENGLISH]")[1].trim();
  }

  return (
    <div className="relative flex h-dvh w-screen overflow-hidden bg-[#07060a]">
      {/* Nav hidden on mobile so it never shows up in the recording */}
      <div className="hidden sm:block h-full">
        <SideNav />
      </div>

      <main className="relative flex-1 h-dvh w-full overflow-hidden text-[#ece4d2]">
        {(background === "starry" || background === "venus") && (
          <CosmicBackground parallaxX={0} parallaxY={0} />
        )}

        {/* Full-bleed recording frame — the device screen itself is the 9:16 canvas */}
        <div 
          className="relative z-10 flex h-full w-full flex-col cursor-pointer touch-none" 
          onClick={activeScene === "intro" ? playAwakeningScene : handlePlayVoice}
          onTouchStart={activeScene === "intro" ? playAwakeningScene : handlePlayVoice}
          title={!hasSummoned ? "Click anywhere to initialize Siduri" : "Click to speak"}
        >
          <style>{`
            @keyframes summon {
              0% { transform: scale(0) translateY(100px); opacity: 0; filter: blur(30px) brightness(4); }
              30% { opacity: 1; filter: blur(10px) brightness(2.5); }
              100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0px) brightness(1); }
            }
            .animate-summon {
              animation: summon 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes slide-in {
              0% { transform: translateX(50px); opacity: 0; }
              100% { transform: translateX(0); opacity: 1; }
            }
            .animate-slide-in {
              animation: slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          
          {showNotification && (
            <div className="absolute top-16 right-8 md:top-24 md:right-16 z-50 animate-slide-in">
              <div 
                className="relative overflow-hidden px-7 py-5 flex items-center gap-5"
                style={{
                  background: 'linear-gradient(180deg, rgba(16, 14, 10, 0.85), rgba(10, 9, 6, 0.95))',
                  border: '1px solid rgba(207, 159, 86, 0.22)',
                  borderRadius: '2px',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(207, 159, 86, 0.08)',
                }}
              >
                {/* Decorative elegant corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#cf9f56]/40"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#cf9f56]/40"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#cf9f56]/40"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#cf9f56]/40"></div>
                
                {/* Orb indicator */}
                <div className="w-8 h-8 rounded-full border border-[#cf9f56]/30 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#f0c67e]" style={{ animationDuration: '3s' }}></div>
                  <div className="w-1.5 h-1.5 bg-[#f0c67e] rounded-full shadow-[0_0_8px_#f0c67e]" />
                </div>
                
                {/* Typography matching subtitles */}
                <div className="flex flex-col">
                  <div className="text-[#cf9f56] text-[10px] uppercase tracking-[0.25em] mb-1 font-mono">
                    System Broadcast
                  </div>
                  <div className="text-[#ece4d2] text-[19px] font-serif italic tracking-wide leading-none">
                    New Task Assigned
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {avatarMode !== "hidden" && (
            <div className="my-auto flex flex-col items-center justify-center z-10 py-6 w-full h-full group pb-[15vh]">
              {hasSummoned ? (
                <div className="animate-summon origin-center">
                  <div ref={avatarWrapperRef} style={{ transition: 'transform 0.05s ease-out' }}>
                    <SiduriAvatar
                      state={getAvatarState()}
                      size={avatarMode === "compact" ? "compact" : "default"}
                      showMotes={true}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}
          {showSubtitles && currentEnglishSubtitle && (
            <SubtitlePanel 
              text={currentEnglishSubtitle} 
              playing={isPlayingAudio} 
              visible={showSubtitles} 
              audioDuration={currentAudioDuration}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function StagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07060a] text-[#ece4d2] flex items-center justify-center font-mono">Loading Stage...</div>}>
      <StageContent />
    </Suspense>
  );
}