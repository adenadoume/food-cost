-- Run this in Supabase SQL Editor.
-- anon (public) = SELECT only
-- authenticated (logged-in editor) = full CRUD

-- Drop all existing policies first
DROP POLICY IF EXISTS "anon_all_suppliers"          ON suppliers;
DROP POLICY IF EXISTS "anon_all_ingredients"        ON ingredients;
DROP POLICY IF EXISTS "anon_all_recipes"            ON recipes;
DROP POLICY IF EXISTS "anon_all_recipe_ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "anon_read_suppliers"         ON suppliers;
DROP POLICY IF EXISTS "anon_read_ingredients"       ON ingredients;
DROP POLICY IF EXISTS "anon_read_recipes"           ON recipes;
DROP POLICY IF EXISTS "anon_read_ri"                ON recipe_ingredients;
DROP POLICY IF EXISTS "auth_write_suppliers"        ON suppliers;
DROP POLICY IF EXISTS "auth_write_ingredients"      ON ingredients;
DROP POLICY IF EXISTS "auth_write_recipes"          ON recipes;
DROP POLICY IF EXISTS "auth_write_ri"               ON recipe_ingredients;

-- SUPPLIERS
CREATE POLICY "anon_select_suppliers"  ON suppliers FOR SELECT TO anon          USING (true);
CREATE POLICY "auth_select_suppliers"  ON suppliers FOR SELECT TO authenticated  USING (true);
CREATE POLICY "auth_insert_suppliers"  ON suppliers FOR INSERT TO authenticated  WITH CHECK (true);
CREATE POLICY "auth_update_suppliers"  ON suppliers FOR UPDATE TO authenticated  USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_suppliers"  ON suppliers FOR DELETE TO authenticated  USING (true);

-- INGREDIENTS
CREATE POLICY "anon_select_ingredients"  ON ingredients FOR SELECT TO anon          USING (true);
CREATE POLICY "auth_select_ingredients"  ON ingredients FOR SELECT TO authenticated  USING (true);
CREATE POLICY "auth_insert_ingredients"  ON ingredients FOR INSERT TO authenticated  WITH CHECK (true);
CREATE POLICY "auth_update_ingredients"  ON ingredients FOR UPDATE TO authenticated  USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_ingredients"  ON ingredients FOR DELETE TO authenticated  USING (true);

-- RECIPES
CREATE POLICY "anon_select_recipes"  ON recipes FOR SELECT TO anon          USING (true);
CREATE POLICY "auth_select_recipes"  ON recipes FOR SELECT TO authenticated  USING (true);
CREATE POLICY "auth_insert_recipes"  ON recipes FOR INSERT TO authenticated  WITH CHECK (true);
CREATE POLICY "auth_update_recipes"  ON recipes FOR UPDATE TO authenticated  USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_recipes"  ON recipes FOR DELETE TO authenticated  USING (true);

-- RECIPE_INGREDIENTS
CREATE POLICY "anon_select_ri"  ON recipe_ingredients FOR SELECT TO anon          USING (true);
CREATE POLICY "auth_select_ri"  ON recipe_ingredients FOR SELECT TO authenticated  USING (true);
CREATE POLICY "auth_insert_ri"  ON recipe_ingredients FOR INSERT TO authenticated  WITH CHECK (true);
CREATE POLICY "auth_update_ri"  ON recipe_ingredients FOR UPDATE TO authenticated  USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_ri"  ON recipe_ingredients FOR DELETE TO authenticated  USING (true);
