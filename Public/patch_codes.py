#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_codes.py
--------------
Reads CODE columns from Excel files and bulk-updates Supabase.

Usage:
  SUPABASE_SERVICE_ROLE_KEY=eyJ... python3.11 patch_codes.py
  python3.11 patch_codes.py --dry-run   # print what would change, no writes

Tables updated:
  ingredients  — code from INGREDIENTS CORRECTED.xlsx (col B)
  recipes      — code from RECIPES CORRECTED.xlsx     (col RECIPE CODE)
"""

import os
import sys
import argparse
import pandas as pd
import httpx

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hgqigqmzgdrmkerxkwaa.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not SUPABASE_KEY:
    print("ERROR: set SUPABASE_SERVICE_ROLE_KEY env var")
    sys.exit(1)

HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}


def sb_get(table, params):
    r = httpx.get(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def sb_patch(table, row_id, payload):
    r = httpx.patch(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=HEADERS,
        params={"id": f"eq.{row_id}"},
        json=payload,
        timeout=30,
    )
    r.raise_for_status()


def clean(x):
    if x is None or (isinstance(x, float) and __import__('math').isnan(x)):
        return None
    s = str(x).strip()
    return s if s else None


# ── Ingredients ──────────────────────────────────────────────────────────────

def patch_ingredients(dry_run: bool):
    print("\n=== INGREDIENTS ===")
    df = pd.read_excel("INGREDIENTS CORRECTED.xlsx", header=None, names=["name", "code"])
    df["name"] = df["name"].astype(str).str.strip()
    df["code"] = df["code"].apply(clean)

    # Only rows that actually have a code
    df = df[df["code"].notna()].copy()
    print(f"  Excel rows with code: {len(df)}")

    # Fetch all ingredients from Supabase (name → id mapping)
    rows = sb_get("ingredients", {"select": "id,name,code", "limit": "2000"})
    db_map = {r["name"]: r for r in rows}

    updated = skipped = missing = 0
    for _, row in df.iterrows():
        name = row["name"]
        code = row["code"]
        db_row = db_map.get(name)
        if not db_row:
            print(f"  ⚠ Not in DB: '{name}'")
            missing += 1
            continue
        if db_row.get("code") == code:
            skipped += 1
            continue
        if dry_run:
            print(f"  DRY: {name!r:50s}  {db_row.get('code')!r} → {code!r}")
        else:
            sb_patch("ingredients", db_row["id"], {"code": code})
        updated += 1

    print(f"  Updated: {updated}  |  Already correct: {skipped}  |  Missing: {missing}")


# ── Recipes ──────────────────────────────────────────────────────────────────

def patch_recipes(dry_run: bool):
    print("\n=== RECIPES ===")
    df = pd.read_excel("RECIPES CORRECTED.xlsx", engine="openpyxl")

    # Effective recipe name: NEW RECIPE NAME if filled, else RECIPENAME
    df["eff_name"] = df.apply(
        lambda r: r["NEW RECIPE NAME"]
        if pd.notna(r.get("NEW RECIPE NAME")) and str(r.get("NEW RECIPE NAME", "")).strip()
        else r["RECIPENAME"],
        axis=1,
    ).astype(str).str.strip()

    df["code"] = df["RECIPE CODE"].apply(clean)

    # Deduplicate — one code per recipe
    recipe_codes = (
        df[df["code"].notna()][["eff_name", "code"]]
        .drop_duplicates(subset="eff_name", keep="first")
    )
    print(f"  Excel recipes with code: {len(recipe_codes)}")

    # Fetch all recipes
    rows = sb_get("recipes", {"select": "id,name,code", "limit": "2000"})
    db_map = {r["name"]: r for r in rows}

    updated = skipped = missing = 0
    for _, row in recipe_codes.iterrows():
        name = row["eff_name"]
        code = row["code"]
        db_row = db_map.get(name)
        if not db_row:
            print(f"  ⚠ Not in DB: '{name}'")
            missing += 1
            continue
        if db_row.get("code") == code:
            skipped += 1
            continue
        if dry_run:
            print(f"  DRY: {name!r:50s}  {db_row.get('code')!r} → {code!r}")
        else:
            sb_patch("recipes", db_row["id"], {"code": code})
        updated += 1

    print(f"  Updated: {updated}  |  Already correct: {skipped}  |  Missing: {missing}")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Patch codes into Supabase from Excel")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without writing")
    parser.add_argument("--table", choices=["ingredients", "recipes", "all"], default="all")
    args = parser.parse_args()

    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    if args.dry_run:
        print("*** DRY RUN — no writes ***")

    if args.table in ("ingredients", "all"):
        patch_ingredients(args.dry_run)
    if args.table in ("recipes", "all"):
        patch_recipes(args.dry_run)

    print("\n✓ Done")


if __name__ == "__main__":
    main()
