import React from 'react';
import { Heart, Star, Clock, Globe, Search, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { FavoriteMeal, MealIdea } from '../types';

interface FavoritesSectionProps {
  favorites: FavoriteMeal[];
  toggleFavorite: (meal: MealIdea) => void;
  setMealIdeas: (val: MealIdea[] | ((prev: MealIdea[]) => MealIdea[])) => void;
}

export const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  favorites,
  toggleFavorite,
  setMealIdeas
}) => {
  const addToCurrent = (fav: FavoriteMeal) => {
    const mealIdea: MealIdea = {
      ...fav,
      id: crypto.randomUUID()
    };
    setMealIdeas(prev => [...prev, mealIdea]);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-pink-500 border-4 border-black flex items-center justify-center">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tighter">Your Favorites</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((fav, i) => (
          <motion.div
            key={fav.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-black uppercase tracking-tight leading-tight">{fav.name}</h3>
              <button
                onClick={() => toggleFavorite(fav as any)}
                className="p-2 text-amber-500 hover:bg-amber-50 transition-colors"
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 flex-grow">{fav.description}</p>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Clock className="w-3 h-3" />
                {fav.prepTime} + {fav.cookTime}
              </div>
              {fav.sourceUrl && (
                <a 
                  href={fav.sourceUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:underline"
                >
                  <Globe className="w-3 h-3" />
                  Recipe
                </a>
              )}
            </div>

            <button
              onClick={() => addToCurrent(fav)}
              className="w-full flex items-center justify-center gap-2 py-4 bg-black text-white font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:bg-emerald-500 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Plus className="w-5 h-5" />
              Add to Current Plan
            </button>
          </motion.div>
        ))}
        {favorites.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white border-4 border-dashed border-slate-200">
            <p className="text-slate-400 font-black uppercase tracking-widest">No favorites yet. Star some meals to see them here!</p>
          </div>
        )}
      </div>
    </div>
  );
};
