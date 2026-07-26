"use client";

import React, { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Plug, Video, Tv, Mic, Radio, MessageCircle, Webhook, CheckCircle2, XCircle } from "lucide-react";

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  connected: boolean;
  endpointUrl?: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    {
      id: "youtube",
      name: "YouTube Shorts & Live",
      category: "Streaming & Content",
      description: "Direct stream output & vertical short-form publishing hook.",
      icon: Video,
      connected: true,
      endpointUrl: "rtmp://a.rtmp.youtube.com/live2",
    },
    {
      id: "twitch",
      name: "Twitch Livestream Overlay",
      category: "Streaming",
      description: "OBS Browser Source integration with live chat subtitle sync.",
      icon: Tv,
      connected: true,
      endpointUrl: "http://localhost:3000/overlay",
    },
    {
      id: "tiktok",
      name: "TikTok Creator Stage",
      category: "Vertical Video",
      description: "Vertical presenter mode presets with live comment stream connector.",
      icon: Radio,
      connected: true,
      endpointUrl: "http://localhost:3000/stage?scene=intro",
    },
    {
      id: "voicevox",
      name: "VOICEVOX Engine",
      category: "Voice TTS",
      description: "Local open-source Japanese speech synthesis engine integration.",
      icon: Mic,
      connected: false,
      endpointUrl: "http://127.0.0.1:50021",
    },
    {
      id: "elevenlabs",
      name: "ElevenLabs Voice API",
      category: "Voice TTS",
      description: "High-fidelity expressive AI voice generation for Siduri avatar.",
      icon: Mic,
      connected: false,
    },
    {
      id: "discord",
      name: "Discord Webhook Bot",
      category: "Community & Notifications",
      description: "Post stream announcements and daily routine reminders to Discord.",
      icon: MessageCircle,
      connected: true,
      endpointUrl: "https://discord.com/api/webhooks/...",
    },
  ]);

  const toggleConnection = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, connected: !item.connected } : item))
    );
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#07060a]">
      <SideNav />

      <main className="relative flex-1 overflow-y-auto flex flex-col p-6 md:p-10 text-[#ece4d2]">
        <CosmicBackground parallaxX={0} parallaxY={0} />

        <div className="relative z-10 max-w-6xl w-full mx-auto space-y-12">
          
          {/* Banner Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#cf9f56]/15 pb-6">
            <div className="flex items-center gap-4">
              <div className="text-[#6f8fd6]">
                <Plug className="w-8 h-8 opacity-80" />
              </div>
              <div>
                <h1 className="font-serif text-3xl md:text-4xl text-[#ece4d2] tracking-wide">
                  Integrations Hub
                </h1>
                <p className="font-mono text-xs text-[#a89f8c] mt-1">
                  Connect Siduri with OBS, TikTok, YouTube, VOICEVOX, ElevenLabs, & Webhooks
                </p>
              </div>
            </div>
          </div>

          {/* Integrations List */}
          <div className="flex flex-col gap-10">
            {integrations.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col gap-4 pb-10 border-b border-[#cf9f56]/10 last:border-0 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-6">
                      <div className="mt-1 text-[#f0c67e] opacity-80">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-[10px] text-[#cf9f56] uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl text-[#ece4d2] group-hover:text-[#f0c67e] transition-colors">{item.name}</h3>
                        <p className="text-sm text-[#a89f8c] mt-2 font-sans max-w-2xl leading-relaxed">{item.description}</p>
                        
                        {item.endpointUrl && (
                          <div className="mt-4 font-mono text-[11px] text-[#5c5749] flex items-center gap-2">
                            <span className="uppercase text-[#a89f8c]">Endpoint:</span> 
                            {item.endpointUrl}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[120px]">
                      <div
                        className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                          item.connected
                            ? "text-emerald-400/80"
                            : "text-[#5c5749]"
                        }`}
                      >
                        {item.connected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Disconnected
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => toggleConnection(item.id)}
                        className={`text-xs font-mono transition-colors mt-2 ${
                          item.connected
                            ? "text-red-400/60 hover:text-red-400"
                            : "text-[#a89f8c] hover:text-[#f0c67e]"
                        }`}
                      >
                        {item.connected ? "Disconnect" : "Configure & Connect"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}
