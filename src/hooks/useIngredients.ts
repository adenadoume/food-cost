import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ingredient } from '../lib/types';

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetch() {
    setLoading(true);
    const { data, error } = await supabase
      .from('ingredients')
      .select('*, suppliers(id, name)')
      .order('name', { ascending: true });
    if (error) setError(error.message);
    else setIngredients(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetch(); }, []);

  async function createIngredient(values: Partial<Ingredient>) {
    const { error } = await supabase.from('ingredients').insert([values]);
    if (error) throw error;
    await fetch();
  }

  async function updateIngredient(id: string, values: Partial<Ingredient>) {
    const { error } = await supabase.from('ingredients').update(values).eq('id', id);
    if (error) throw error;
    await fetch();
  }

  async function deleteIngredient(id: string) {
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  }

  return { ingredients, loading, error, refetch: fetch, createIngredient, updateIngredient, deleteIngredient };
}
