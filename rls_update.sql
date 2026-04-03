-- Run this in Supabase SQL Editor to enforce read-only for anonymous users
-- and write access only for authenticated (logged-in) users.

-- Drop existing open policies
DROP POLICY IF EXISTS "anon_all_suppliers"          ON suppliers;
DROP POLICY IF EXISTS "anon_all_ingredients"        ON ingredients;
DROP POLICY IF EXISTS "anon_all_recipes"            ON recipes;
DROP POLICY IF EXISTS "anon_all_recipe_ingredients" ON recipe_ingredients;

-- SUPPLIERS: anon read, auth write
CREATE POLICY "anon_read_suppliers"   ON suppliers FOR SELECT TO anon          USING (true);
CREATE POLICY "auth_write_suppliers"  ON suppliers FOR ALL    TO authenticated  USING (true) WITH CHECK (true);

-- INGREDIENTS: anon read, auth write
CREATE POLICY "anon_read_ingredients"  ON ingredients FOR SELECT TO anon          USING (true);
CREATE POLICY "auth_write_ingredients" ON ingredients FOR ALL    TO authenticated  USING (true) WITH CHECK (true);

-- RECIPES: anon read, auth write
CREATE POLICY "anon_read_recipes"  ON recipes FOR SELECT TO anon          USING (true);
CREATE POLICY "auth_write_recipes" ON recipes FOR ALL    TO authenticated  USING (true) WITH CHECK (true);

-- RECIPE_INGREDIENTS: anon read, auth write
CREATE POLICY "anon_read_ri"  ON recipe_ingredients FOR SELECT TO anon          USING (true);
CREATE POLICY "auth_write_ri" ON recipe_ingredients FOR ALL    TO authenticated  USING (true) WITH CHECK (true);
