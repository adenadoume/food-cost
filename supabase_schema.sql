-- Food Cost App — Supabase Schema
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  ime_code text,
  name text NOT NULL,
  tax_id text,
  tax_office text,
  city text,
  business_type text,
  address text,
  phone text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

CREATE TABLE IF NOT EXISTS ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  ime_code text,
  name text NOT NULL UNIQUE,
  cost_per_kg numeric DEFAULT 0,
  category text,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  unit_type text DEFAULT 'kg',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_supplier ON ingredients(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);

CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  name text NOT NULL UNIQUE,
  category text,
  restaurant text[] DEFAULT '{}',
  merides integer DEFAULT 1,
  final_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recipes_restaurant ON recipes USING GIN(restaurant);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE SET NULL,
  grams numeric DEFAULT 0,
  kg_tmx numeric DEFAULT 1000,
  comments text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ri_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ri_ingredient ON recipe_ingredients(ingredient_id);

-- RLS: allow anon full access (no auth in MVP)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_suppliers" ON suppliers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_ingredients" ON ingredients FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_recipes" ON recipes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_recipe_ingredients" ON recipe_ingredients FOR ALL TO anon USING (true) WITH CHECK (true);
