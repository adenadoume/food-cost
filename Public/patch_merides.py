#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_merides.py
----------------
Auto-detects portions (merides) from recipe names in Supabase and updates them.

Patterns detected (number N before keyword):
  N ΜΕΡΙΔΕΣ / ΜΕΡΙΔΑ
  N ΤΕΜΑΧΙΑ / ΤΕΜΑΧΙΟ
  N ΤΜΧ / TMX
  N ΤΕΜ / Τεμ

Examples:
  "ΓΑΛΑΚΤΟΜΠΟΥΡΕΚΟ 20 ΜΕΡΙΔΕΣ" → 20
  "ΝΤΟΛΜΑΔΑΚΙΑ 60 TEM"          → 60
  "ΚΟΤΟΠΙΤΑ 8ΜΕΡΙΔΕΣ"          → 8

Usage:
  SUPABASE_SERVICE_ROLE_KEY=eyJ... python3.11 patch_merides.py
  python3.11 patch_merides.py --dry-run
"""

import os, sys, re, argparse
import httpx

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hgqigqmzgdrmkerxkwaa.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not SUPABASE_KEY:
    print("ERROR: set SUPABASE_SERVICE_ROLE_KEY env var")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

# Match: optional space, number, optional space, keyword
MERIDES_RE = re.compile(
    r'(\d+)\s*'
    r'(ΜΕΡΙΔΕΣ|ΜΕΡΙΔΑ|ΤΕΜΑΧΙΑ|ΤΕΜΑΧΙΟ|ΤΜΧ|TMX|ΤΕΜ|Τεμ|TEM)',
    re.IGNORECASE | re.UNICODE
)


def detect_merides(name: str) -> int | None:
    m = MERIDES_RE.search(name)
    if m:
        return int(m.group(1))
    return None


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.dry_run:
        print("*** DRY RUN ***\n")

    recipes = sb_get("recipes", {"select": "id,name,merides", "limit": "2000"})
    print(f"Fetched {len(recipes)} recipes\n")

    updated = skipped = 0
    for r in recipes:
        detected = detect_merides(r["name"])
        if detected is None:
            continue
        current = r.get("merides") or 1
        if current == detected:
            skipped += 1
            continue
        print(f"  {'DRY' if args.dry_run else 'SET'}: {r['name']!r:55s}  {current} → {detected}")
        if not args.dry_run:
            sb_patch("recipes", r["id"], {"merides": detected})
        updated += 1

    print(f"\nDetected & updated: {updated}  |  Already correct: {skipped}")
    print("✓ Done")


if __name__ == "__main__":
    main()
