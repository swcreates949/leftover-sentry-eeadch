
export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  ingredients: string[];
  categories: string[];
  instructions: string | null;
  prep_time_minutes: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  created_at: string;
}

export interface RecipeRating {
  id: string;
  recipe_id: string;
  device_id: string;
  rating: number;
  leftover_items: string[];
  created_at: string;
}

export interface RecipeSuggestion extends Recipe {
  matchScore: number;
  matchedCategories: string[];
  matchedIngredients: string[];
  userRating?: number;
  averageRating?: number;
  ratingCount?: number;
}
