import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface ProteinSectionProps {
  proteinPreferences: Record<string, number>;
  setProteinPreferences: (val: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
}

export const ProteinSection: React.FC<ProteinSectionProps> = ({
  proteinPreferences,
  setProteinPreferences
}) => {
  const updateProtein = (protein: string, delta: number) => {
    setProteinPreferences(prev => ({
      ...prev,
      [protein]: Math.max(0, prev[protein] + delta)
    }));
  };

  const setProtein = (protein: string, val: number) => {
    setProteinPreferences(prev => ({
      ...prev,
      [protein]: Math.max(0, val)
    }));
  };

  return (
    <section className="bg-white rounded-none shadow-none border-4 border-black overflow-hidden">
      <div className="p-6 border-b-4 border-black bg-rose-50">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-rose-500" />
          <h2 className="text-xl font-black uppercase tracking-tighter">Proteins</h2>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {Object.entries(proteinPreferences).map(([protein, count]) => (
          <div key={protein} className="flex items-center justify-between gap-4">
            <label className="text-sm font-black uppercase tracking-widest text-black flex-1">
              {protein}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateProtein(protein, -1)}
                className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-rose-100 transition-colors font-black"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={count}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setProtein(protein, val);
                }}
                className="w-12 text-center py-1 bg-white border-2 border-black font-bold focus:outline-none focus:bg-rose-50"
              />
              <button
                onClick={() => updateProtein(protein, 1)}
                className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-rose-100 transition-colors font-black"
              >
                +
              </button>
            </div>
          </div>
        ))}
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-2 border-t-2 border-slate-100 italic">
          Total meals to generate: {(Object.values(proteinPreferences) as number[]).reduce((a, b) => a + b, 0)}
        </p>
      </div>
    </section>
  );
};
