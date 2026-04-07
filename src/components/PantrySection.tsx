import React from 'react';
import { CookingPot, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PantryItem } from '../types';

interface PantrySectionProps {
  pantry: PantryItem[];
  collapsed: boolean;
  toggleSection: () => void;
  newPantryItem: string;
  setNewPantryItem: (val: string) => void;
  addPantry: () => void;
  removePantry: (id: string) => void;
}

export const PantrySection: React.FC<PantrySectionProps> = ({
  pantry,
  collapsed,
  toggleSection,
  newPantryItem,
  setNewPantryItem,
  addPantry,
  removePantry
}) => {
  return (
    <section className="bg-white rounded-none shadow-none border-4 border-black overflow-hidden">
      <button 
        onClick={toggleSection}
        className="w-full flex items-center justify-between p-6 hover:bg-amber-50 transition-colors border-b-4 border-black"
      >
        <div className="flex items-center gap-2">
          <CookingPot className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-black uppercase tracking-tighter">Pantry Basics</h2>
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
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPantryItem}
                onChange={(e) => setNewPantryItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPantry()}
                placeholder="Add pantry item (e.g. Olive Oil)"
                className="flex-1 px-4 py-3 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-amber-50 font-bold"
              />
              <button 
                onClick={addPantry}
                className="p-3 bg-black text-white hover:bg-amber-500 rounded-none transition-colors border-2 border-black"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {pantry.map(item => (
                <div key={item.id} className="flex items-center justify-between group bg-white px-4 py-3 rounded-none border-2 border-black hover:bg-slate-50 transition-all">
                  <span className="font-bold">{item.name}</span>
                  <button onClick={() => removePantry(item.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {pantry.length === 0 && <p className="text-sm text-slate-400 italic font-bold">No items in pantry.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
