import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Supplier } from '../lib/types';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetch() {
    setLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
    if (error) setError(error.message);
    else setSuppliers(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetch(); }, []);

  async function createSupplier(values: Partial<Supplier>) {
    const { error } = await supabase.from('suppliers').insert([values]);
    if (error) throw error;
    await fetch();
  }

  async function updateSupplier(id: string, values: Partial<Supplier>) {
    const { error } = await supabase.from('suppliers').update(values).eq('id', id);
    if (error) throw error;
    await fetch();
  }

  async function deleteSupplier(id: string) {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  }

  return { suppliers, loading, error, refetch: fetch, createSupplier, updateSupplier, deleteSupplier };
}
