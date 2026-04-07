import React from 'react';
import { Globe, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Source } from '../types';

interface SourceSectionProps {
  sources: Source[];
  collapsed: boolean;
  toggleSection: () => void;
  newSourceName: string;
  setNewSourceName: (val: string) => void;
  newSourceUrl: string;
  setNewSourceUrl: (val: string) => void;
  addSource: () => void;
  removeSource: (id: string) => void;
  quickAddSource: (name: string, url: string) => void;
}

export const SourceSection: React.FC<SourceSectionProps> = ({
  sources,
  collapsed,
  toggleSection,
  newSourceName,
  setNewSourceName,
  newSourceUrl,
  setNewSourceUrl,
  addSource,
  removeSource,
  quickAddSource
}) => {
  const quickAddOptions = [
    { name: 'Bon Apetite', url: 'https://www.bonappetit.com/recipes' },
    { name: 'Food Wishes', url: 'https://foodwishes.blogspot.com/' },
    { name: 'Serious Eats', url: 'https://www.seriouseats.com/recipes-by-course-5117906' },
    { name: 'Budget Bytes', url: 'https://www.budgetbytes.com/category/recipes/' },
    { name: 'Hello Fresh', url: 'https://www.hellofresh.com/recipes' },
    { name: 'Blue Apron', url: 'https://www.blueapron.com/cookbook' },
    { name: 'Americas Test Kitchen', url: 'https://www.americastestkitchen.com/recipes' },
    { name: 'NYT Cooking', url: 'https://cooking.nytimes.com/topics/dinner-recipes' },
    { name: 'Whole30', url: 'https://whole30.com/recipes' },
    { name: 'Jenn Eats Goood', url: 'https://jenneatsgoood.com/recipes/' }
  ];

  return (
    <section className="bg-white rounded-none shadow-none border-4 border-black overflow-hidden">
      <button 
        onClick={toggleSection}
        className="w-full flex items-center justify-between p-6 hover:bg-blue-50 transition-colors border-b-4 border-black"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-black uppercase tracking-tighter">Recipe Sources</h2>
        </div>
        <ChevronDown className={`w-6 h-6 text-black transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pt-6 pb-6"
          >
            <div className="space-y-2 mb-4">
              <input
                type="text"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="Source Name (e.g. NYT Cooking)"
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-blue-50 font-bold"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSource()}
                  placeholder="Website URL"
                  className="flex-1 px-4 py-3 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-blue-50 font-bold"
                />
                <button 
                  onClick={addSource}
                  className="p-3 bg-black text-white hover:bg-blue-500 rounded-none transition-colors border-2 border-black"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider w-full">Quick Add:</span>
              {quickAddOptions.map(qa => {
                const isActive = sources.some(s => s.url === qa.url);
                return (
                  <button 
                    key={qa.url}
                    onClick={() => quickAddSource(qa.name, qa.url)}
                    className={`text-[10px] px-3 py-1 rounded-none border-2 border-black transition-all font-black uppercase tracking-widest ${
                      isActive 
                        ? 'bg-sky-400 text-black' 
                        : 'bg-white text-black hover:bg-sky-400 hover:text-black'
                    }`}
                  >
                    {qa.name}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {sources
                .filter(source => !quickAddOptions.map(o => o.url).includes(source.url))
                .map(source => (
                <div key={source.id} className="flex items-center justify-between group bg-white px-4 py-3 rounded-none border-2 border-black hover:bg-slate-50 transition-all">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{source.name}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{source.url}</span>
                  </div>
                  <button onClick={() => removeSource(source.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {sources.length === 0 && <p className="text-xs text-slate-400 italic">No sources added.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
