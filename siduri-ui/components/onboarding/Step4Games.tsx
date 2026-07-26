import { Plus, Trash2 } from 'lucide-react';

export function Step4Games({ data, updateData }: { data: any, updateData: (d: any) => void }) {
  const addGame = () => {
    updateData({
      ...data,
      games: [...data.games, { name: "", server: "", uid: "", currency: 0, pity: 0, reserve: 0 }]
    });
  };

  const removeGame = (index: number) => {
    const newGames = [...data.games];
    newGames.splice(index, 1);
    updateData({ ...data, games: newGames });
  };

  const updateGame = (index: number, key: string, value: string | number) => {
    const newGames = [...data.games];
    newGames[index][key] = value;
    updateData({ ...data, games: newGames });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="space-y-2">
        <h2 className="text-3xl font-light text-white tracking-tight">Games & Accounts</h2>
        <p className="text-zinc-400">Set the manual baseline. You'll discuss strategies and feelings through chat later.</p>
      </div>

      <div className="space-y-6 mt-8">
        {data.games.map((game: any, idx: number) => (
          <div key={idx} className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl space-y-4 relative group">
            <button 
              onClick={() => removeGame(idx)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="grid grid-cols-2 gap-4 pr-8">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Game Name</label>
                <input 
                  type="text" 
                  className="w-full bg-transparent border-b border-zinc-800 pb-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  value={game.name}
                  onChange={e => updateGame(idx, 'name', e.target.value)}
                  placeholder="e.g. Genshin Impact"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Server / UID</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="w-1/3 bg-transparent border-b border-zinc-800 pb-2 text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors"
                    value={game.server}
                    onChange={e => updateGame(idx, 'server', e.target.value)}
                    placeholder="Asia"
                  />
                  <input 
                    type="text" 
                    className="w-2/3 bg-transparent border-b border-zinc-800 pb-2 text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors"
                    value={game.uid}
                    onChange={e => updateGame(idx, 'uid', e.target.value)}
                    placeholder="800000000"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Currency</label>
                <input 
                  type="number" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={game.currency}
                  onChange={e => updateGame(idx, 'currency', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Current Pity</label>
                <input 
                  type="number" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={game.pity}
                  onChange={e => updateGame(idx, 'pity', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reserve Budget</label>
                <input 
                  type="number" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={game.reserve}
                  onChange={e => updateGame(idx, 'reserve', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={addGame}
          className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-400 hover:border-amber-500/50 hover:text-amber-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Game
        </button>
      </div>
    </div>
  );
}
