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
  ingredients: { name: string; amount: string }[];
  sourceUrl?: string;
  estimatedCost: number;
}

export interface ShoppingList {
  toBuy: { name: string; amount: string }[];
  fromInventory: { name: string; amount: string }[];
  totalEstimatedCost: number;
}

export interface AppData {
  inventory: InventoryItem[];
  pantry: PantryItem[];
  sources: Source[];
  shoppingSources: ShoppingSource[];
  allergies: Allergy[];
}
