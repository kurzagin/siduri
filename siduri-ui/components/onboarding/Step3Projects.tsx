import { Plus, Trash2 } from 'lucide-react';

export function Step3Projects({ data, updateData }: { data: any, updateData: (d: any) => void }) {
  const addProject = () => {
    updateData({
      ...data,
      projects: [...data.projects, { name: "", summary: "", status: "active", priorities: [] }]
    });
  };

  const removeProject = (index: number) => {
    const newProjects = [...data.projects];
    newProjects.splice(index, 1);
    updateData({ ...data, projects: newProjects });
  };

  const updateProject = (index: number, key: string, value: string) => {
    const newProjects = [...data.projects];
    newProjects[index][key] = value;
    updateData({ ...data, projects: newProjects });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-light text-white tracking-tight">Your Projects</h2>
        <p className="text-zinc-400">Core facts about what you're building. Siduri will learn the rest through chatting.</p>
      </div>

      <div className="space-y-6 mt-8">
        {data.projects.map((proj: any, idx: number) => (
          <div key={idx} className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl space-y-4 relative group">
            <button 
              onClick={() => removeProject(idx)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="space-y-2 pr-8">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Project Name</label>
              <input 
                type="text" 
                className="w-full bg-transparent border-b border-zinc-800 pb-2 text-white text-lg focus:outline-none focus:border-amber-500 transition-colors"
                value={proj.name}
                onChange={e => updateProject(idx, 'name', e.target.value)}
                placeholder="e.g. Siduri App"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Brief Summary</label>
              <input 
                type="text" 
                className="w-full bg-transparent border-b border-zinc-800 pb-2 text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors"
                value={proj.summary}
                onChange={e => updateProject(idx, 'summary', e.target.value)}
                placeholder="An AI assistant tailored to my workflow"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</label>
              <select 
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                value={proj.status}
                onChange={e => updateProject(idx, 'status', e.target.value)}
              >
                <option value="idea">Idea</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>
        ))}

        <button 
          onClick={addProject}
          className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-400 hover:border-amber-500/50 hover:text-amber-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Project
        </button>
      </div>
    </div>
  );
}
