/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Globe, 
  AlertTriangle, 
  Package, 
  Sparkles, 
  CheckCircle2, 
  ShoppingCart, 
  ChevronRight,
  ChevronDown,
  Loader2,
  UtensilsCrossed,
  Clock,
  Download,
  Upload,
  CookingPot,
  Eye,
  Mail,
  X,
  Star,
  History,
  Heart,
  Home,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { InventoryItem, Source, ShoppingSource, Allergy, MealIdea, ShoppingList, PantryItem, AppData, FavoriteMeal, MealPlanItem } from './types';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '@supabase/supabase-js';

// Initialize Gemini
const getGenAI = () => {
  let apiKey = '';
  try {
    apiKey = process.env.GEMINI_API_KEY || '';
  } catch (e) {
    // process.env might not be available in some browser environments
  }
  
  if (!apiKey) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }
  
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activePage, setActivePage] = useState<'home' | 'favorites' | 'meal-plan'>('home');

  // State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [shoppingSources, setShoppingSources] = useState<ShoppingSource[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [mealIdeas, setMealIdeas] = useState<MealIdea[]>([]);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanItem[]>([]);
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredRecipeId, setHoveredRecipeId] = useState<string | null>(null);
  const [hoveredIngredient, setHoveredIngredient] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    email: '',
    includeIngredients: true,
    includeMeals: true,
    includeBriefs: true
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    inventory: false,
    pantry: false,
    sources: true,
    shopping: true,
    allergies: true
  });

  // Input states
  const [newItem, setNewItem] = useState('');
  const [newPantryItem, setNewPantryItem] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newShopUrl, setNewShopUrl] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  // Supabase Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync Data with Supabase
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user data:', error);
        return;
      }

      if (data) {
        if (data.inventory) setInventory(data.inventory);
        if (data.pantry) setPantry(data.pantry);
        if (data.sources) setSources(data.sources);
        if (data.shopping_sources) setShoppingSources(data.shopping_sources);
        if (data.allergies) setAllergies(data.allergies);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const saveData = async () => {
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          inventory,
          pantry,
          sources,
          shopping_sources: shoppingSources,
          allergies,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) console.error('Error saving user data:', error);
    };

    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [user, inventory, pantry, sources, shoppingSources, allergies]);

  // Local Storage Persistence (Fallback/Initial)
  useEffect(() => {
    const savedInventory = localStorage.getItem('mealwise_inventory');
    const savedPantry = localStorage.getItem('mealwise_pantry');
    const savedSources = localStorage.getItem('mealwise_sources');
    const savedShoppingSources = localStorage.getItem('mealwise_shopping_sources');
    const savedAllergies = localStorage.getItem('mealwise_allergies');
    
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedPantry) setPantry(JSON.parse(savedPantry));
    if (savedSources) setSources(JSON.parse(savedSources));
    if (savedShoppingSources) setShoppingSources(JSON.parse(savedShoppingSources));
    if (savedAllergies) setAllergies(JSON.parse(savedAllergies));
  }, []);

  useEffect(() => {
    localStorage.setItem('mealwise_inventory', JSON.stringify(inventory));
    localStorage.setItem('mealwise_pantry', JSON.stringify(pantry));
    localStorage.setItem('mealwise_sources', JSON.stringify(sources));
    localStorage.setItem('mealwise_shopping_sources', JSON.stringify(shoppingSources));
    localStorage.setItem('mealwise_allergies', JSON.stringify(allergies));
  }, [inventory, pantry, sources, shoppingSources, allergies]);

  // Handlers
  const addInventory = () => {
    if (!newItem.trim()) return;
    setInventory([...inventory, { id: crypto.randomUUID(), name: newItem.trim() }]);
    setNewItem('');
  };

  const removeInventory = (id: string) => {
    setInventory(inventory.filter(i => i.id !== id));
  };

  const addPantry = () => {
    if (!newPantryItem.trim()) return;
    setPantry([...pantry, { id: crypto.randomUUID(), name: newPantryItem.trim() }]);
    setNewPantryItem('');
  };

  const removePantry = (id: string) => {
    setPantry(pantry.filter(p => p.id !== id));
  };

  const addSource = () => {
    if (!newSourceUrl.trim() || !newSourceName.trim()) return;
    setSources([...sources, { id: crypto.randomUUID(), url: newSourceUrl.trim(), name: newSourceName.trim() }]);
    setNewSourceUrl('');
    setNewSourceName('');
  };

  const removeSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const addShoppingSource = () => {
    if (!newShopUrl.trim() || !newShopName.trim()) return;
    setShoppingSources([...shoppingSources, { id: crypto.randomUUID(), url: newShopUrl.trim(), name: newShopName.trim() }]);
    setNewShopUrl('');
    setNewShopName('');
  };

  const removeShoppingSource = (id: string) => {
    setShoppingSources(shoppingSources.filter(s => s.id !== id));
  };

  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    setAllergies([...allergies, { id: crypto.randomUUID(), ingredient: newAllergy.trim() }]);
    setNewAllergy('');
  };

  const removeAllergy = (id: string) => {
    setAllergies(allergies.filter(a => a.id !== id));
  };

  const handleSignIn = async () => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your settings.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) setError(error.message);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  };

  const saveSettings = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      const settings: AppData = {
        inventory,
        pantry,
        sources,
        shoppingSources,
        allergies
      };

      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: user.id, 
          settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (upsertError) throw upsertError;
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const loadSettings = async (userId: string) => {
    try {
      // Load Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', userId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      if (settingsData?.settings) {
        const s = settingsData.settings as AppData;
        setInventory(s.inventory || []);
        setPantry(s.pantry || []);
        setSources(s.sources || []);
        setShoppingSources(s.shoppingSources || []);
        setAllergies(s.allergies || []);
      }

      // Load Favorites
      const { data: favsData, error: favsError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId);
      
      if (favsError) throw favsError;
      setFavorites(favsData || []);

      // Load Meal Plan
      const { data: planData, error: planError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .order('planned_at', { ascending: false });
      
      if (planError) throw planError;
      setMealPlan(planData || []);

    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const toggleFavorite = async (meal: MealIdea) => {
    if (!user) {
      setError("Please sign in to favorite meals.");
      return;
    }

    const isFav = favorites.some(f => f.name === meal.name);
    try {
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('name', meal.name);
        if (error) throw error;
        setFavorites(favorites.filter(f => f.name !== meal.name));
      } else {
        // Omit the client-side ID to let Supabase generate a database UUID
        const { id, ...mealData } = meal;
        const newFavData = {
          ...mealData,
          user_id: user.id,
          created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('favorites')
          .insert(newFavData)
          .select()
          .single();
          
        if (error) throw error;
        if (data) {
          setFavorites([...favorites, data as FavoriteMeal]);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      const msg = err instanceof Error ? err.message : (err as any)?.message || 'Unknown error';
      setError(`Failed to update favorites: ${msg}`);
    }
  };

  const saveMealPlan = async () => {
    if (!user) {
      setError("Please sign in to save your meal plan.");
      return;
    }

    const selectedMeals = mealIdeas.filter(m => selectedMealIds.includes(m.id));
    if (selectedMeals.length === 0) {
      setError("Please select at least one meal to save to your plan.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Mark existing current meals as previous
      const { error: updateError } = await supabase
        .from('meal_plans')
        .update({ is_current: false })
        .eq('user_id', user.id)
        .eq('is_current', true);
      
      if (updateError) throw updateError;

      // 2. Insert new meals as current (omitting client-side IDs)
      const newPlanItems = selectedMeals.map(m => {
        const { id, ...mealData } = m;
        return {
          ...mealData,
          user_id: user.id,
          planned_at: new Date().toISOString(),
          is_current: true
        };
      });

      const { data, error: insertError } = await supabase
        .from('meal_plans')
        .insert(newPlanItems)
        .select();
      
      if (insertError) throw insertError;

      // Update local state with the data returned from Supabase (which has the real IDs)
      const savedItems = data as MealPlanItem[];
      const updatedPlan = [
        ...savedItems,
        ...mealPlan.map(p => ({ ...p, is_current: false }))
      ];
      setMealPlan(updatedPlan);
      
      // Clear selection
      setSelectedMealIds([]);
      alert("Meal plan saved successfully!");
    } catch (err) {
      console.error('Error saving meal plan:', err);
      const msg = err instanceof Error ? err.message : (err as any)?.message || 'Unknown error';
      setError(`Failed to save meal plan: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const pullFavorites = () => {
    if (favorites.length === 0) return;
    
    // Pick up to 3 random favorites that aren't already in mealIdeas
    const existingNames = new Set(mealIdeas.map(m => m.name));
    const availableFavs = favorites.filter(f => !existingNames.has(f.name));
    
    if (availableFavs.length === 0) return;

    const shuffled = [...availableFavs].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(f => ({
      ...f,
      id: crypto.randomUUID() // Give them new IDs for the current list
    }));

    setMealIdeas([...mealIdeas, ...selected]);
  };

  useEffect(() => {
    if (user) {
      loadSettings(user.id);
    }
  }, [user]);

  const quickAddSource = (name: string, url: string) => {
    if (sources.some(s => s.url === url)) return;
    setSources([...sources, { id: crypto.randomUUID(), name, url }]);
  };

  const quickAddShoppingSource = (name: string, url: string) => {
    if (shoppingSources.some(s => s.url === url)) return;
    setShoppingSources([...shoppingSources, { id: crypto.randomUUID(), name, url }]);
  };

  const exportData = () => {
    const data: AppData = {
      inventory,
      pantry,
      sources,
      shoppingSources,
      allergies
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mealwise-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data: AppData = JSON.parse(e.target?.result as string);
        if (data.inventory) setInventory(data.inventory);
        if (data.pantry) setPantry(data.pantry);
        if (data.sources) setSources(data.sources);
        if (data.shoppingSources) setShoppingSources(data.shoppingSources);
        if (data.allergies) setAllergies(data.allergies);
        alert('Data imported successfully!');
      } catch (err) {
        alert('Failed to import data. Please ensure the file is a valid MealWise JSON export.');
      }
    };
    reader.readAsText(file);
  };

  const toggleMealSelection = (id: string) => {
    setSelectedMealIds(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const toggleSection = (section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getFormattedDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setError(null);
    
    // Generate content
    const subject = `Meal Plan for Week of ${getFormattedDate()}`;
    let body = '';
    
    if (emailForm.includeIngredients) {
      body += "INGREDIENTS TO BUY:\n";
      shoppingList.toBuy.forEach(item => body += `- ${item.name}: ${item.amount}\n`);
      body += "\nPANTRY ITEMS TO USE:\n";
      shoppingList.fromInventory.forEach(item => body += `- ${item.name}: ${item.amount}\n`);
      body += "\n";
    }
    
    if (emailForm.includeMeals) {
      body += "MEALS TO COOK:\n";
      const selectedMeals = mealIdeas.filter(m => selectedMealIds.includes(m.id));
      selectedMeals.forEach(meal => {
        body += `\n- ${meal.name}`;
        if (meal.sourceUrl) body += ` (Recipe: ${meal.sourceUrl})`;
        if (emailForm.includeBriefs) {
          body += "\n  Instructions:\n";
          meal.instructions.forEach((step, i) => body += `  ${i+1}. ${step}\n`);
        }
        body += "\n";
      });
    }
    
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailForm.email,
          subject,
          body
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }
      
      setEmailSent(true);
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSent(false);
      }, 2000);
    } catch (err) {
      console.error("Email Error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred while sending the email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getMealPrompt = () => {
    return `
        Generate 10 meal ideas based on the following context:
        - Current Inventory (items I have): ${inventory.map(i => i.name).join(', ')}
        - Pantry Basics (oil, spices, etc. - assume I have these): ${pantry.map(p => p.name).join(', ')}
        - Recipe Sources: ${sources.map(s => `${s.name} (${s.url})`).join(', ')}
        - Shopping Sources (Weekly Sales/Deals): ${shoppingSources.map(s => `${s.name} (${s.url})`).join(', ')}
        - Allergies/Avoid these ingredients: ${allergies.map(a => a.ingredient).join(', ')}
        
        Guidelines:
        1. Use the Inventory as a cost-saving measure (prefer using these items), but do NOT restrict meal ideas only to these ingredients.
        2. Pantry Basics are items I always have. Use them as needed, but they should NOT drive the meal selection.
        3. CRITICAL: Reference the Shopping Sources (weekly sales) to suggest cost-effective meals. If a shopping source has a deal on a specific protein or vegetable, prioritize those.
        4. Avoid any ingredients listed in the allergies section.
        5. The estimatedCost should be the cost of ingredients I need to PURCHASE (not in Inventory/Pantry), leveraging the Shopping Sources for lower prices where possible.
        
        For each meal, provide:
        1. A name
        2. A brief description
        3. A list of ingredients with estimated amounts
        4. A source URL if it relates to one of the provided recipe sources.
        5. An estimatedCost (number) for the additional groceries needed for this meal (assuming 4 servings).
        6. prepTime (string, e.g. "15 min")
        7. cookTime (string, e.g. "30 min")
        8. instructions (array of strings, simplified steps without commentary)
      `;
  };

  const generateMeals = async (isRegen = false) => {
    if (isRegen) setIsRegenerating(true);
    else setIsGenerating(true);
    
    setError(null);
    try {
      const genAI = getGenAI();
      if (!genAI) {
        throw new Error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
      }

      const model = "gemini-3-flash-preview";
      const prompt = getMealPrompt();

      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      amount: { type: Type.STRING }
                    },
                    required: ["name", "amount"]
                  }
                },
                sourceUrl: { type: Type.STRING },
                estimatedCost: { type: Type.NUMBER },
                prepTime: { type: Type.STRING },
                cookTime: { type: Type.STRING },
                instructions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["name", "description", "ingredients", "estimatedCost", "prepTime", "cookTime", "instructions"]
            }
          }
        }
      });

      let jsonText = response.text || '[]';
      // Clean up markdown code blocks if present
      if (jsonText.includes('```')) {
        jsonText = jsonText.replace(/```json\n?|```/g, '').trim();
      }

      const newMeals = JSON.parse(jsonText).map((m: any) => ({ ...m, id: crypto.randomUUID() }));
      
      if (isRegen) {
        // Keep selected, replace unselected
        const selectedMeals = mealIdeas.filter(m => selectedMealIds.includes(m.id));
        setMealIdeas([...selectedMeals, ...newMeals]);
      } else {
        setMealIdeas(newMeals);
        setSelectedMealIds([]);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate meal ideas. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
      setIsRegenerating(false);
    }
  };

  const shoppingList = useMemo((): ShoppingList => {
    const selectedMeals = mealIdeas.filter(m => selectedMealIds.includes(m.id));
    const toBuyMap = new Map<string, { amounts: string[]; meals: string[] }>();
    const fromInventoryMap = new Map<string, string[]>();
    let totalEstimatedCost = 0;

    const inventoryNames = inventory.map(i => i.name.toLowerCase());
    const pantryNames = pantry.map(p => p.name.toLowerCase());

    selectedMeals.forEach(meal => {
      totalEstimatedCost += meal.estimatedCost;
      meal.ingredients.forEach(ing => {
        const nameLower = ing.name.toLowerCase();
        const isAtHome = inventoryNames.some(invName => 
          nameLower.includes(invName) || invName.includes(nameLower)
        );
        const isInPantry = pantryNames.some(pantryName =>
          nameLower.includes(pantryName) || pantryName.includes(nameLower)
        );

        if (isAtHome || isInPantry) {
          if (!fromInventoryMap.has(ing.name)) {
            fromInventoryMap.set(ing.name, []);
          }
          fromInventoryMap.get(ing.name)?.push(ing.amount);
        } else {
          if (!toBuyMap.has(ing.name)) {
            toBuyMap.set(ing.name, { amounts: [], meals: [] });
          }
          const entry = toBuyMap.get(ing.name)!;
          entry.amounts.push(ing.amount);
          if (!entry.meals.includes(meal.name)) {
            entry.meals.push(meal.name);
          }
        }
      });
    });

    const combineAmounts = (amounts: string[]) => {
      const aggregated: Record<string, number> = {};
      const others: string[] = [];

      amounts.forEach(amt => {
        const match = amt.match(/^(\d+(\.\d+)?)\s*([a-zA-Z]+)$/);
        if (match) {
          const val = parseFloat(match[1]);
          const unit = match[3].toLowerCase();
          const normalizedUnit = unit.endsWith('s') ? unit.slice(0, -1) : unit;
          aggregated[normalizedUnit] = (aggregated[normalizedUnit] || 0) + val;
        } else {
          others.push(amt);
        }
      });

      const resultParts = Object.entries(aggregated).map(([unit, val]) => {
        const displayUnit = val > 1 && !['g', 'ml', 'l', 'kg'].includes(unit) ? unit + 's' : unit;
        return `${val} ${displayUnit}`;
      });

      return [...resultParts, ...others].join(', ') || 'as needed';
    };

    const toBuy = Array.from(toBuyMap.entries()).map(([name, entry]) => ({
      name,
      amount: combineAmounts(entry.amounts),
      meals: entry.meals
    }));

    const fromInventory = Array.from(fromInventoryMap.entries()).map(([name, amounts]) => ({
      name,
      amount: combineAmounts(amounts)
    }));

    return { toBuy, fromInventory, totalEstimatedCost };
  }, [selectedMealIds, mealIdeas, inventory, pantry]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Email Modal */}
        <AnimatePresence>
          {isEmailModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-md rounded-none border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              >
                <div className="p-6 border-b-4 border-black flex items-center justify-between bg-emerald-500 text-white">
                  <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                    <Mail className="w-6 h-6" />
                    Email Meal Plan
                  </h3>
                  <button 
                    onClick={() => setIsEmailModalOpen(false)}
                    className="p-2 hover:bg-black rounded-none transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSendEmail} className="p-8 space-y-8">
                  {emailSent ? (
                    <div className="py-10 text-center space-y-6">
                      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-none border-4 border-emerald-500 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h4 className="text-3xl font-black uppercase tracking-tighter">Email Sent!</h4>
                      <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">Your meal plan for the week of {getFormattedDate()} has been sent.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-black uppercase tracking-[0.2em]">Email Address</label>
                        <input
                          required
                          type="email"
                          value={emailForm.email}
                          onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                          placeholder="your@email.com"
                          className="w-full px-4 py-4 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-emerald-50 font-bold transition-all"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-black text-black uppercase tracking-[0.2em]">Include in Email</label>
                        <div className="space-y-3">
                          {[
                            { id: 'includeIngredients', label: 'Ingredients to Buy' },
                            { id: 'includeMeals', label: 'Meals to Cook' },
                            { id: 'includeBriefs', label: 'Recipe Briefs' }
                          ].map((option) => (
                            <label key={option.id} className="flex items-center gap-4 p-4 bg-white border-2 border-black rounded-none cursor-pointer hover:bg-emerald-50 transition-all">
                              <input
                                type="checkbox"
                                checked={emailForm[option.id as keyof typeof emailForm] as boolean}
                                onChange={(e) => setEmailForm({ ...emailForm, [option.id]: e.target.checked })}
                                className="w-6 h-6 rounded-none border-2 border-black text-emerald-500 focus:ring-0"
                              />
                              <span className="text-sm font-black uppercase tracking-widest text-black">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingEmail}
                        className="w-full bg-black hover:bg-emerald-500 text-white py-5 rounded-none font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                      >
                        {isSendingEmail ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="w-6 h-6" />
                            Send Meal Plan
                          </>
                        )}
                      </button>
                    </>
                  )}
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-black flex items-center gap-2">
              <UtensilsCrossed className="w-10 h-10 text-emerald-500" />
              Quick Planner 3000
            </h1>
            <p className="text-slate-600 mt-1 font-bold uppercase tracking-widest text-xs">Plan Smarter not Harder.</p>
          </div>

          <div className="flex items-center gap-3">
            {isAuthLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {user.user_metadata.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" className="w-6 h-6 rounded-none" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-slate-500" />
                  )}
                  <span className="text-sm font-bold text-black">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-black hover:bg-red-500 hover:text-white border-2 border-black rounded-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-none font-black hover:bg-emerald-500 transition-all shadow-[6px_6px_0px_0px_rgba(16,185,129,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <LogIn className="w-4 h-4" />
                Sign In with Google
              </button>
            )}
          </div>
        </header>

        {user && (
          <nav className="flex items-center gap-2 bg-white p-2 rounded-none shadow-none border-4 border-black">
            <button
              onClick={() => setActivePage('home')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-none text-sm font-black uppercase tracking-widest transition-all ${activePage === 'home' ? 'bg-emerald-500 text-white' : 'text-black hover:bg-emerald-50'}`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={() => setActivePage('meal-plan')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-none text-sm font-black uppercase tracking-widest transition-all ${activePage === 'meal-plan' ? 'bg-emerald-500 text-white' : 'text-black hover:bg-emerald-50'}`}
            >
              <Calendar className="w-4 h-4" />
              Meal Plan
            </button>
            <button
              onClick={() => setActivePage('favorites')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-none text-sm font-black uppercase tracking-widest transition-all ${activePage === 'favorites' ? 'bg-emerald-500 text-white' : 'text-black hover:bg-emerald-50'}`}
            >
              <Heart className="w-4 h-4" />
              Favorites
            </button>
          </nav>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <main>
          {activePage === 'home' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Configuration */}
          <div className="space-y-6">
            {/* Inventory */}
            <section className="bg-white rounded-none shadow-none border-4 border-black overflow-hidden">
              <button 
                onClick={() => toggleSection('inventory')}
                className="w-full flex items-center justify-between p-6 hover:bg-emerald-50 transition-colors border-b-4 border-black"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">Inventory</h2>
                </div>
                <ChevronDown className={`w-6 h-6 text-black transition-transform ${collapsed.inventory ? '' : 'rotate-180'}`} />
              </button>
              
              <AnimatePresence>
                {!collapsed.inventory && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6 pt-6"
                  >
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addInventory()}
                        placeholder="Add item (e.g. Chicken)"
                        className="flex-1 px-4 py-3 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-emerald-50 font-bold"
                      />
                      <button 
                        onClick={addInventory}
                        className="p-3 bg-black text-white hover:bg-emerald-500 rounded-none transition-colors border-2 border-black"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {inventory.map(item => (
                        <div key={item.id} className="flex items-center justify-between group bg-white px-4 py-3 rounded-none border-2 border-black hover:bg-slate-50 transition-all">
                          <span className="font-bold">{item.name}</span>
                          <button onClick={() => removeInventory(item.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      {inventory.length === 0 && <p className="text-sm text-slate-400 italic font-bold">No items in inventory.</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Pantry */}
            <section className="bg-white rounded-none shadow-none border-4 border-black overflow-hidden">
              <button 
                onClick={() => toggleSection('pantry')}
                className="w-full flex items-center justify-between p-6 hover:bg-amber-50 transition-colors border-b-4 border-black"
              >
                <div className="flex items-center gap-2">
                  <CookingPot className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">Pantry Basics</h2>
                </div>
                <ChevronDown className={`w-6 h-6 text-black transition-transform ${collapsed.pantry ? '' : 'rotate-180'}`} />
              </button>

              <AnimatePresence>
                {!collapsed.pantry && (
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
                        placeholder="Basic (e.g. Olive Oil)"
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
                      {pantry.length === 0 && <p className="text-sm text-slate-400 italic font-bold">No pantry basics added.</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Recipe Sources */}
            <section className="bg-white rounded-none shadow-none border-4 border-black overflow-hidden">
              <button 
                onClick={() => toggleSection('sources')}
                className="w-full flex items-center justify-between p-6 hover:bg-blue-50 transition-colors border-b-4 border-black"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">Recipe Sources</h2>
                </div>
                <ChevronDown className={`w-6 h-6 text-black transition-transform ${collapsed.sources ? '' : 'rotate-180'}`} />
              </button>

              <AnimatePresence>
                {!collapsed.sources && (
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
                      <button 
                        onClick={() => quickAddSource('Bon Apetite', 'https://www.bonappetit.com/recipes')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-blue-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        Bon Apetite
                      </button>
                      <button 
                        onClick={() => quickAddSource('Food Wishes', 'https://foodwishes.blogspot.com/')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-blue-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        Food Wishes
                      </button>
                      <button 
                        onClick={() => quickAddSource('Serious Eats', 'https://www.seriouseats.com/recipes-by-course-5117906')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-blue-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        Serious Eats
                      </button>
                      <button 
                        onClick={() => quickAddSource('Budget Bytes', 'https://www.budgetbytes.com/category/recipes/')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-blue-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        Budget Bytes
                      </button>
                      <button 
                        onClick={() => quickAddSource('Hello Fresh', 'https://www.hellofresh.com/recipes')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-blue-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        Hello Fresh
                      </button>
                      <button 
                        onClick={() => quickAddSource('Blue Apron', 'https://www.blueapron.com/cookbook')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-blue-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        Blue Apron
                      </button>
                      <button 
                        onClick={() => quickAddSource('Americas Test Kitchen', 'https://www.americastestkitchen.com/recipes')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-blue-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        Americas Test Kitchen
                      </button>
                      <button 
                        onClick={() => quickAddSource('NYT Cooking', 'https://cooking.nytimes.com/topics/dinner-recipes')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-blue-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        NYT Cooking
                      </button>
                      <button 
                        onClick={() => quickAddSource('Whole30', 'https://whole30.com/recipes')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-blue-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        Whole30
                      </button>
                      <button 
                        onClick={() => quickAddSource('Jenn Eats Goood', 'https://jenneatsgoood.com/recipes/')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-blue-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        Jenn Eats Goood
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {sources.map(source => (
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

            {/* Shopping Sources */}
            <section className="bg-white rounded-none shadow-none border-4 border-black overflow-hidden">
              <button 
                onClick={() => toggleSection('shopping')}
                className="w-full flex items-center justify-between p-6 hover:bg-purple-50 transition-colors border-b-4 border-black"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-purple-500" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">Shopping Sources</h2>
                </div>
                <ChevronDown className={`w-6 h-6 text-black transition-transform ${collapsed.shopping ? '' : 'rotate-180'}`} />
              </button>

              <AnimatePresence>
                {!collapsed.shopping && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pt-6 pb-6"
                  >
                    <div className="space-y-2 mb-4">
                      <input
                        type="text"
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                        placeholder="Store Name (e.g. Whole Foods)"
                        className="w-full px-4 py-3 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-purple-50 font-bold"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newShopUrl}
                          onChange={(e) => setNewShopUrl(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addShoppingSource()}
                          placeholder="Weekly Sales URL"
                          className="flex-1 px-4 py-3 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-purple-50 font-bold"
                        />
                        <button 
                          onClick={addShoppingSource}
                          className="p-3 bg-black text-white hover:bg-purple-500 rounded-none transition-colors border-2 border-black"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider w-full">Quick Add:</span>
                      <button 
                        onClick={() => quickAddShoppingSource('Whole Foods', 'http://wholefoodsmarket.com/sales-flyer?store-id=10480')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-purple-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        Whole Foods
                      </button>
                      <button 
                        onClick={() => quickAddShoppingSource('Sprouts', 'https://shop.sprouts.com/store/sprouts/flyers/weekly')}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded-none border-2 border-black hover:bg-purple-500 hover:text-white transition-all font-black uppercase tracking-widest"
                      >
                        Sprouts
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {shoppingSources.map(source => (
                        <div key={source.id} className="flex items-center justify-between group bg-white px-4 py-3 rounded-none border-2 border-black hover:bg-slate-50 transition-all">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{source.name}</span>
                            <a 
                              href={source.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[10px] text-purple-500 hover:underline truncate max-w-[150px]"
                            >
                              {source.url}
                            </a>
                          </div>
                          <button onClick={() => removeShoppingSource(source.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {shoppingSources.length === 0 && <p className="text-xs text-slate-400 italic">No stores added.</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Allergies */}
            <section className="bg-white rounded-none shadow-none border-4 border-black overflow-hidden">
              <button 
                onClick={() => toggleSection('allergies')}
                className="w-full flex items-center justify-between p-6 hover:bg-orange-50 transition-colors border-b-4 border-black"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">Allergies</h2>
                </div>
                <ChevronDown className={`w-6 h-6 text-black transition-transform ${collapsed.allergies ? '' : 'rotate-180'}`} />
              </button>

              <AnimatePresence>
                {!collapsed.allergies && (
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
                        placeholder="Avoid (e.g. Peanuts)"
                        className="flex-1 px-4 py-3 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-orange-50 font-bold"
                      />
                      <button 
                        onClick={addAllergy}
                        className="p-3 bg-black text-white hover:bg-orange-500 rounded-none transition-colors border-2 border-black"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allergies.map(allergy => (
                        <div key={allergy.id} className="flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1 rounded-none text-xs font-black uppercase tracking-widest border-2 border-orange-500">
                          {allergy.ingredient}
                          <button onClick={() => removeAllergy(allergy.id)} className="hover:text-orange-900">
                            <Plus className="w-3 h-3 rotate-45" />
                          </button>
                        </div>
                      ))}
                      {allergies.length === 0 && <p className="text-xs text-slate-400 italic">No allergies listed.</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Actions Section */}
            <div className="space-y-4 pt-4">
              {user ? (
                <button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="w-full bg-blue-500 hover:bg-black text-white px-6 py-4 rounded-none font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                  Save Settings
                </button>
              ) : (
                <p className="text-xs text-slate-600 font-bold px-1 italic uppercase tracking-wider">
                  Sign in to save your settings to your account.
                </p>
              )}

              <p className="text-xs text-slate-500 font-medium px-1">
                {user 
                  ? "You can also export your settings as a .json file for backup."
                  : "To save your settings (Pantry, Sources, Allergies, Etc.), export the .json file and import it next time."
                }
              </p>
              
              <div className="flex items-center gap-2 bg-white p-2 rounded-none border-4 border-black">
                <button
                  onClick={exportData}
                  className="flex-1 py-3 hover:bg-emerald-50 rounded-none text-black flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <div className="w-1 h-8 bg-black" />
                <label className="flex-1 py-3 hover:bg-emerald-50 rounded-none text-black flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Import
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>

              <button
                onClick={() => generateMeals(false)}
                disabled={isGenerating || isRegenerating}
                className="w-full bg-emerald-500 hover:bg-black text-white px-6 py-5 rounded-none font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                Generate 10 Meal Ideas
              </button>
            </div>
          </div>

          {/* Middle Column: Meal Ideas */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Generated Ideas
                  {mealIdeas.length > 0 && <span className="text-sm font-black text-black bg-emerald-500 px-3 py-1 rounded-none border-2 border-black">{mealIdeas.length}</span>}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {mealIdeas.map((meal, index) => (
                    <motion.div
                      key={meal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleMealSelection(meal.id)}
                      className={`relative cursor-pointer group p-6 rounded-none border-4 transition-all ${
                        selectedMealIds.includes(meal.id)
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
                                  favorites.some(f => f.name === meal.name)
                                    ? 'text-amber-500 hover:bg-amber-50'
                                    : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'
                                }`}
                              >
                                <Star className={`w-4 h-4 ${favorites.some(f => f.name === meal.name) ? 'fill-current' : ''}`} />
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
                        {selectedMealIds.includes(meal.id) && (
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
                      {meal.sourceUrl && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] text-blue-500 font-medium uppercase tracking-widest">
                            <Globe className="w-3 h-3" />
                            <a 
                              href={meal.sourceUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline"
                            >
                              Source Linked
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
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {mealIdeas.length === 0 && !isGenerating && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-black border-4 border-dashed border-black rounded-none bg-slate-50">
                    <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-2xl font-black uppercase tracking-tighter">No meals generated yet</p>
                    <p className="text-sm font-bold uppercase tracking-widest">Click the button above to get started!</p>
                  </div>
                )}

                {isGenerating && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-12 h-12 mb-4 animate-spin text-emerald-500" />
                    <p className="text-lg font-medium text-slate-600">Cooking up ideas...</p>
                    <p className="text-sm">Gemini is analyzing your inventory, sales, and allergies.</p>
                  </div>
                )}
              </div>

              {mealIdeas.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => generateMeals(true)}
                    disabled={isGenerating || isRegenerating}
                    className="bg-white border-4 border-black text-black px-10 py-4 rounded-none font-black uppercase tracking-widest flex items-center gap-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                  >
                    {isRegenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-emerald-500" />}
                    Regenerate (Keep Selected)
                  </button>
                  
                  {user && favorites.length > 0 && (
                    <div className="text-center mt-4">
                      <button 
                        onClick={pullFavorites}
                        className="text-xs text-emerald-600 font-bold hover:underline"
                      >
                        Would you like me to pull some of your favorites?
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Shopping List Section */}
            {selectedMealIds.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black text-white rounded-none p-10 border-4 border-emerald-500 shadow-[10px_10px_0px_0px_rgba(16,185,129,1)]"
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-emerald-500 rounded-none">
                    <ShoppingCart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Shopping List</h2>
                    <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest">Based on {selectedMealIds.length} selected meals</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* To Buy */}
                  <div>
                    <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      Need to Buy
                      <span className="h-px flex-1 bg-emerald-400/20"></span>
                    </h3>
                    <ul className="space-y-4">
                      {shoppingList.toBuy.map((item, i) => (
                        <li 
                          key={i} 
                          className="flex items-center justify-between group relative"
                          onMouseEnter={() => setHoveredIngredient(item.name)}
                          onMouseLeave={() => setHoveredIngredient(null)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="text-slate-500 text-sm font-mono">{item.amount}</span>
                          
                          <AnimatePresence>
                            {hoveredIngredient === item.name && (
                              <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-black border-4 border-emerald-500 rounded-none p-4 z-50 w-64 shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] pointer-events-none"
                              >
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">Used In:</p>
                                <div className="space-y-1">
                                  {item.meals.map((mealName, idx) => (
                                    <p key={idx} className="text-[11px] text-slate-200 leading-tight">• {mealName}</p>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      ))}
                      {shoppingList.toBuy.length === 0 && (
                        <p className="text-slate-500 italic text-sm">Everything is in your inventory!</p>
                      )}
                    </ul>
                  </div>

                  {/* From Inventory */}
                  <div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      Using from Inventory/Pantry
                      <span className="h-px flex-1 bg-slate-400/20"></span>
                    </h3>
                    <ul className="space-y-4">
                      {shoppingList.fromInventory.map((item, i) => (
                        <li key={i} className="flex items-center justify-between opacity-60">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-slate-500" />
                            <span className="font-medium line-through">{item.name}</span>
                          </div>
                          <span className="text-slate-500 text-sm font-mono">{item.amount}</span>
                        </li>
                      ))}
                      {shoppingList.fromInventory.length === 0 && (
                        <p className="text-slate-500 italic text-sm">No inventory/pantry items used.</p>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-slate-400">
                        Total unique ingredients: {new Set([...shoppingList.toBuy, ...shoppingList.fromInventory].map(i => i.name)).size}
                      </div>
                      <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                        Estimated Weekly Cost: ${shoppingList.totalEstimatedCost.toFixed(2)}
                        <span className="text-[10px] text-slate-500 font-normal uppercase tracking-widest">(Ref. Grocery Sources)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsEmailModalOpen(true)}
                        className="bg-white text-black px-6 py-3 rounded-none border-4 border-black font-black uppercase tracking-widest text-sm hover:bg-emerald-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      >
                        Email List
                        <Mail className="w-4 h-4" />
                      </button>
                      {user && (
                        <button 
                          onClick={saveMealPlan}
                          disabled={isSaving}
                          className="bg-emerald-500 text-white px-6 py-3 rounded-none border-4 border-black font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                        >
                          Save Meal Plan
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {shoppingSources.length > 0 && (
                    <div className="bg-black p-6 rounded-none border-4 border-emerald-500 shadow-[6px_6px_0px_0px_rgba(16,185,129,1)]">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Reference Stores:</p>
                      <div className="flex flex-wrap gap-3">
                        {shoppingSources.map(s => (
                          <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {s.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </div>
        </div>
      )}

        {activePage === 'meal-plan' && (
          <div className="space-y-12">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                  Current Week
                </h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {mealPlan.filter(m => m.is_current).length} Meals
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mealPlan.filter(m => m.is_current).map((meal, i) => (
                  <div key={i} className="bg-white p-8 rounded-none border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg leading-tight">{meal.name}</h3>
                      <button
                        onClick={() => toggleFavorite(meal)}
                        className={`p-1 rounded-full transition-colors ${
                          favorites.some(f => f.name === meal.name)
                            ? 'text-amber-500 hover:bg-amber-50'
                            : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${favorites.some(f => f.name === meal.name) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">{meal.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">${meal.estimatedCost}</span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        {meal.prepTime} + {meal.cookTime}
                      </div>
                    </div>
                  </div>
                ))}
                {mealPlan.filter(m => m.is_current).length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50 rounded-none border-4 border-dashed border-black">
                    <p className="text-slate-400 italic">No meals planned for this week yet.</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <History className="w-6 h-6 text-slate-400" />
                  Previous Meals
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                {mealPlan.filter(m => !m.is_current).map((meal, i) => (
                  <div key={i} className="bg-white p-8 rounded-none border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] grayscale-[0.5]">
                    <h3 className="font-bold text-lg leading-tight mb-2">{meal.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">{meal.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">${meal.estimatedCost}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Planned: {new Date(meal.planned_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {mealPlan.filter(m => !m.is_current).length === 0 && (
                  <p className="text-slate-400 italic px-4">No previous meals found.</p>
                )}
              </div>
            </section>
          </div>
        )}

        {activePage === 'favorites' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500 fill-current" />
                Your Favorites
              </h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {favorites.length} Saved
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((meal, i) => (
                <div key={i} className="bg-white p-8 rounded-none border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg leading-tight">{meal.name}</h3>
                    <button
                      onClick={() => toggleFavorite(meal)}
                      className="p-1 rounded-full text-amber-500 hover:bg-amber-50 transition-colors"
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4">{meal.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">${meal.estimatedCost}</span>
                    <button 
                      onClick={() => {
                        setMealIdeas([meal, ...mealIdeas.filter(m => m.name !== meal.name)]);
                        setActivePage('home');
                      }}
                      className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors"
                    >
                      Add to Plan
                    </button>
                  </div>
                </div>
              ))}
              {favorites.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-none border-4 border-dashed border-black">
                  <Heart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 italic">You haven't favorited any meals yet.</p>
                  <button 
                    onClick={() => setActivePage('home')}
                    className="mt-4 text-emerald-600 font-bold hover:underline text-sm"
                  >
                    Go discover some meals
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
