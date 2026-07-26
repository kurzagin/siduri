"use client";

import React, { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Brain, Plus, Search, Tag, Star, Trash2, Filter } from "lucide-react";

interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: "life_context" | "preference" | "content_strategy" | "project";
  tags: string[];
  importance: number; // 1-5
  date: string;
}

export default function MemoriesPage() {
  const [memoryList, setMemoryList] = useState<MemoryItem[]>([
    {
      id: "mem-1",
      title: "Master's Preferred Video Format",
      content: "Master Zagin prefers 9:16 vertical content with portrait layout, Venus core background, and gold subtitles for TikTok and YouTube Shorts.",
      category: "content_strategy",
      tags: ["tiktok", "shorts", "stage", "preset"],
      importance: 5,
      date: "2026-07-21",
    },
    {
      id: "mem-2",
      title: "Daily Morning Work Routine",
      content: "Deep focus block between 09:00 - 12:00. Siduri should synthesize daily script hooks and organize project priorities during this window.",
      category: "life_context",
      tags: ["schedule", "routine", "focus"],
      importance: 4,
      date: "2026-07-20",
    },
    {
      id: "mem-3",
      title: "Multi-Provider Preference",
      content: "Default to Gemini 2.5 Flash for rapid interactive voice chats, and switch to Claude 3.5 Sonnet for detailed long-form script drafting.",
      category: "preference",
      tags: ["gemini", "claude", "llm"],
      importance: 4,
      date: "2026-07-19",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryItem["category"]>("life_context");
  const [newTags, setNewTags] = useState("");
  const [newImportance, setNewImportance] = useState(3);

  const handleAddMemory = () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    const item: MemoryItem = {
      id: `mem-${Date.now()}`,
      title: newTitle,
      content: newContent,
      category: newCategory,
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      importance: newImportance,
      date: new Date().toISOString().split("T")[0],
    };

    setMemoryList((prev) => [item, ...prev]);
    setNewTitle("");
    setNewContent("");
    setNewTags("");
    setShowAddForm(false);
  };

  const handleDeleteMemory = (id: string) => {
    setMemoryList((prev) => prev.filter((m) => m.id !== id));
  };

  const filteredMemories = memoryList.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#07060a]">
      <SideNav />

      <main className="relative flex-1 overflow-y-auto flex flex-col p-6 md:p-10 text-[#ece4d2]">
        <CosmicBackground parallaxX={0} parallaxY={0} />

        <div className="relative z-10 max-w-6xl w-full mx-auto space-y-12">
          
          {/* Banner Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#cf9f56]/15 pb-6">
            <div className="flex items-center gap-4">
              <div className="text-[#f0c67e]">
                <Brain className="w-8 h-8 opacity-80" />
              </div>
              <div>
                <h1 className="font-serif text-3xl md:text-4xl text-[#ece4d2] tracking-wide">
                  Memory Vault
                </h1>
                <p className="font-mono text-xs text-[#a89f8c] mt-1">
                  Long-term knowledge retention, preferences, and semantic context store
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 text-[#a89f8c] hover:text-[#f0c67e] transition-colors font-mono text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Memory</span>
            </button>
          </div>

          {/* Add Memory Form */}
          {showAddForm && (
            <div className="border border-[#cf9f56]/15 bg-[#0a090e]/40 p-6 space-y-4 animate-fadeIn">
              <h3 className="font-serif text-lg text-[#ece4d2]">Synthesize New Memory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Memory Title..."
                  className="bg-transparent border-b border-[#cf9f56]/20 pb-2 text-[#ece4d2] font-mono text-xs outline-none focus:border-[#f0c67e]/60 transition-colors"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryItem["category"])}
                  className="bg-transparent border-b border-[#cf9f56]/20 pb-2 text-[#a89f8c] font-mono text-xs outline-none focus:border-[#f0c67e]/60 transition-colors [&>option]:bg-[#0a090e]"
                >
                  <option value="life_context">Life Context & Routine</option>
                  <option value="preference">User Preference</option>
                  <option value="content_strategy">Content Strategy</option>
                  <option value="project">Project Note</option>
                </select>
              </div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Detailed memory content or factual knowledge..."
                rows={3}
                className="w-full bg-transparent border-b border-[#cf9f56]/20 pb-2 text-[#ece4d2] font-mono text-xs outline-none focus:border-[#f0c67e]/60 transition-colors mt-4"
              />
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Tags (comma separated)..."
                  className="flex-1 bg-transparent border-b border-[#cf9f56]/20 pb-2 text-[#ece4d2] font-mono text-xs outline-none focus:border-[#f0c67e]/60 transition-colors min-w-[200px]"
                />
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[#a89f8c]">Importance:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setNewImportance(num)}
                        className={`text-lg leading-none ${newImportance >= num ? "text-[#f0c67e]" : "text-[#5c5749]"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleAddMemory}
                  className="text-[#f0c67e] hover:text-[#ece4d2] text-xs font-mono transition-colors"
                >
                  Save Memory
                </button>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-[#cf9f56]/10 pb-6">
            <div className="flex items-center gap-3 flex-1 max-w-md border-b border-[#cf9f56]/20 pb-2 focus-within:border-[#f0c67e]/60 transition-colors">
              <Search className="w-4 h-4 text-[#a89f8c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories by keyword or tag..."
                className="w-full bg-transparent text-xs font-mono text-[#ece4d2] outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
              <span className="text-[#a89f8c] flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" /> Filter:</span>
              <div className="flex gap-2">
                {["all", "life_context", "preference", "content_strategy", "project"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`capitalize transition-colors ${
                      selectedCategory === cat
                        ? "text-[#f0c67e]"
                        : "text-[#5c5749] hover:text-[#a89f8c]"
                    }`}
                  >
                    {cat.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Memory List */}
          <div className="flex flex-col gap-10">
            {filteredMemories.map((mem) => (
              <div key={mem.id} className="group relative flex flex-col gap-4 pb-10 border-b border-[#cf9f56]/10 last:border-0 transition-all">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#cf9f56]">
                        {mem.category.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-[#5c5749]">•</span>
                      <div className="flex items-center gap-0.5 text-[10px] text-[#f0c67e]/80">
                        {Array.from({ length: mem.importance }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>

                    <h3 className="font-serif text-2xl text-[#ece4d2] group-hover:text-[#f0c67e] transition-colors">
                      {mem.title}
                    </h3>
                    <p className="text-sm text-[#a89f8c] leading-relaxed mt-2 font-sans max-w-3xl">
                      {mem.content}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {mem.tags.map((t) => (
                        <span key={t} className="text-[11px] font-mono text-[#6f8fd6]/80">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="text-[#5c5749] hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
