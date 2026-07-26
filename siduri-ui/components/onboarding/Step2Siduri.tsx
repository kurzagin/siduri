export function Step2Siduri({ data, updateData }: { data: any, updateData: (d: any) => void }) {
  
  const updateScenario = (key: string, val: string) => {
    updateData({ ...data, scenarios: { ...data.scenarios, [key]: val } });
  }

  const renderScenario = (key: string, title: string, options: string[]) => {
    const currentVal = data.scenarios?.[key] || '';
    const isCustom = currentVal !== '' && currentVal !== 'custom_placeholder' && !options.includes(currentVal);
    const selectedRadio = isCustom ? 'custom' : (currentVal === 'custom_placeholder' ? 'custom' : currentVal);

    return (
      <div className="space-y-3 p-5 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl">
        <h3 className="text-zinc-200 font-medium">{title}</h3>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {options.map(opt => (
            <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedRadio === opt ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
              <input type="radio" name={key} value={opt} checked={selectedRadio === opt} onChange={(e) => updateScenario(key, e.target.value)} className="hidden" />
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedRadio === opt ? 'border-amber-500' : 'border-zinc-600'}`}>
                {selectedRadio === opt && <div className="w-2 h-2 rounded-full bg-amber-500" />}
              </div>
              <span className="text-sm">{opt}</span>
            </label>
          ))}
          
          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedRadio === 'custom' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
            <input type="radio" name={key} value="custom" checked={selectedRadio === 'custom'} onChange={() => updateScenario(key, 'custom_placeholder')} className="hidden" />
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedRadio === 'custom' ? 'border-amber-500' : 'border-zinc-600'}`}>
              {selectedRadio === 'custom' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
            </div>
            <span className="text-sm">Custom...</span>
          </label>
        </div>

        {selectedRadio === 'custom' && (
          <input 
            type="text" 
            className="w-full mt-3 bg-zinc-950 border border-amber-500/50 rounded-xl px-4 py-3 text-amber-100 focus:outline-none text-sm"
            value={isCustom ? currentVal : ''}
            onChange={(e) => updateScenario(key, e.target.value)}
            placeholder="What should Siduri do?"
            autoFocus
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="space-y-2">
        <h2 className="text-3xl font-light text-white tracking-tight">Teach Siduri</h2>
        <p className="text-zinc-400">Describe her behavior in specific scenarios rather than checking generic personality boxes.</p>
      </div>

      <div className="space-y-6 mt-8">
        
        {renderScenario(
          "spending", 
          "💸 Master just spent 28,800 gems. What should Siduri do?", 
          ["Congratulate", "Worry", "Roast", "Stay silent"]
        )}

        {renderScenario(
          "bossFight", 
          "🎮 Boss Fight: Master hasn't spoken for 4 minutes.", 
          ["Fill the silence", "Talk with chat", "Wait", "Encourage"]
        )}

        {renderScenario(
          "chatSkillIssue", 
          "😂 Chat says: \"Skill issue.\" Siduri should...", 
          ["Agree", "Defend Master", "Roast both", "Ignore"]
        )}

        <div className="p-5 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl space-y-3 mt-8">
          <h3 className="text-zinc-200 font-medium">The Core Definition</h3>
          <p className="text-xs text-zinc-500">Write one sentence that perfectly captures Siduri.</p>
          <textarea 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all min-h-[80px]"
            value={data.coreSentence || ''}
            onChange={e => updateData({ ...data, coreSentence: e.target.value })}
            placeholder="e.g. An AI who calmly documents Master's questionable decisions while trying—often unsuccessfully—to keep him out of trouble."
          />
        </div>

      </div>
    </div>
  );
}
