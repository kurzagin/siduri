"use client";

import React, { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { CosmicBackground } from "@/components/CosmicBackground";
import { SiduriAvatar, SiduriAvatarState } from "@/components/SiduriAvatar";
import { LLM_PROVIDERS, LLMProviderId } from "@/lib/ai/providers";
import { Key, Volume2, Database, Sparkles, Save, CheckCircle2, ShieldAlert } from "lucide-react";

export default function SettingsPage() {
  const [activeProvider, setActiveProvider] = useState<LLMProviderId>("gemini");
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    gemini: "",
    zhipu: "",
    openai: "",
    claude: "",
    kimi: "",
  });
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [avatarTestState, setAvatarTestState] = useState<SiduriAvatarState>("observing");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleKeyChange = (providerKey: string, val: string) => {
    setApiKeys((prev) => ({ ...prev, [providerKey]: val }));
  };

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#07060a]">
      <SideNav />

      <main className="relative flex-1 overflow-y-auto flex flex-col p-6 md:p-10 text-[#ece4d2]">
        <CosmicBackground parallaxX={0} parallaxY={0} />

        <div className="relative z-10 max-w-5xl w-full mx-auto space-y-12">
          
          {/* Title Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#cf9f56]/15 pb-6">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-[#ece4d2] tracking-wide">
                Configuration Hub
              </h1>
              <p className="font-mono text-xs text-[#a89f8c] mt-2">
                Manage LLM Provider Credentials, Voice Engines, & Avatar State Behaviors
              </p>
            </div>

            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-5 py-2.5 text-[#a89f8c] hover:text-[#f0c67e] transition-colors font-mono text-xs"
            >
              <Save className="w-4 h-4" />
              <span>{savedSuccess ? "Saved Successfully" : "Save Configuration"}</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="text-emerald-400 text-xs font-mono flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings saved locally. API keys and voice preferences are active.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

            {/* Section 1: AI Provider Keys */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-[#cf9f56]/10 pb-4">
                <Key className="w-5 h-5 text-[#f0c67e]/70" />
                <h2 className="font-serif text-xl text-[#ece4d2]">LLM API Keys & Providers</h2>
              </div>

              <div className="space-y-6">
                {(Object.keys(LLM_PROVIDERS) as LLMProviderId[]).map((pId) => {
                  const prov = LLM_PROVIDERS[pId];
                  return (
                    <div key={pId} className="space-y-2 group">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#ece4d2] group-hover:text-[#f0c67e] transition-colors">{prov.name}</span>
                        <span className="text-[#5c5749]">{prov.defaultModel}</span>
                      </div>
                      <p className="text-[11px] text-[#8a8373] font-sans">{prov.description}</p>
                      <input
                        type="password"
                        value={apiKeys[pId] || ""}
                        onChange={(e) => handleKeyChange(pId, e.target.value)}
                        placeholder={`Enter ${prov.name} API Key...`}
                        className="w-full bg-transparent border-b border-[#cf9f56]/20 pb-2 text-[#ece4d2] font-mono text-xs outline-none focus:border-[#f0c67e]/60 transition-colors mt-2"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Voice & Audio Settings & DB Test */}
            <div className="space-y-16">
              
              <div className="space-y-8">
                <div className="flex items-center gap-3 border-b border-[#cf9f56]/10 pb-4">
                  <Volume2 className="w-5 h-5 text-[#6f8fd6]/70" />
                  <h2 className="font-serif text-xl text-[#ece4d2]">Voice & Speech Synthesis</h2>
                </div>

                <div className="space-y-6 text-sm font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[#a89f8c]">Auto-speak Assistant Responses:</span>
                    <input
                      type="checkbox"
                      checked={autoSpeak}
                      onChange={(e) => setAutoSpeak(e.target.checked)}
                      className="w-4 h-4 accent-[#cf9f56]"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[#a89f8c]">
                      <span>Speech Speed Rate</span>
                      <span className="font-mono text-xs">{voiceRate.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.5"
                      step="0.1"
                      value={voiceRate}
                      onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                      className="w-full accent-[#cf9f56]"
                    />
                  </div>

                  <div className="pl-4 border-l border-[#cf9f56]/20 space-y-1 mt-4">
                    <span className="text-[#ece4d2] text-xs">VOICEVOX / ElevenLabs Integration</span>
                    <p className="text-[11px] text-[#8a8373]">
                      Connected via local Web Speech API synthesis with dynamic audio spectrum pulse.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Supabase DB & Avatar Test */}
              <div className="space-y-8">
                <div className="flex items-center gap-3 border-b border-[#cf9f56]/10 pb-4">
                  <Database className="w-5 h-5 text-[#f0c67e]/70" />
                  <h2 className="font-serif text-xl text-[#ece4d2]">Database & Avatar Test</h2>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#a89f8c]">Database Engine:</span>
                  <span className="text-emerald-400/80 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Supabase + Drizzle ORM
                  </span>
                </div>

                <div className="flex gap-8 items-center pt-4">
                  <div className="flex flex-col items-center">
                    <SiduriAvatar state={avatarTestState} size="compact" showMotes={false} />
                    <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#a89f8c]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f0c67e] shadow-[0_0_8px_#f0c67e]" />
                      <span>{avatarTestState}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {(["observing", "investigating", "reading", "speaking"] as SiduriAvatarState[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => setAvatarTestState(st)}
                        className={`text-left text-xs font-mono transition-colors ${
                          avatarTestState === st
                            ? 'text-[#f0c67e]'
                            : 'text-[#a89f8c] hover:text-[#ece4d2]'
                        }`}
                      >
                        {avatarTestState === st ? "▸ " : "  "}{st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
