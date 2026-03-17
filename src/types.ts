export interface InventoryItem {
  id: string;
  name: string;
  quantity?: string;
}

export interface PantryItem {
  id: string;
  name: string;
}

export interface Source {
  id: string;
  url: string;
  name: string;
}

export interface ShoppingSource {
  id: string;
  url: string;
  name: string;
}

export interface Allergy {
  id: string;
  ingredient: string;
}

export interface MealIdea {
  id: string;
  name: string;
  description: string;
  ingredients: { name: string; amount: string; onSaleAt?: string }[];
  sourceUrl?: string;
  estimatedCost: number;
  prepTime: string;
  cookTime: string;
  instructions: string[];
}

export interface ShoppingList {
  toBuy: { name: string; amount: string; meals: string[]; onSaleAt?: string }[];
  fromInventory: { name: string; amount: string; meals: string[] }[];
  totalEstimatedCost: number;
}

export interface AppData {
  inventory: InventoryItem[];
  pantry: PantryItem[];
  sources: Source[];
  shoppingSources: ShoppingSource[];
  allergies: Allergy[];
}

export interface FavoriteMeal extends MealIdea {
  user_id: string;
  created_at: string;
}

export interface MealPlanItem extends MealIdea {
  user_id: string;
  planned_at: string;
  is_current: boolean;
}
