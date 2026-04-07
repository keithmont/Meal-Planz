import React from 'react';
import { Star, Clock, Globe, Search, Eye, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MealIdea, FavoriteMeal } from '../types';
import { User } from 'firebase/auth';

interface MealIdeaCardProps {
  meal: MealIdea;
  index: number;
  user: User | null;
  favorites: FavoriteMeal[];
  selectedMealIds: string[];
  toggleMealSelection: (id: string) => void;
  toggleFavorite: (meal: MealIdea) => void;
  hoveredRecipeId: string | null;
  setHoveredRecipeId: (id: string | null) => void;
}

export const MealIdeaCard: React.FC<MealIdeaCardProps> = ({
  meal,
  index,
  user,
  favorites,
  selectedMealIds,
  toggleMealSelection,
  toggleFavorite,
  hoveredRecipeId,
  setHoveredRecipeId
}) => {
  const isSelected = selectedMealIds.includes(meal.id);
  const isFavorite = favorites.some(f => f.name === meal.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => toggleMealSelection(meal.id)}
      className={`relative cursor-pointer group p-6 rounded-none border-4 transition-all ${
        isSelected
          ? 'bg-emerald-50 border-emerald-500 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]'
          : 'bg-white border-black hover:border-emerald-500 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="pr-6">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg leading-tight">{meal.name}</h3>
            {user && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(meal);
                }}
                className={`p-1 rounded-full transition-colors ${
                  isFavorite
                    ? 'text-amber-500 hover:bg-amber-50'
                    : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Est. ${meal.estimatedCost}</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              <span>Prep: {meal.prepTime}</span>
              <span className="mx-1">•</span>
              <span>Cook: {meal.cookTime}</span>
            </div>
          </div>
        </div>
        {isSelected && (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        )}
      </div>
      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{meal.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {meal.ingredients.slice(0, 3).map((ing, i) => (
          <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
            {ing.name}
          </span>
        ))}
        {meal.ingredients.length > 3 && (
          <span className="text-[10px] text-slate-400 italic">+{meal.ingredients.length - 3} more</span>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        {meal.sourceUrl ? (
          <div className="flex items-center gap-1 text-[10px] text-blue-500 font-medium uppercase tracking-widest">
            <Globe className="w-3 h-3" />
            <a 
              href={meal.sourceUrl} 
              target="_blank" 
              rel="noreferrer" 
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              Recipe Link
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium uppercase tracking-widest italic">
            <Globe className="w-3 h-3 opacity-50" />
            <span>No direct link</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
          <Search className="w-3 h-3" />
          <a 
            href={`https://www.google.com/search?q=${encodeURIComponent(meal.name + ' recipe')}`}
            target="_blank" 
            rel="noreferrer" 
            onClick={(e) => e.stopPropagation()}
            className="hover:underline"
          >
            Search
          </a>
        </div>
        
        <div className="relative">
          <button
            onMouseEnter={() => setHoveredRecipeId(meal.id)}
            onMouseLeave={() => setHoveredRecipeId(null)}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors"
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
          
          <AnimatePresence>
            {hoveredRecipeId === meal.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-full right-0 mb-2 w-64 bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 z-50 pointer-events-none"
              >
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2 pb-2 border-bottom border-slate-100">Quick Instructions</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {meal.instructions.map((step, i) => (
                    <div key={i} className="flex gap-2 text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-bold text-emerald-500">{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
