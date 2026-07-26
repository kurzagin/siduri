export function Step1Profile({ data, updateData }: { data: any, updateData: (d: any) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-light text-white tracking-tight">Who are you?</h2>
        <p className="text-zinc-400">Let's establish the baseline facts so Siduri never has to guess.</p>
      </div>

      <div className="space-y-4 mt-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Display Name (Public)</label>
          <input 
            type="text" 
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            value={data.displayName}
            onChange={e => updateData({ ...data, displayName: e.target.value })}
            placeholder="e.g. Zagin"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Real Name (Private)</label>
          <input 
            type="text" 
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            value={data.realName || ''}
            onChange={e => updateData({ ...data, realName: e.target.value })}
            placeholder="e.g. John Doe"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Nickname (What Siduri calls you)</label>
          <input 
            type="text" 
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            value={data.nickname || ''}
            onChange={e => updateData({ ...data, nickname: e.target.value })}
            placeholder="e.g. Master, Boss"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Timezone</label>
          <select 
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all appearance-none"
            value={data.timezone}
            onChange={e => updateData({ ...data, timezone: e.target.value })}
          >
            <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Primary Language</label>
          <input 
            type="text" 
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            value={data.language}
            onChange={e => updateData({ ...data, language: e.target.value })}
            placeholder="e.g. English, Indonesian"
          />
        </div>
      </div>
    </div>
  );
}
