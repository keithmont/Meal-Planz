import React from 'react';
import { ShoppingCart, ChevronDown, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingSource } from '../types';

interface ShoppingSourceSectionProps {
  shoppingSources: ShoppingSource[];
  collapsed: boolean;
  toggleSection: () => void;
  zipCode: string;
  setZipCode: (val: string) => void;
  searchStores: () => void;
  isSearchingStores: boolean;
  quotaCooldown: number | null;
  removeShoppingSource: (id: string) => void;
  newShopName: string;
  setNewShopName: (val: string) => void;
  newShopUrl: string;
  setNewShopUrl: (val: string) => void;
  addShoppingSource: () => void;
}

export const ShoppingSourceSection: React.FC<ShoppingSourceSectionProps> = ({
  shoppingSources,
  collapsed,
  toggleSection,
  zipCode,
  setZipCode,
  searchStores,
  isSearchingStores,
  quotaCooldown,
  removeShoppingSource,
  newShopName,
  setNewShopName,
  newShopUrl,
  setNewShopUrl,
  addShoppingSource
}) => {
  return (
    <section className="bg-white rounded-none shadow-none border-4 border-black overflow-hidden">
      <button 
        onClick={toggleSection}
        className="w-full flex items-center justify-between p-6 hover:bg-purple-50 transition-colors border-b-4 border-black"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-black uppercase tracking-tighter">Shopping Sources</h2>
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
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchStores()}
                  placeholder="Zip"
                  className="w-24 px-4 py-3 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-purple-50 font-bold"
                />
                <button 
                  onClick={searchStores}
                  disabled={isSearchingStores || quotaCooldown !== null}
                  className="px-6 bg-black text-white hover:bg-purple-500 rounded-none transition-colors border-2 border-black font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearchingStores ? <Loader2 className="w-5 h-5 animate-spin" /> : (quotaCooldown !== null ? `${quotaCooldown}s` : 'Find Stores')}
                </button>
              </div>

              {shoppingSources.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stores near {zipCode}:</p>
                  {shoppingSources.map(source => (
                    <div key={source.id} className="flex items-center justify-between group bg-white px-4 py-3 rounded-none border-2 border-black hover:bg-slate-50 transition-all">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{source.name}</span>
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[10px] text-purple-500 hover:underline truncate max-w-[200px]"
                        >
                          Weekly Sales Link
                        </a>
                      </div>
                      <button onClick={() => removeShoppingSource(source.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {shoppingSources.length === 0 && !isSearchingStores && (
                <p className="text-xs text-slate-400 italic text-center py-4">Enter your zip code to find local grocery stores and their weekly sales.</p>
              )}

              <div className="pt-4 border-t-2 border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Add Store Manually:</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="Store Name (e.g. Whole Foods)"
                    className="w-full px-4 py-2 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-purple-50 text-sm font-bold"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newShopUrl}
                      onChange={(e) => setNewShopUrl(e.target.value)}
                      placeholder="Weekly Sales URL"
                      className="flex-1 px-4 py-2 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-purple-50 text-sm font-bold"
                    />
                    <button 
                      onClick={addShoppingSource}
                      className="px-4 bg-purple-500 text-white hover:bg-purple-600 rounded-none transition-colors border-2 border-black font-black uppercase text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
