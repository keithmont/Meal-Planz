import React from 'react';
import { AlertCircle, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Allergy } from '../types';

interface AllergySectionProps {
  allergies: Allergy[];
  collapsed: boolean;
  toggleSection: () => void;
  newAllergy: string;
  setNewAllergy: (val: string) => void;
  addAllergy: () => void;
  removeAllergy: (id: string) => void;
}

export const AllergySection: React.FC<AllergySectionProps> = ({
  allergies,
  collapsed,
  toggleSection,
  newAllergy,
  setNewAllergy,
  addAllergy,
  removeAllergy
}) => {
  return (
    <section className="bg-white rounded-none shadow-none border-4 border-black overflow-hidden">
      <button 
        onClick={toggleSection}
        className="w-full flex items-center justify-between p-6 hover:bg-orange-50 transition-colors border-b-4 border-black"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-black uppercase tracking-tighter">Allergies & Dislikes</h2>
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
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                placeholder="Add allergy (e.g. Peanuts)"
                className="flex-1 px-4 py-3 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-orange-50 font-bold"
              />
              <button 
                onClick={addAllergy}
                className="p-3 bg-black text-white hover:bg-orange-500 rounded-none transition-colors border-2 border-black"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.map(allergy => (
                <div key={allergy.id} className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-none border-2 border-black">
                  <span className="text-xs font-bold uppercase tracking-widest">{allergy.ingredient}</span>
                  <button onClick={() => removeAllergy(allergy.id)} className="text-orange-500 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {allergies.length === 0 && <p className="text-xs text-slate-400 italic">No allergies listed.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
