import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RecipeIngredient } from '../lib/types';

export function useRecipeIngredients(recipeId: string | null) {
  const [rows, setRows] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!recipeId) { setRows([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('recipe_ingredients')
      .select('*, ingredients(id, name, cost_per_kg, unit_type, category, supplier_id, suppliers(name))')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: true });
    setRows(data ?? []);
    setLoading(false);
  }, [recipeId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addRow(values: { ingredient_id: string; grams: number; kg_tmx: number; comments?: string }) {
    const { error } = await supabase.from('recipe_ingredients').insert([{
      recipe_id: recipeId,
      ...values,
    }]);
    if (error) throw error;
    await fetch();
  }

  async function updateRow(id: string, values: Partial<RecipeIngredient>) {
    const { error } = await supabase.from('recipe_ingredients').update(values).eq('id', id);
    if (error) throw error;
    await fetch();
  }

  async function deleteRow(id: string) {
    const { error } = await supabase.from('recipe_ingredients').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  }

  return { rows, loading, refetch: fetch, addRow, updateRow, deleteRow };
}
