
import { createClient } from '@supabase/supabase-js';
import { Recipe, RecipeRating, RecipeSuggestion } from '@/types/recipe';
import { Leftover } from '@/types/leftover';
import * as Device from 'expo-constants';

const supabaseUrl = 'https://wvyzezzauxlofrtvjctj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2eXplenphdXhsb2ZydHZqY3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjY2ODQsImV4cCI6MjA3OTE0MjY4NH0.-L0vRhN2g5ko0pUlNZLYwgtN3BAuH_mcY-uv46u4MdI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get a unique device ID for storing ratings
export function getDeviceId(): string {
  const deviceId = Device.default.sessionId || Device.default.installationId || 'unknown-device';
  return deviceId;
}

// Fetch all recipes from the database
export async function fetchRecipes(): Promise<Recipe[]> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error fetching recipes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.log('Error fetching recipes:', error);
    return [];
  }
}

// Calculate match score between leftovers and a recipe
function calculateMatchScore(recipe: Recipe, leftovers: Leftover[]): {
  score: number;
  matchedCategories: string[];
  matchedIngredients: string[];
} {
  const leftoverCategories = leftovers
    .map(l => l.category?.toLowerCase())
    .filter(Boolean) as string[];
  
  const leftoverNames = leftovers
    .map(l => l.name.toLowerCase())
    .filter(Boolean);

  const recipeCategories = recipe.categories.map(c => c.toLowerCase());
  const recipeIngredients = recipe.ingredients.map(i => i.toLowerCase());

  // Find matching categories
  const matchedCategories = recipeCategories.filter(rc =>
    leftoverCategories.some(lc => lc === rc)
  );

  // Find matching ingredients (fuzzy match)
  const matchedIngredients = recipeIngredients.filter(ri =>
    leftoverNames.some(ln => 
      ln.includes(ri) || ri.includes(ln) || ln === ri
    )
  );

  // Calculate score (0-100)
  const categoryScore = (matchedCategories.length / Math.max(recipeCategories.length, 1)) * 50;
  const ingredientScore = (matchedIngredients.length / Math.max(recipeIngredients.length, 1)) * 50;
  const score = Math.round(categoryScore + ingredientScore);

  return {
    score,
    matchedCategories,
    matchedIngredients,
  };
}

// Get recipe suggestions based on current leftovers
export async function getRecipeSuggestions(leftovers: Leftover[]): Promise<RecipeSuggestion[]> {
  try {
    if (leftovers.length === 0) {
      return [];
    }

    const recipes = await fetchRecipes();
    const deviceId = getDeviceId();

    // Get user's ratings
    const { data: ratings } = await supabase
      .from('recipe_ratings')
      .select('*')
      .eq('device_id', deviceId);

    const userRatings = new Map(
      (ratings || []).map(r => [r.recipe_id, r.rating])
    );

    // Calculate match scores and create suggestions
    const suggestions: RecipeSuggestion[] = recipes
      .map(recipe => {
        const { score, matchedCategories, matchedIngredients } = calculateMatchScore(recipe, leftovers);
        
        return {
          ...recipe,
          matchScore: score,
          matchedCategories,
          matchedIngredients,
          userRating: userRatings.get(recipe.id),
        };
      })
      .filter(s => s.matchScore > 0) // Only show recipes with some match
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score

    return suggestions;
  } catch (error) {
    console.log('Error getting recipe suggestions:', error);
    return [];
  }
}

// Rate a recipe
export async function rateRecipe(
  recipeId: string,
  rating: number,
  leftoverItems: string[]
): Promise<boolean> {
  try {
    const deviceId = getDeviceId();

    // Check if user already rated this recipe
    const { data: existingRating } = await supabase
      .from('recipe_ratings')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existingRating) {
      // Update existing rating
      const { error } = await supabase
        .from('recipe_ratings')
        .update({
          rating,
          leftover_items: leftoverItems,
        })
        .eq('id', existingRating.id);

      if (error) {
        console.log('Error updating rating:', error);
        return false;
      }
    } else {
      // Insert new rating
      const { error } = await supabase
        .from('recipe_ratings')
        .insert({
          recipe_id: recipeId,
          device_id: deviceId,
          rating,
          leftover_items: leftoverItems,
        });

      if (error) {
        console.log('Error inserting rating:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.log('Error rating recipe:', error);
    return false;
  }
}

// Get user's rating for a specific recipe
export async function getUserRating(recipeId: string): Promise<number | undefined> {
  try {
    const deviceId = getDeviceId();

    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('rating')
      .eq('recipe_id', recipeId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error || !data) {
      return undefined;
    }

    return data.rating;
  } catch (error) {
    console.log('Error getting user rating:', error);
    return undefined;
  }
}
