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
  Calendar,
  Search,
  AlertCircle,
  User as UserIcon,
  LogIn,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { InventoryItem, Source, ShoppingSource, Allergy, MealIdea, ShoppingList, PantryItem, AppData, FavoriteMeal, MealPlanItem } from './types';
import { 
  OperationType, 
  handleFirestoreError, 
  ErrorBoundary 
} from './lib/firebase-utils';

// Components
import { InventorySection } from './components/InventorySection';
import { PantrySection } from './components/PantrySection';
import { SourceSection } from './components/SourceSection';
import { ShoppingSourceSection } from './components/ShoppingSourceSection';
import { AllergySection } from './components/AllergySection';
import { ProteinSection } from './components/ProteinSection';
import { MealIdeaCard } from './components/MealIdeaCard';
import { ShoppingListSection } from './components/ShoppingListSection';
import { MealPlanSection } from './components/MealPlanSection';
import { FavoritesSection } from './components/FavoritesSection';
import { EmailModal } from './components/EmailModal';

const DotLottieWC = 'dotlottie-wc' as any;

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
  const [activeModel, setActiveModel] = useState<string>("gemini-3-flash-preview");
  const [manuallyAddedToBuy, setManuallyAddedToBuy] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quotaCooldown, setQuotaCooldown] = useState<number | null>(null);
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
  const [zipCode, setZipCode] = useState('');
  const [isSearchingStores, setIsSearchingStores] = useState(false);
  const [proteinPreferences, setProteinPreferences] = useState<Record<string, number>>({
    beef: 1,
    chicken: 1,
    pork: 1,
    fish: 1,
    vegetarian: 1
  });

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
    });

    // Test Firestore connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    return () => unsubscribe();
  }, []);

  // Sync Data with Firebase
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const path = `users/${user.uid}/settings/current`;
      try {
        const docRef = doc(db, path);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.inventory) setInventory(data.inventory);
          if (data.pantry) setPantry(data.pantry);
          if (data.sources) setSources(data.sources);
          if (data.shoppingSources) setShoppingSources(data.shoppingSources);
          if (data.allergies) setAllergies(data.allergies);
          if (data.proteinPreferences) setProteinPreferences(data.proteinPreferences);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    };

    fetchData();
    loadSettings(user.uid); // Load favorites and meal plans
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const saveData = async () => {
      const path = `users/${user.uid}/settings/current`;
      try {
        await setDoc(doc(db, path), {
          inventory,
          pantry,
          sources,
          shoppingSources,
          allergies,
          proteinPreferences,
          updated_at: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    };

    const timeoutId = setTimeout(saveData, 2000);
    return () => clearTimeout(timeoutId);
  }, [user, inventory, pantry, sources, shoppingSources, allergies, proteinPreferences]);

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
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign in');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign out');
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    const path = `users/${user.uid}/settings/current`;
    try {
      const settings: AppData = {
        inventory,
        pantry,
        sources,
        shoppingSources,
        allergies,
        proteinPreferences
      };

      await setDoc(doc(db, path), {
        ...settings,
        updated_at: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const loadSettings = async (userId: string) => {
    try {
      // Load Favorites
      const favsPath = `users/${userId}/favorites`;
      const favsSnap = await getDocs(collection(db, favsPath));
      const favsData = favsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FavoriteMeal));
      setFavorites(favsData);

      // Load Meal Plan
      const planPath = `users/${userId}/meal_plans`;
      const planQuery = query(collection(db, planPath), orderBy('planned_at', 'desc'));
      const planSnap = await getDocs(planQuery);
      const planData = planSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealPlanItem));
      setMealPlan(planData);

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
    const path = `users/${user.uid}/favorites`;
    try {
      if (isFav) {
        const favToDelete = favorites.find(f => f.name === meal.name);
        if (favToDelete?.id) {
          await deleteDoc(doc(db, path, favToDelete.id));
          setFavorites(favorites.filter(f => f.name !== meal.name));
        }
      } else {
        const { id, ...mealData } = meal;
        const newFavData = {
          ...mealData,
          user_id: user.uid,
          created_at: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, path), newFavData);
        setFavorites([...favorites, { ...newFavData, id: docRef.id } as FavoriteMeal]);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
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
    const path = `users/${user.uid}/meal_plans`;
    try {
      // 1. Mark existing current meals as previous
      const currentQuery = query(collection(db, path), where('is_current', '==', true));
      const currentSnap = await getDocs(currentQuery);
      
      const updatePromises = currentSnap.docs.map(d => 
        updateDoc(doc(db, path, d.id), { is_current: false })
      );
      await Promise.all(updatePromises);

      // 2. Insert new meals as current
      const insertPromises = selectedMeals.map(m => {
        const { id, ...mealData } = m;
        return addDoc(collection(db, path), {
          ...mealData,
          user_id: user.uid,
          planned_at: serverTimestamp(),
          is_current: true
        });
      });

      const newDocs = await Promise.all(insertPromises);
      
      // Reload meal plan to get updated state
      await loadSettings(user.uid);
      
      // Clear selection
      setSelectedMealIds([]);
      setManuallyAddedToBuy([]);
      alert("Meal plan saved successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const markMealAsCooked = async (meal: MealPlanItem) => {
    if (!user || !meal.id) return;
    
    const path = `users/${user.uid}/meal_plans`;
    try {
      await updateDoc(doc(db, path, meal.id), { 
        is_current: false, 
        planned_at: serverTimestamp() 
      });

      setMealPlan(prev => prev.map(m => 
        m.id === meal.id ? { ...m, is_current: false, planned_at: new Date().toISOString() } : m
      ));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${path}/${meal.id}`);
    }
  };

  const markMealAsNotCooked = async (meal: MealPlanItem) => {
    if (!user || !meal.id) return;
    
    const path = `users/${user.uid}/meal_plans`;
    try {
      await updateDoc(doc(db, path, meal.id), { 
        is_current: false, 
        did_not_cook: true, 
        planned_at: serverTimestamp() 
      });

      setMealPlan(prev => prev.map(m => 
        m.id === meal.id ? { ...m, is_current: false, did_not_cook: true, planned_at: new Date().toISOString() } : m
      ));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${path}/${meal.id}`);
    }
  };

  const updateMealPlannedAt = async (meal: MealPlanItem, newDate: string) => {
    if (!user || !meal.id) return;
    const path = `users/${user.uid}/meal_plans`;
    try {
      const isoDate = new Date(newDate + 'T12:00:00Z');
      await updateDoc(doc(db, path, meal.id), { 
        planned_at: Timestamp.fromDate(isoDate) 
      });

      setMealPlan(prev => prev.map(m => 
        m.id === meal.id ? { ...m, planned_at: isoDate.toISOString() } : m
      ));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${path}/${meal.id}`);
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
    const exists = sources.find(s => s.url === url);
    if (exists) {
      setSources(sources.filter(s => s.url !== url));
    } else {
      setSources([...sources, { id: crypto.randomUUID(), name, url }]);
    }
  };

  const searchStores = async () => {
    if (!zipCode.trim()) return;
    setIsSearchingStores(true);
    setError(null);
    const ai = getGenAI();
    if (!ai) {
      setError("Gemini API key not found. Please check your settings.");
      setIsSearchingStores(false);
      return;
    }

    const models = ["gemini-3-flash-preview", "gemini-3.1-flash-lite-preview", "gemini-2.5-flash"];
    let success = false;
    let lastErr: any = null;

    for (const modelName of models) {
      if (success) break;
      setActiveModel(modelName);
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Find 5 major grocery stores within a 5 mile radius of zip code ${zipCode}. For each store, find the direct URL to their weekly sales or circular page. Return the results as a JSON array of objects with "name" and "url" properties. 
          
          IMPORTANT: Return ONLY the JSON array. Do not include any conversational text or explanation.`,
          config: {
            tools: [{ googleSearch: {} }],
          }
        });

        let jsonText = response.text || '[]';
        
        // Robust JSON extraction
        const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
        const objectMatch = jsonText.match(/\{[\s\S]*\}/);
        const cleanJson = arrayMatch ? arrayMatch[0] : (objectMatch ? objectMatch[0] : jsonText);

        const results = JSON.parse(cleanJson);
        const newSources = results.map((r: any) => ({
          id: crypto.randomUUID(),
          name: r.name,
          url: r.url
        }));
        setShoppingSources(newSources);
        success = true;
      } catch (err: any) {
        lastErr = err;
        const errorStr = err.message || String(err);
        if (!errorStr.includes('429') && !errorStr.includes('RESOURCE_EXHAUSTED')) {
          break; // Not a quota error, stop trying models
        }
        console.warn(`Model ${modelName} exhausted, trying next...`);
      }
    }

    if (!success && lastErr) {
      console.error("Error searching stores:", lastErr);
      let errorMessage = "Failed to find stores. Please try again.";
      
      const isQuotaError = lastErr.message?.includes('429') || lastErr.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaError) {
        errorMessage = "All available search models are currently at their limit. Please wait a moment.";
        const retryMatch = lastErr.message.match(/retry in (\d+\.?\d*)s/);
        if (retryMatch) {
          setQuotaCooldown(Math.ceil(parseFloat(retryMatch[1])));
        } else {
          setQuotaCooldown(60);
        }
      } else {
        errorMessage = lastErr instanceof Error ? lastErr.message : String(lastErr);
      }
      
      setError(errorMessage);
    }
    setIsSearchingStores(false);
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
    const totalMeals = (Object.values(proteinPreferences) as number[]).reduce((a, b) => a + b, 0) || 6;
    const proteinRequirements = (Object.entries(proteinPreferences) as [string, number][])
      .filter(([_, count]) => count > 0)
      .map(([protein, count]) => `${count} ${protein} based meals`)
      .join(', ');

    return `
        Generate ${totalMeals} meal ideas based on:
        - Inventory: ${inventory.map(i => i.name).join(', ')}
        - Pantry: ${pantry.map(p => p.name).join(', ')}
        - Recipe Sources: ${sources.map(s => `${s.name} (${s.url})`).join(', ')}
        - Sales: ${shoppingSources.map(s => `${s.name} (${s.url})`).join(', ')}
        - Allergies: ${allergies.map(a => a.ingredient).join(', ')}
        - Protein Requirements: Include exactly ${proteinRequirements || 'a variety of meals'}.
        
        Rules:
        1. Prioritize Inventory and Sales items.
        2. Avoid Allergies.
        3. estimatedCost = cost of items NOT in Inventory/Pantry.
        4. Use Google Search to find EXACT recipe URLs. 
           - CRITICAL: DO NOT guess, hallucinate, or construct URLs that you haven't verified via search. 
           - If you cannot find a direct, verified URL to the recipe, leave "sourceUrl" as an empty string. 
           - Prioritize recipes from the provided "Recipe Sources" if they have relevant content.
           - Ensure the URL is a direct link to the recipe page, not just the homepage of a site.
        5. Return ONLY a JSON array of ${totalMeals} objects. Do not include any conversational text, markdown formatting outside the JSON, or explanation.
        {
          "name": "string",
          "description": "string",
          "ingredients": [{ "name": "string", "amount": "string", "onSaleAt": "string|null" }],
          "sourceUrl": "string",
          "estimatedCost": number,
          "prepTime": "string",
          "cookTime": "string",
          "instructions": ["string"]
        }
      `;
  };

  useEffect(() => {
    if (quotaCooldown !== null) {
      const timer = setInterval(() => {
        setQuotaCooldown(prev => {
          if (prev === null || prev <= 1) return null;
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quotaCooldown]);

  const generateMeals = async (isRegen = false) => {
    if (quotaCooldown !== null) return;
    
    if (isRegen) setIsRegenerating(true);
    else setIsGenerating(true);
    
    setError(null);
    const genAI = getGenAI();
    if (!genAI) {
      setError("GEMINI_API_KEY is missing. Please set it in your environment variables.");
      setIsGenerating(false);
      setIsRegenerating(false);
      return;
    }

    const models = ["gemini-3-flash-preview", "gemini-3.1-flash-lite-preview", "gemini-2.5-flash"];
    let success = false;
    let lastErr: any = null;

    for (const modelName of models) {
      if (success) break;
      setActiveModel(modelName);
      try {
        const prompt = getMealPrompt();
        const response = await genAI.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          }
        });

        let jsonText = response.text || '[]';
        
        // Robust JSON extraction
        const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
        const objectMatch = jsonText.match(/\{[\s\S]*\}/);
        const cleanJson = arrayMatch ? arrayMatch[0] : (objectMatch ? objectMatch[0] : jsonText);

        const newMeals = JSON.parse(cleanJson).map((m: any) => ({ ...m, id: crypto.randomUUID() }));
        
        if (isRegen) {
          const selectedMeals = mealIdeas.filter(m => selectedMealIds.includes(m.id));
          setMealIdeas([...selectedMeals, ...newMeals]);
        } else {
          setMealIdeas(newMeals);
          setSelectedMealIds([]);
        }
        success = true;
      } catch (err: any) {
        lastErr = err;
        const errorStr = err.message || String(err);
        if (!errorStr.includes('429') && !errorStr.includes('RESOURCE_EXHAUSTED')) {
          break; // Not a quota error
        }
        console.warn(`Model ${modelName} exhausted, trying next...`);
      }
    }

    if (!success && lastErr) {
      console.error(lastErr);
      
      let errorMessage = "Failed to generate meal ideas. Please try again.";
      const errorStr = lastErr.message || String(lastErr);
      
      if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = "All available models are currently at their limit. Please wait a moment.";
        
        try {
          const parsed = JSON.parse(errorStr);
          if (parsed.error?.message) {
            errorMessage = `Quota Limit: ${parsed.error.message}`;
          }
        } catch (e) {}

        const retryMatch = errorStr.match(/retry in (\d+\.?\d*)s/);
        if (retryMatch) {
          setQuotaCooldown(Math.ceil(parseFloat(retryMatch[1])));
        } else {
          setQuotaCooldown(120);
        }
      } else {
        errorMessage = lastErr instanceof Error ? lastErr.message : String(lastErr);
      }
      
      setError(errorMessage);
    }
    
    setIsGenerating(false);
    setIsRegenerating(false);
  };

  const shoppingList = useMemo((): ShoppingList => {
    const selectedMeals = mealIdeas.filter(m => selectedMealIds.includes(m.id));
    const toBuyMap = new Map<string, { amounts: string[]; meals: string[]; onSaleAt?: string }>();
    const fromInventoryMap = new Map<string, { amounts: string[]; meals: string[]; isPantry: boolean }>();
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

        // Check if manually forced to shopping list
        const isManuallyAdded = manuallyAddedToBuy.includes(ing.name);

        if ((isAtHome || isInPantry) && !isManuallyAdded) {
          if (!fromInventoryMap.has(ing.name)) {
            fromInventoryMap.set(ing.name, { amounts: [], meals: [], isPantry: isInPantry });
          }
          const entry = fromInventoryMap.get(ing.name)!;
          entry.amounts.push(ing.amount);
          if (!entry.meals.includes(meal.name)) {
            entry.meals.push(meal.name);
          }
          // If we ever find it in the pantry, we mark it as a pantry item to suppress the warning
          if (isInPantry) entry.isPantry = true;
        } else {
          if (!toBuyMap.has(ing.name)) {
            toBuyMap.set(ing.name, { amounts: [], meals: [], onSaleAt: ing.onSaleAt });
          }
          const entry = toBuyMap.get(ing.name)!;
          if (!entry.onSaleAt && ing.onSaleAt) {
            entry.onSaleAt = ing.onSaleAt;
          }
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
      meals: entry.meals,
      onSaleAt: entry.onSaleAt
    }));

    const fromInventory = Array.from(fromInventoryMap.entries()).map(([name, entry]) => ({
      name,
      amount: combineAmounts(entry.amounts),
      meals: entry.meals,
      isPantry: entry.isPantry
    }));

    return { toBuy, fromInventory, totalEstimatedCost };
  }, [selectedMealIds, mealIdeas, inventory, pantry, manuallyAddedToBuy]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#f5f5f5] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Email Modal */}
        <EmailModal 
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          emailSent={emailSent}
          emailForm={emailForm}
          setEmailForm={setEmailForm}
          handleSendEmail={handleSendEmail}
          isSendingEmail={isSendingEmail}
          getFormattedDate={getFormattedDate}
        />

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-black flex items-center gap-2">
              <UtensilsCrossed className="w-10 h-10 text-emerald-500" />
              Quick Planner 3000
            </h1>
            <p className="text-slate-600 mt-1 font-bold uppercase tracking-widest text-xs">Plan Smarter with Robots!</p>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-3 w-full md:w-auto">
            {isAuthLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : user ? (
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full md:w-auto justify-center md:justify-start">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-6 h-6 rounded-none" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-slate-500" />
                  )}
                  <span className="text-sm font-bold text-black truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-black hover:bg-red-500 hover:text-white border-2 border-black rounded-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none w-full md:w-auto"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-none font-black hover:bg-emerald-500 transition-all shadow-[6px_6px_0px_0px_rgba(16,185,129,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none w-full md:w-auto"
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
            <InventorySection 
              inventory={inventory}
              collapsed={collapsed.inventory}
              toggleSection={() => toggleSection('inventory')}
              newItem={newItem}
              setNewItem={setNewItem}
              addInventory={addInventory}
              removeInventory={removeInventory}
            />

            <PantrySection 
              pantry={pantry}
              collapsed={collapsed.pantry}
              toggleSection={() => toggleSection('pantry')}
              newPantryItem={newPantryItem}
              setNewPantryItem={setNewPantryItem}
              addPantry={addPantry}
              removePantry={removePantry}
            />

            <ProteinSection 
              proteinPreferences={proteinPreferences}
              setProteinPreferences={setProteinPreferences}
            />

            <SourceSection 
              sources={sources}
              collapsed={collapsed.sources}
              toggleSection={() => toggleSection('sources')}
              newSourceName={newSourceName}
              setNewSourceName={setNewSourceName}
              newSourceUrl={newSourceUrl}
              setNewSourceUrl={setNewSourceUrl}
              addSource={addSource}
              removeSource={removeSource}
              quickAddSource={quickAddSource}
            />

            <ShoppingSourceSection 
              shoppingSources={shoppingSources}
              collapsed={collapsed.shopping}
              toggleSection={() => toggleSection('shopping')}
              zipCode={zipCode}
              setZipCode={setZipCode}
              searchStores={searchStores}
              isSearchingStores={isSearchingStores}
              quotaCooldown={quotaCooldown}
              removeShoppingSource={removeShoppingSource}
              newShopName={newShopName}
              setNewShopName={setNewShopName}
              newShopUrl={newShopUrl}
              setNewShopUrl={setNewShopUrl}
              addShoppingSource={addShoppingSource}
            />

            <AllergySection 
              allergies={allergies}
              collapsed={collapsed.allergies}
              toggleSection={() => toggleSection('allergies')}
              newAllergy={newAllergy}
              setNewAllergy={setNewAllergy}
              addAllergy={addAllergy}
              removeAllergy={removeAllergy}
            />

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
                    <MealIdeaCard 
                      key={meal.id}
                      meal={meal}
                      index={index}
                      user={user}
                      favorites={favorites}
                      selectedMealIds={selectedMealIds}
                      toggleMealSelection={toggleMealSelection}
                      toggleFavorite={toggleFavorite}
                      hoveredRecipeId={hoveredRecipeId}
                      setHoveredRecipeId={setHoveredRecipeId}
                    />
                  ))}
                </AnimatePresence>
                
                {mealIdeas.length === 0 && !isGenerating && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-black border-4 border-dashed border-black rounded-none bg-slate-50">
                    <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-2xl font-black uppercase tracking-tighter">No meals generated yet</p>
                    
                    <button
                      onClick={() => generateMeals(false)}
                      disabled={isGenerating || isRegenerating || quotaCooldown !== null}
                      className="mt-6 bg-emerald-500 hover:bg-black text-white px-8 py-4 rounded-none font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed relative group"
                    >
                      {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                      {quotaCooldown !== null ? `Wait ${quotaCooldown}s` : "Generate Meal Ideas"}
                      
                      {(isGenerating || isRegenerating) && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 font-bold whitespace-nowrap rounded-sm animate-pulse">
                          USING: {activeModel.toUpperCase()}
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {isGenerating && (
                  <div className="col-span-full py-10 flex flex-col items-center justify-center text-center">
                    <DotLottieWC 
                      src="https://lottie.host/90b7823d-16e9-412e-9203-aeffcff9ba69/tImrIMNKL2.lottie" 
                      style={{ width: '300px', height: '300px' }} 
                      autoplay 
                      loop
                    ></DotLottieWC>
                    <p className="text-2xl font-black uppercase tracking-tighter text-black mt-4">Cooking up ideas...</p>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Gemini is analyzing your inventory, sales, and allergies.</p>
                  </div>
                )}
              </div>

              {mealIdeas.length > 0 && (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <button
                    onClick={() => generateMeals(true)}
                    disabled={isGenerating || isRegenerating || quotaCooldown !== null}
                    className="bg-white border-4 border-black text-black px-10 py-4 rounded-none font-black uppercase tracking-widest flex items-center gap-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-emerald-500" />}
                    {quotaCooldown !== null ? `Wait ${quotaCooldown}s` : "Regenerate (Keep Selected)"}
                  </button>
                  
                  {user && favorites.length > 0 && (
                    <div className="text-center">
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
              <ShoppingListSection 
                shoppingList={shoppingList}
                manuallyAddedToBuy={manuallyAddedToBuy}
                setManuallyAddedToBuy={setManuallyAddedToBuy}
                hoveredIngredient={hoveredIngredient}
                setHoveredIngredient={setHoveredIngredient}
                saveMealPlan={saveMealPlan}
                isSaving={isSaving}
                setIsEmailModalOpen={setIsEmailModalOpen}
                user={user}
                shoppingSources={shoppingSources}
              />
            )}
          </div>
        </div>
      )}

        {activePage === 'meal-plan' && (
          <MealPlanSection 
            mealPlan={mealPlan}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            markMealAsCooked={markMealAsCooked}
            markMealAsNotCooked={markMealAsNotCooked}
            updateMealPlannedAt={updateMealPlannedAt}
          />
        )}

        {activePage === 'favorites' && (
          <FavoritesSection 
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            setMealIdeas={setMealIdeas}
            mealIdeas={mealIdeas}
            setActivePage={setActivePage}
          />
        )}
        </main>
      </div>
    </div>
    </ErrorBoundary>
  );
}
