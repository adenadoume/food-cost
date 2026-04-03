import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Recipe, RecipeIngredient, RecipeWithCosts } from '../lib/types';
import { recipeCost, vatAmount, totalCost, totalPerMeride, priceX3, priceX4, lineCost } from '../lib/businessLogic';

// Fetch all recipe_ingredients for a set of recipe IDs, joined with ingredients
async function fetchAllBridgeRows(recipeIds: string[]): Promise<RecipeIngredient[]> {
  if (recipeIds.length === 0) return [];
  const { data } = await supabase
    .from('recipe_ingredients')
    .select('*, ingredients(id, name, cost_per_kg, unit_type, category)')
    .in('recipe_id', recipeIds);
  return data ?? [];
}

function computeCosts(recipe: Recipe, bridgeRows: RecipeIngredient[]): RecipeWithCosts {
  const lines = bridgeRows.filter(r => r.recipe_id === recipe.id);
  const cost = recipeCost(lines);
  const vat = vatAmount(cost);
  const total = totalCost(cost);
  const perMeride = totalPerMeride(total, recipe.merides);
  return {
    ...recipe,
    recipe_cost: cost,
    vat_13: vat,
    total_cost: total,
    total_per_meride: perMeride,
    price_x3: priceX3(perMeride),
    price_x4: priceX4(perMeride),
  };
}

export function useRecipes(restaurantFilter?: string) {
  const [recipes, setRecipes] = useState<RecipeWithCosts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetch() {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('recipes').select('*').order('name', { ascending: true });
      if (restaurantFilter) {
        query = query.contains('restaurant', [restaurantFilter]);
      }
      const { data: recipeData, error: recipeErr } = await query;
      if (recipeErr) throw recipeErr;

      const ids = (recipeData ?? []).map((r: Recipe) => r.id);
      const bridgeRows = await fetchAllBridgeRows(ids);

      const enriched = (recipeData ?? []).map((r: Recipe) => computeCosts(r, bridgeRows));
      setRecipes(enriched);
    } catch (e: any) {
      setError(e.message ?? 'Error loading recipes');
    }
    setLoading(false);
  }

  useEffect(() => { fetch(); }, [restaurantFilter]);

  async function updateRecipe(id: string, values: Partial<Recipe>) {
    const { error } = await supabase
      .from('recipes')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await fetch();
  }

  async function createRecipe(values: Partial<Recipe>) {
    const { error } = await supabase.from('recipes').insert([values]);
    if (error) throw error;
    await fetch();
  }

  async function deleteRecipe(id: string) {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  }

  return { recipes, loading, error, refetch: fetch, updateRecipe, createRecipe, deleteRecipe };
}

// Export the line cost helper for use in drawers
export { lineCost };
