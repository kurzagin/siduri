"use client";

import React, { useState, useEffect, useRef } from "react";
import { SideNav } from "@/components/SideNav";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Layers, Check, Eye, EyeOff, Link } from "lucide-react";

export default function OverlayDashboardPage() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Track visibility of each layer (like OBS sources)
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({
    base: true,
    siduri: true,
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.4);

  const sources = [
    {
      id: "base",
      name: "Base UI Frame",
      description: "Includes the decorative frames, context strips, and subtitles.",
      url: "/overlay/source?layer=base",
    },
    {
      id: "siduri",
      name: "Siduri Avatar",
      description: "Includes only the Venus avatar and its status text block.",
      url: "/overlay/source?layer=siduri",
    }
  ];

  const handleCopy = (link: string) => {
    const fullLink = `${window.location.origin}${link}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const toggleLayer = (id: string) => {
    setVisibleLayers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Dynamically calculate the scale needed to fit a 1920x1080 iframe 
    // inside our responsive container.
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setPreviewScale(entry.contentRect.width / 1920);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#07060a]">
      <SideNav />

      <main className="relative flex-1 overflow-y-auto flex flex-col p-6 md:p-10 text-[#ece4d2]">
        <CosmicBackground parallaxX={0} parallaxY={0} />

        <div className="relative z-10 max-w-6xl w-full mx-auto space-y-10">
          
          {/* Banner Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#cf9f56]/15 pb-6">
            <div className="flex items-center gap-4">
              <div className="text-[#f0c67e]">
                <Layers className="w-8 h-8 opacity-80" />
              </div>
              <div>
                <h1 className="font-serif text-3xl md:text-4xl text-[#ece4d2] tracking-wide">
                  OBS Scene Preview
                </h1>
                <p className="font-mono text-xs text-[#a89f8c] mt-1">
                  Manage your browser sources and preview how they stack together
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Left Side: OBS Sources List */}
            <div className="w-full lg:w-1/3 flex flex-col gap-2">
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#5c5749] mb-2 px-2 flex justify-between">
                <span>Sources</span>
                <span>Vis / Link</span>
              </div>
              
              <div className="border border-[#cf9f56]/15 bg-[#0a090e]/60 flex flex-col">
                {sources.map((source) => {
                  const isVisible = visibleLayers[source.id];
                  return (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-4 border-b border-[#cf9f56]/10 last:border-0 hover:bg-[#cf9f56]/10 transition-colors"
                    >
                      <div>
                        <h3 className={`font-serif text-lg ${isVisible ? "text-[#ece4d2]" : "text-[#5c5749]"}`}>
                          {source.name}
                        </h3>
                        <p className="text-[10px] text-[#a89f8c] font-mono mt-1 opacity-70">
                          {source.url.split('?')[1]}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleLayer(source.id)}
                          className={`p-2 transition-colors ${isVisible ? "text-[#f0c67e]" : "text-[#5c5749] hover:text-[#a89f8c]"}`}
                          title={isVisible ? "Hide in Preview" : "Show in Preview"}
                        >
                          {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>

                        <button
                          onClick={() => handleCopy(source.url)}
                          className={`p-2 transition-colors ${copiedLink === source.url ? "text-emerald-400" : "text-[#a89f8c] hover:text-[#f0c67e]"}`}
                          title="Copy OBS Link"
                        >
                          {copiedLink === source.url ? <Check className="w-5 h-5" /> : <Link className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side: OBS Preview Canvas */}
            <div className="w-full lg:w-2/3 flex flex-col gap-4">
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#5c5749] mb-2">
                Live Canvas Preview
              </div>
              
              <div 
                ref={containerRef}
                className="relative w-full aspect-video border-2 border-[#cf9f56]/30 bg-black overflow-hidden shadow-2xl shadow-[#cf9f56]/5"
              >
                {/* 1920x1080 fixed container scaled down via React ResizeObserver */}
                <div 
                  className="absolute top-0 left-0 origin-top-left w-[1920px] h-[1080px]"
                  style={{ transform: `scale(${previewScale})` }}
                >
                  {sources.map(source => (
                    <iframe 
                      key={source.id}
                      src={source.url} 
                      className={`absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-300 ${visibleLayers[source.id] ? "opacity-100" : "opacity-0"}`}
                      title={`${source.name} Preview`}
                    />
                  ))}
                </div>

                <div className="absolute inset-0 z-10 pointer-events-none"></div> 
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
