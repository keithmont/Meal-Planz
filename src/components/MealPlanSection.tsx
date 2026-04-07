import React from 'react';
import { Calendar, Clock, Globe, Search, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { MealPlanItem } from '../types';

interface MealPlanSectionProps {
  mealPlan: MealPlanItem[];
  markMealAsCooked: (meal: MealPlanItem) => void;
  markMealAsNotCooked: (meal: MealPlanItem) => void;
  updateMealPlannedAt: (meal: MealPlanItem, date: string) => void;
}

export const MealPlanSection: React.FC<MealPlanSectionProps> = ({
  mealPlan,
  markMealAsCooked,
  markMealAsNotCooked,
  updateMealPlannedAt
}) => {
  const currentMeals = mealPlan.filter(m => m.is_current);
  const previousMeals = mealPlan.filter(m => !m.is_current).slice(0, 10);

  return (
    <div className="space-y-12">
      {/* Current Plan */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 border-4 border-black flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Current Plan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentMeals.map((meal, i) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black uppercase tracking-tight leading-tight">{meal.name}</h3>
                <div className="flex flex-col items-end gap-2">
                  <input
                    type="date"
                    value={meal.planned_at ? new Date(meal.planned_at).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateMealPlannedAt(meal, e.target.value)}
                    className="text-[10px] font-black uppercase tracking-widest border-2 border-black px-2 py-1 focus:outline-none focus:bg-emerald-50"
                  />
                </div>
              </div>
              
              <p className="text-sm text-slate-600 mb-6 flex-grow">{meal.description}</p>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Clock className="w-3 h-3" />
                  {meal.prepTime} + {meal.cookTime}
                </div>
                {meal.sourceUrl && (
                  <a 
                    href={meal.sourceUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:underline"
                  >
                    <Globe className="w-3 h-3" />
                    Recipe
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => markMealAsCooked(meal)}
                  className="flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white font-black uppercase tracking-widest text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Cooked
                </button>
                <button
                  onClick={() => markMealAsNotCooked(meal)}
                  className="flex items-center justify-center gap-2 py-3 bg-white text-black font-black uppercase tracking-widest text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                  Skip
                </button>
              </div>
            </motion.div>
          ))}
          {currentMeals.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white border-4 border-dashed border-slate-200">
              <p className="text-slate-400 font-black uppercase tracking-widest">No active meal plan. Go to Home to generate one!</p>
            </div>
          )}
        </div>
      </section>

      {/* History */}
      {previousMeals.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 bg-slate-200 border-2 border-black flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-600" />
            </span>
            Recent History
          </h2>
          <div className="bg-white border-4 border-black overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-4 border-black">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Meal</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {previousMeals.map(meal => (
                  <tr key={meal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black uppercase tracking-tight text-sm">{meal.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(meal.planned_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {meal.did_not_cook ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-1 border border-red-200">Skipped</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 border border-emerald-200">Cooked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
