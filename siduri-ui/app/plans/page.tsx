"use client";

import React, { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { CosmicBackground } from "@/components/CosmicBackground";
import { CalendarCheck, Plus, CheckCircle, Circle, Clock, Tag, Sparkles } from "lucide-react";

interface PlanItem {
  id: string;
  title: string;
  category: "routine" | "task" | "goal" | "event";
  dueDate: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
}

export default function PlansPage() {
  const [plansList, setPlansList] = useState<PlanItem[]>([
    {
      id: "plan-1",
      title: "Review TikTok Vertical Content Performance",
      category: "routine",
      dueDate: "Today, 10:00 AM",
      priority: "high",
      completed: false,
    },
    {
      id: "plan-2",
      title: "Record Siduri Stage Announcement Video",
      category: "task",
      dueDate: "Today, 02:00 PM",
      priority: "high",
      completed: false,
    },
    {
      id: "plan-3",
      title: "Configure Supabase DB Table Migrations",
      category: "task",
      dueDate: "Today, 05:00 PM",
      priority: "medium",
      completed: true,
    },
    {
      id: "plan-4",
      title: "Synthesize Monthly Life Goals with Siduri",
      category: "goal",
      dueDate: "End of Week",
      priority: "medium",
      completed: false,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<PlanItem["category"]>("task");
  const [newPriority, setNewPriority] = useState<PlanItem["priority"]>("medium");
  const [newDueDate, setNewDueDate] = useState("Today");

  const toggleCompleted = (id: string) => {
    setPlansList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, completed: !p.completed } : p))
    );
  };

  const handleAddPlan = () => {
    if (!newTitle.trim()) return;
    const item: PlanItem = {
      id: `plan-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      dueDate: newDueDate,
      priority: newPriority,
      completed: false,
    };
    setPlansList((prev) => [...prev, item]);
    setNewTitle("");
    setShowAddForm(false);
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
              <div className="text-[#f0c67e]">
                <CalendarCheck className="w-8 h-8 opacity-80" />
              </div>
              <div>
                <h1 className="font-serif text-3xl md:text-4xl text-[#ece4d2] tracking-wide">
                  Plans & Routines
                </h1>
                <p className="font-mono text-xs text-[#a89f8c] mt-1">
                  Organize daily routines, priority goals, & automated reminders with Siduri
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 text-[#a89f8c] hover:text-[#f0c67e] transition-colors font-mono text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Plan / Routine</span>
            </button>
          </div>

          {/* Add Plan Form */}
          {showAddForm && (
            <div className="border border-[#cf9f56]/15 bg-[#0a090e]/40 p-6 space-y-4 animate-fadeIn">
              <h3 className="font-serif text-lg text-[#ece4d2]">Add New Life Assistant Task</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task or Routine Title..."
                  className="bg-transparent border-b border-[#cf9f56]/20 pb-2 text-[#ece4d2] font-mono text-xs outline-none focus:border-[#f0c67e]/60 transition-colors col-span-2"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as PlanItem["category"])}
                  className="bg-transparent border-b border-[#cf9f56]/20 pb-2 text-[#a89f8c] font-mono text-xs outline-none focus:border-[#f0c67e]/60 transition-colors [&>option]:bg-[#0a090e]"
                >
                  <option value="routine">Daily Routine</option>
                  <option value="task">Single Task</option>
                  <option value="goal">Long-term Goal</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <input
                  type="text"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  placeholder="Due Date / Time..."
                  className="bg-transparent border-b border-[#cf9f56]/20 pb-2 text-[#ece4d2] font-mono text-xs outline-none focus:border-[#f0c67e]/60 transition-colors w-48"
                />
                <div className="flex items-center gap-4 font-mono text-xs">
                  <span className="text-[#a89f8c]">Priority:</span>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className={`capitalize transition-colors ${
                          newPriority === p
                            ? "text-[#f0c67e]"
                            : "text-[#5c5749] hover:text-[#a89f8c]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleAddPlan}
                  className="text-[#f0c67e] hover:text-[#ece4d2] text-xs font-mono transition-colors"
                >
                  Save Plan
                </button>
              </div>
            </div>
          )}

          {/* Plan List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#cf9f56]/15 pb-4">
              <span className="font-serif text-xl text-[#ece4d2]">Scheduled Items</span>
              <span className="font-mono text-xs text-[#5c5749]">
                {plansList.filter((p) => p.completed).length} / {plansList.length} Completed
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {plansList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCompleted(item.id)}
                  className={`group relative flex items-center justify-between py-4 border-b border-[#cf9f56]/10 last:border-0 transition-all cursor-pointer ${
                    item.completed ? "opacity-40" : "hover:border-[#cf9f56]/30"
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <button className="text-[#f0c67e] transition-colors group-hover:text-[#ece4d2]">
                      {item.completed ? (
                        <CheckCircle className="w-6 h-6 text-emerald-400/80" />
                      ) : (
                        <Circle className="w-6 h-6 text-[#5c5749] group-hover:text-[#a89f8c]" />
                      )}
                    </button>
                    <div>
                      <span
                        className={`font-serif text-xl block transition-colors ${
                          item.completed ? "line-through text-[#8a8373]" : "text-[#ece4d2] group-hover:text-[#f0c67e]"
                        }`}
                      >
                        {item.title}
                      </span>
                      <div className="flex items-center gap-3 font-mono text-[10px] text-[#5c5749] mt-2">
                        <span className="uppercase text-[#cf9f56] tracking-wider">{item.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-[#a89f8c]">
                          <Clock className="w-3.5 h-3.5 text-[#6f8fd6]/80" /> {item.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider ${
                      item.priority === "high"
                        ? "text-red-400/80"
                        : item.priority === "medium"
                        ? "text-[#cf9f56]"
                        : "text-[#5c5749]"
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
