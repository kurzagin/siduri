export function Step5Permissions({ data, updateData }: { data: any, updateData: (d: any) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-light text-white tracking-tight">Stream Permissions</h2>
        <p className="text-zinc-400">Set the absolute rules for Siduri during live broadcasting.</p>
      </div>

      <div className="space-y-6 mt-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Donation TTS Threshold ($)</label>
          <input 
            type="number" 
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            value={data.streamRules.donationThreshold}
            onChange={e => updateData({ ...data, streamRules: { ...data.streamRules, donationThreshold: parseInt(e.target.value) || 0 } })}
            placeholder="e.g. 5"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-zinc-200">Auto-Answer Chat</h4>
            <p className="text-xs text-zinc-500">Can Siduri reply to random chat messages without you asking?</p>
          </div>
          <button 
            onClick={() => updateData({ ...data, streamRules: { ...data.streamRules, autoAnswerChat: !data.streamRules.autoAnswerChat } })}
            className={`w-12 h-6 rounded-full transition-colors relative ${data.streamRules.autoAnswerChat ? 'bg-amber-500' : 'bg-zinc-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${data.streamRules.autoAnswerChat ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Blocked Topics (Blacklist)</label>
          <textarea 
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all min-h-[100px]"
            value={data.streamRules.blockedTopics.join(", ")}
            onChange={e => updateData({ 
              ...data, 
              streamRules: { 
                ...data.streamRules, 
                blockedTopics: e.target.value.split(",").map(s => s.trim()).filter(s => s) 
              } 
            })}
            placeholder="e.g. Politics, specific games, personal info (comma separated)"
          />
        </div>
      </div>
    </div>
  );
}
