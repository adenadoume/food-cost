#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
migrate_to_supabase.py
----------------------
Migrates food cost data to Supabase.

Source files (same folder):
  - INGREDIENTS CORRECTED.xlsx  (331 ingredients, no header row)
  - INGREDIENTS 02APR26.csv     (for cost_per_kg, category, supplier info)
  - RECIPES CORRECTED.xlsx      (700 bridge rows: recipe-ingredient links)
  - SUPPLIERS IME.xlsx          (sheet 'ΟΙΚ104-ΟΙΚ5')

Run:
  SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=eyJ... python3.11 migrate_to_supabase.py

Or set them in this file directly for one-time use.
"""

import os
import sys
import pandas as pd
import openpyxl

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hgqigqmzgdrmkerxkwaa.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_SERVICE_ROLE_KEY env var before running.")
    sys.exit(1)

from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# ── Helpers ────────────────────────────────────────────────────────────────

def parse_num(x):
    """Parse Greek-locale number: '1,40' -> 1.40, '20,90' -> 20.90"""
    if pd.isna(x) or x is None:
        return None
    s = str(x).strip().replace("€", "").replace(" ", "")
    # Remove thousands dot, replace decimal comma
    s = s.replace(".", "").replace(",", ".")
    try:
        v = float(s)
        return v if v >= 0 else None
    except Exception:
        return None


def clean_str(x):
    if pd.isna(x) or x is None:
        return None
    s = str(x).strip()
    return s if s else None


def upsert_batch(table: str, rows: list, chunk=200):
    """Upsert rows in chunks to avoid request size limits."""
    total = 0
    for i in range(0, len(rows), chunk):
        batch = rows[i:i+chunk]
        res = supabase.table(table).upsert(batch).execute()
        total += len(batch)
        print(f"  {table}: upserted {total}/{len(rows)}")
    return total


# ── Step 1: Suppliers ──────────────────────────────────────────────────────

def load_suppliers():
    print("\n=== SUPPLIERS ===")
    df = pd.read_excel("SUPPLIERS IME.xlsx", sheet_name="ΟΙΚ104-ΟΙΚ5", dtype=str)
    df = df.fillna("")

    rows = []
    for _, r in df.iterrows():
        name = clean_str(r.get("peri") or r.get("title", ""))
        if not name:
            continue
        address = " ".join(filter(None, [
            clean_str(r.get("street", "")),
            clean_str(r.get("number", "")),
        ]))
        rows.append({
            "code":          clean_str(r.get("CODE")),
            "ime_code":      clean_str(r.get("IME CODE")),
            "name":          name,
            "tax_id":        clean_str(r.get("afm")),
            "tax_office":    clean_str(r.get("doyperi")),
            "city":          clean_str(r.get("citperi")),
            "business_type": clean_str(r.get("prfperi")),
            "address":       address or None,
            "phone":         clean_str(r.get("phone1")),
        })

    upsert_batch("suppliers", rows)

    # Return name -> id map
    all_sup = supabase.table("suppliers").select("id,name").execute().data
    return {s["name"]: s["id"] for s in all_sup}


# ── Step 2: Ingredients ────────────────────────────────────────────────────

MISSING_INGREDIENTS = [
    "BISQUE ΓΑΡΙΔΑΣ", "RISTRETTO", "ΑΓΑΡΙΚΟ", "ΖΩΜΟΣ ΓΑΡΙΔΑΣ",
    "ΚΑΤΣΙΚΙΣΙΟ ΤΥΡΙ", "ΜΑΥΡΗ ΠΡΟΜΠΕΤΑ", "ΜΕΛΙΤΖΑΝΑ", "ΠΟΡΤΣΙΝΙ",
    "ΣΑΛΤΣΑ ΝΑΠΟΛΙ", "ΣΤΑΦΥΛΙΑ", "ΦΥΣΤΙΚΗ ΑΙΓΙΝΗΣ",
    # Near-matches added as distinct entries (cook to decide later):
    "ΒΟΤΑΝΟΤΥΡΑΚΙΑ", "ΜΕΛΙ", "ΠΑΓΩΤΟ", "ΤΑΡΑΜΑΣ", "ΚΡΕΜΜΥΔΙΑ ΚΑΡΑΜΕΛΩΜΕΝΑ",
]


def load_ingredients(supplier_map: dict):
    print("\n=== INGREDIENTS ===")

    # Master list (no header row — first row is also data)
    master_df = pd.read_excel("INGREDIENTS CORRECTED.xlsx", header=None, names=["name", "code"])
    master_names = set(master_df["name"].dropna().str.strip().tolist())

    # Airtable export for cost/category/supplier info
    try:
        airtable_df = pd.read_csv("INGREDIENTS 02APR26.csv", encoding="utf-8")
    except Exception:
        airtable_df = pd.read_csv("INGREDIENTS 02APR26.csv", encoding="cp1253")

    # Build lookup by ingredient name -> {cost, category, supplier}
    info_map = {}
    for _, r in airtable_df.iterrows():
        name = clean_str(r.get("Ingredient"))
        if not name:
            continue
        info_map[name] = {
            "cost_per_kg": parse_num(r.get("Cost per kg")),
            "category":    clean_str(r.get("Ingredient Category")),
            "supplier":    clean_str(r.get("Supplier")),
        }

    # Add missing ingredients that are green-highlighted in RECIPES CORRECTED
    all_names = list(master_df["name"].dropna().str.strip())
    for m in MISSING_INGREDIENTS:
        if m not in master_names:
            all_names.append(m)

    # Build ingredient rows
    rows = []
    for raw_name in all_names:
        name = str(raw_name).strip()
        if not name:
            continue
        code_row = master_df[master_df["name"].str.strip() == name]
        code = code_row["code"].values[0] if not code_row.empty else None

        info = info_map.get(name, {})
        sup_name = info.get("supplier")
        sup_id = supplier_map.get(sup_name) if sup_name else None

        # unit_type: default 'kg' unless Airtable says otherwise
        unit_type = "kg"

        rows.append({
            "code":        clean_str(code),
            "name":        name,
            "cost_per_kg": info.get("cost_per_kg") or 0.0,
            "category":    info.get("category"),
            "supplier_id": sup_id,
            "unit_type":   unit_type,
        })

    upsert_batch("ingredients", rows)

    # Return name -> id map
    all_ingr = supabase.table("ingredients").select("id,name").execute().data
    return {i["name"]: i["id"] for i in all_ingr}


# ── Step 3: Recipes + Bridge ───────────────────────────────────────────────

def load_recipes_and_bridge(ingredient_map: dict):
    print("\n=== RECIPES + BRIDGE ===")

    df = pd.read_excel("RECIPES CORRECTED.xlsx", engine="openpyxl")

    # Effective recipe name: NEW RECIPE NAME if filled, else RECIPENAME
    df["eff_name"] = df.apply(
        lambda r: r["NEW RECIPE NAME"] if pd.notna(r["NEW RECIPE NAME"]) and str(r["NEW RECIPE NAME"]).strip() != ""
                  else r["RECIPENAME"],
        axis=1
    )
    df["eff_name"] = df["eff_name"].astype(str).str.strip()

    # Build restaurant + merides + final_price lookup from FOOD COST MENU 02APR26.csv
    # This is the authoritative source for restaurant assignment
    try:
        menu_df = pd.read_csv("FOOD COST MENU 02APR26.csv", encoding="utf-8")
    except Exception:
        menu_df = pd.read_csv("FOOD COST MENU 02APR26.csv", encoding="cp1253")

    def get_restaurants(rest_str):
        """Parse RESTAURANT column from FOOD COST MENU."""
        if pd.isna(rest_str):
            return ["OIK104"]
        s = str(rest_str).strip()
        if "," in s:
            # e.g. "OIK104,OIK512"
            parts = [p.strip() for p in s.split(",")]
            result = []
            for p in parts:
                if "OIK104" in p and "OIK512" not in p:
                    result.append("OIK104")
                elif "OIK512" in p:
                    result.append("OIK512")
            return result if result else ["OIK104"]
        if "OIK512" in s:
            return ["OIK512"]
        if "OIK104" in s:
            return ["OIK104"]
        return ["OIK104"]  # default

    # Build lookup: RECIPE NAME -> {restaurant, merides, final_price}
    menu_lookup = {}
    for _, r in menu_df.iterrows():
        rname = clean_str(r.get("RECIPE NAME"))
        if not rname:
            continue
        menu_lookup[rname] = {
            "restaurant":  get_restaurants(r.get("RESTAURANT")),
            "merides":     int(r.get("MERIDES") or 1),
            "final_price": parse_num(r.get("FINAL PRICE")) or 0.0,
        }

    # Aggregate per recipe
    recipe_rows = []
    seen_recipes = {}

    for name, group in df.groupby("eff_name", sort=False):
        first = group.iloc[0]
        orig_name = clean_str(first.get("RECIPENAME"))  # original (Greek) name

        # Look up restaurant from FOOD COST MENU:
        # 1. Try effective (possibly English) name first
        # 2. Fall back to original RECIPENAME
        menu_info = menu_lookup.get(name) or menu_lookup.get(orig_name) or {}
        restaurants  = menu_info.get("restaurant", ["OIK104"])
        merides      = menu_info.get("merides", 1)
        final_price  = menu_info.get("final_price", 0.0)

        if not menu_info:
            print(f"  ⚠ Recipe not found in FOOD COST MENU: '{name}' (orig: '{orig_name}') — defaulting to OIK104")

        cat = clean_str(first.get("CATEGORY") or first.get("CATEGORY_"))
        code = clean_str(first.get("RECIPE CODE"))

        recipe_rows.append({
            "code":        code,
            "name":        name,
            "category":    cat,
            "restaurant":  restaurants,
            "merides":     merides,
            "final_price": final_price,
        })
        seen_recipes[name] = None  # placeholder for id

    print(f"  Inserting {len(recipe_rows)} recipes...")
    for i in range(0, len(recipe_rows), 50):
        batch = recipe_rows[i:i+50]
        supabase.table("recipes").upsert(batch, on_conflict="name").execute()
        print(f"  recipes: {min(i+50, len(recipe_rows))}/{len(recipe_rows)}")

    # Fetch back recipe id map
    all_rec = supabase.table("recipes").select("id,name").execute().data
    recipe_map = {r["name"]: r["id"] for r in all_rec}

    # Bridge rows
    bridge_rows = []
    seen_pairs = set()

    for _, r in df.iterrows():
        eff_name = str(r.get("eff_name", "")).strip()
        recipe_id = recipe_map.get(eff_name)
        if not recipe_id:
            continue

        ingr_name = clean_str(r.get("INGREDIENT") or r.get("NEW INGREDIENT "))
        if not ingr_name:
            continue

        ingredient_id = ingredient_map.get(ingr_name)
        if not ingredient_id:
            print(f"  ⚠ Ingredient not found: '{ingr_name}' (recipe: {eff_name})")
            continue

        pair = (recipe_id, ingredient_id)
        if pair in seen_pairs:
            continue  # dedup: keep first occurrence
        seen_pairs.add(pair)

        grams = parse_num(r.get("GRAMS / TMX"))
        if grams is None:
            grams = 0.0

        kg_tmx_raw = r.get("KG / TMX")
        try:
            kg_tmx = float(kg_tmx_raw) if not pd.isna(kg_tmx_raw) else 1000.0
        except Exception:
            kg_tmx = 1000.0

        comments = clean_str(r.get("ΣΧΟΛΙΑ"))

        bridge_rows.append({
            "recipe_id":     recipe_id,
            "ingredient_id": ingredient_id,
            "grams":         grams,
            "kg_tmx":        kg_tmx,
            "comments":      comments,
        })

    print(f"\n  Inserting {len(bridge_rows)} recipe_ingredient rows...")
    upsert_batch("recipe_ingredients", bridge_rows)


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    print("Food Cost App — Supabase Migration")
    print("=" * 40)

    supplier_map   = load_suppliers()
    ingredient_map = load_ingredients(supplier_map)
    load_recipes_and_bridge(ingredient_map)

    print("\n✓ Migration complete!")
    print(f"  Suppliers:         {len(supplier_map)}")
    print(f"  Ingredients:       {len(ingredient_map)}")
    rec_count = supabase.table("recipes").select("id", count="exact").execute().count
    ri_count  = supabase.table("recipe_ingredients").select("id", count="exact").execute().count
    print(f"  Recipes:           {rec_count}")
    print(f"  Recipe-Ingredients:{ri_count}")


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()
