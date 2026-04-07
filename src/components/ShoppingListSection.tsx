import React from 'react';
import { ShoppingCart, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { ShoppingList } from '../types';

interface ShoppingListSectionProps {
  shoppingList: ShoppingList;
  manuallyAddedToBuy: string[];
  setManuallyAddedToBuy: (val: string[] | ((prev: string[]) => string[])) => void;
  hoveredIngredient: string | null;
  setHoveredIngredient: (val: string | null) => void;
  saveMealPlan: () => void;
  isSaving: boolean;
}

export const ShoppingListSection: React.FC<ShoppingListSectionProps> = ({
  shoppingList,
  manuallyAddedToBuy,
  setManuallyAddedToBuy,
  hoveredIngredient,
  setHoveredIngredient,
  saveMealPlan,
  isSaving
}) => {
  const toggleManualToBuy = (name: string) => {
    setManuallyAddedToBuy(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-none shadow-none border-4 border-black overflow-hidden">
        <div className="p-6 border-b-4 border-black bg-emerald-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            <h2 className="text-2xl font-black uppercase tracking-tighter">Shopping List</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Est. Total Cost</p>
            <p className="text-2xl font-black tracking-tighter">${shoppingList.totalEstimatedCost}</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* To Buy */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-none border-2 border-black"></span>
              Items to Buy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shoppingList.toBuy.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 bg-white border-2 border-black rounded-none group hover:bg-emerald-50 transition-all"
                  onMouseEnter={() => setHoveredIngredient(item.name)}
                  onMouseLeave={() => setHoveredIngredient(null)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-black uppercase tracking-widest text-black">{item.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.amount}</span>
                    {item.onSaleAt && (
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                        SALE AT: {item.onSaleAt}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      {hoveredIngredient === item.name && (
                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] px-3 py-1.5 rounded-none border-2 border-black whitespace-nowrap z-10 font-black uppercase tracking-widest">
                          For: {item.meals.join(', ')}
                        </div>
                      )}
                      <button 
                        onClick={() => toggleManualToBuy(item.name)}
                        className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"
                        title="Mark as already in inventory"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {shoppingList.toBuy.length === 0 && (
                <div className="col-span-2 py-10 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-none">
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No items to buy. Select some meals!</p>
                </div>
              )}
            </div>
          </div>

          {/* From Inventory */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-none border-2 border-black"></span>
              Use from Inventory
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
              {shoppingList.fromInventory.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 bg-slate-50 border-2 border-black rounded-none group hover:bg-amber-50 transition-all"
                  onMouseEnter={() => setHoveredIngredient(item.name)}
                  onMouseLeave={() => setHoveredIngredient(null)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-black uppercase tracking-widest text-black line-through">{item.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.amount}</span>
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      {hoveredIngredient === item.name && (
                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] px-3 py-1.5 rounded-none border-2 border-black whitespace-nowrap z-10 font-black uppercase tracking-widest">
                          For: {item.meals.join(', ')}
                        </div>
                      )}
                      <button 
                        onClick={() => toggleManualToBuy(item.name)}
                        className="p-2 text-emerald-500 hover:text-amber-500 transition-colors"
                        title="Force to shopping list"
                      >
                        <Sparkles className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {shoppingList.fromInventory.length === 0 && (
                <div className="col-span-2 py-10 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-none">
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No inventory items used.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={saveMealPlan}
            disabled={isSaving || shoppingList.toBuy.length === 0}
            className="w-full bg-black hover:bg-emerald-500 text-white py-6 rounded-none font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Saving Plan...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6" />
                Finalize & Save Meal Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
