#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_pdf_supabase.py
------------------------
Generates a Recipe Analysis PDF identical to ALL_RECIPES_v38_FINAL.pdf
but reads data from Supabase instead of CSV files.

Usage:
  python3.11 generate_pdf_supabase.py --filter OIK104
  python3.11 generate_pdf_supabase.py --filter OIK512
  python3.11 generate_pdf_supabase.py --filter ALL

Output:
  OIK104 RECIPES.pdf   (when --filter OIK104)
  OIK512 RECIPES.pdf   (when --filter OIK512)
  ALL RECIPES.pdf      (when --filter ALL)

Requirements:
  pip install reportlab httpx
  DejaVuSans.ttf must be at ./scripts/DejaVuSans.ttf
"""

import os
import sys
import argparse
import httpx

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
)
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

# ── Config ─────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hgqigqmzgdrmkerxkwaa.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncWlncW16Z2RybWtlcnhrd2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzc1MDIsImV4cCI6MjA5MDc1MzUwMn0.M9WwlKHnJR1ONjxVKOsOgGYXsJ8I56DHkHSrJBuQJ6Q"
)
LOGO = "PYC logo 2024.jpg"

CATEGORY_ORDER = [
    "ΠΡΩΙΝΟ", "ΟΡΕΚΤΙΚΑ", "ΣΑΛΑΤΕΣ", "ΤΥΡΙΑ", "ΚΥΡΙΩΣ", "ΠΑΣΤΕΣ - ΡΙΖΟΤΑ",
    "ΕΛΛΗΝΙΚΑ ΠΑΡΑΔΟΣΙΑΚΑ", "ΚΡΕΑΤΙΚΑ ΣΤΑ ΚΑΡΒΟΥΝΑ", "ΨΑΡΙΑ ΘΑΛΑΣΣΙΝΑ ΣΤΑ ΚΑΡΒΟΥΝΑ",
    "ΕΠΙΔΟΡΠΙΑ", "ΕΝΔΙΑΜΕΣΑ", "ΠΙΤΣΑ", "ΣΝΑΚΣ", "ΤΥΛΙΧΤΗ ΠΙΤΑ",
]
CAT_RANK = {c: i for i, c in enumerate(CATEGORY_ORDER)}


# ── Supabase helpers ────────────────────────────────────────────────────────

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
}


def sb_get(path, params=None):
    r = httpx.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def fetch_recipes(restaurant_filter):
    """Fetch recipes sorted by category then name."""
    params = {"select": "*", "order": "name.asc"}
    if restaurant_filter != "ALL":
        params["restaurant"] = f"cs.{{\"{restaurant_filter}\"}}"
    return sb_get("recipes", params)


def fetch_all_bridge_rows(recipe_ids):
    """Fetch all recipe_ingredients joined with ingredients for given recipe IDs."""
    if not recipe_ids:
        return []
        
    all_rows = []
    chunk_size = 20
    for i in range(0, len(recipe_ids), chunk_size):
        chunk_ids = recipe_ids[i:i+chunk_size]
        ids_str = ",".join(chunk_ids)
        rows = sb_get(
            "recipe_ingredients",
            {
                "select": "recipe_id,grams,kg_tmx,ingredients(name,cost_per_kg,unit_type)",
                "recipe_id": f"in.({ids_str})",
                "limit": 1000
            }
        )
        all_rows.extend(rows)
    return all_rows


# ── Business logic (mirrors v38) ────────────────────────────────────────────

def line_cost_taxed(grams, kg_tmx, cost_per_kg):
    """Line cost with 13% VAT applied."""
    if not kg_tmx:
        return 0.0
    return (grams / kg_tmx) * cost_per_kg * 1.13


def unit_label(kg_tmx):
    return "ΤΜΧ" if kg_tmx == 1 else "grm"


def fmt(v):
    if v is None:
        return ""
    return f"{float(v):.2f}"


# ── Font setup ──────────────────────────────────────────────────────────────

def setup_font():
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(here, "scripts", "DejaVuSans.ttf"),
        os.path.join(here, "DejaVuSans.ttf"),
        os.path.join(here, "..", "scripts", "DejaVuSans.ttf"),
    ]
    for p in candidates:
        if os.path.exists(p):
            pdfmetrics.registerFont(TTFont("DejaVuSans", p))
            return "DejaVuSans"
    raise FileNotFoundError(
        "DejaVuSans.ttf not found. Place it at Public/scripts/DejaVuSans.ttf\n"
        "Download from: https://dejavu-fonts.github.io/"
    )


def build_styles(font_name):
    styles = getSampleStyleSheet()
    defs = [
        ("Hdr",        dict(fontName=font_name, fontSize=14, alignment=TA_CENTER, textColor=colors.white, leading=18)),
        ("TitleRow",   dict(fontName=font_name, fontSize=18, alignment=0, leading=22, spaceAfter=8)),
        ("GreyBar",    dict(fontName=font_name, fontSize=12, alignment=0, textColor=colors.black, spaceBefore=6, spaceAfter=6)),
        ("BigLabel",   dict(fontName=font_name, fontSize=14, spaceAfter=10)),
        ("CoverTitle", dict(fontName=font_name, fontSize=26, alignment=TA_CENTER, spaceAfter=12, leading=30)),
        ("IndexTitle", dict(fontName=font_name, fontSize=18, alignment=TA_CENTER, spaceAfter=14)),
        ("IndexItem",  dict(fontName=font_name, fontSize=13, alignment=0, spaceAfter=8)),
        ("ButtonText", dict(fontName=font_name, fontSize=11, alignment=TA_CENTER, textColor=colors.white)),
    ]
    for name, kw in defs:
        styles.add(ParagraphStyle(name=name, **kw))
    return styles


# ── PDF build ───────────────────────────────────────────────────────────────

def build_ingredient_table(recipe_id, bridge_by_recipe, font_name):
    """Build (table_rows, total_taxed) for one recipe."""
    rows_raw = bridge_by_recipe.get(recipe_id, [])
    if not rows_raw:
        return None, 0.0

    seen = set()
    rows = []
    total = 0.0
    for br in rows_raw:
        ingr = br.get("ingredients") or {}
        name = ingr.get("name", "")
        if name in seen:
            continue
        seen.add(name)

        grams    = float(br.get("grams") or 0)
        kg_tmx   = float(br.get("kg_tmx") or 1000)
        cpk      = float(ingr.get("cost_per_kg") or 0)
        lc       = line_cost_taxed(grams, kg_tmx, cpk)
        total   += lc

        rows.append([
            name,
            str(int(grams)) if grams else "",
            unit_label(kg_tmx),
            fmt(cpk) if cpk else "",
            fmt(lc) if lc else "",
        ])

    return rows, total


def make_pdf(recipes, bridge_by_recipe, output_file, restaurant_label, font_name, styles):
    doc = SimpleDocTemplate(
        output_file, pagesize=A4,
        rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
    )
    story = []

    # Cover
    here = os.path.dirname(os.path.abspath(__file__))
    logo_path = os.path.join(here, LOGO)
    if os.path.exists(logo_path):
        img = Image(logo_path, width=220, height=220)
        img.hAlign = "CENTER"
        story += [Spacer(1, 40), img]
    story += [
        Spacer(1, 20),
        Paragraph(f"ΣΥΝΤΑΓΕΣ - FOOD COST", styles["CoverTitle"]),
        Paragraph(restaurant_label, styles["IndexTitle"]),
        PageBreak(),
    ]

    # Index
    story.append(Paragraph('<a name="index"/>ΕΥΡΕΤΗΡΙΟ ΚΑΤΗΓΟΡΙΩΝ', styles["IndexTitle"]))
    cats_in_data = list(dict.fromkeys(r["category"] for r in recipes if r.get("category")))
    ordered_cats = [c for c in CATEGORY_ORDER if c in cats_in_data] + \
                   [c for c in cats_in_data if c not in CATEGORY_ORDER]
    first_per_cat = {}
    for r in recipes:
        cat = r.get("category") or ""
        if cat and cat not in first_per_cat:
            first_per_cat[cat] = r["name"]

    for cat in ordered_cats:
        first = first_per_cat.get(cat)
        if first:
            anchor = first.replace(" ", "_")
            story.append(Paragraph(f'<link href="#rec_{anchor}">{cat}</link>', styles["IndexItem"]))
        else:
            story.append(Paragraph(cat, styles["IndexItem"]))
    story.append(PageBreak())

    # One page per recipe
    for recipe in recipes:
        rec_id    = recipe["id"]
        rec_name  = recipe["name"]
        cat       = recipe.get("category") or ""
        rests     = recipe.get("restaurant") or []
        merides   = int(recipe.get("merides") or 1)
        price     = float(recipe.get("final_price") or 0)

        # Header strip
        hdr = Table(
            [[Paragraph("ΑΝΑΛΥΣΗ ΣΥΝΤΑΓΗΣ", styles["Hdr"])]],
            colWidths=[doc.width]
        )
        hdr.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), colors.black),
            ("TOPPADDING",    (0,0), (-1,-1), 6),
            ("BOTTOMPADDING", (0,0), (-1,-1), 6),
            ("FONTNAME",      (0,0), (-1,-1), font_name),
        ]))
        story += [hdr, Spacer(1, 6)]

        # Title + anchor
        title = rec_name
        if first_per_cat.get(cat) == rec_name:
            anchor = rec_name.replace(" ", "_")
            title = f'<a name="rec_{anchor}"/>' + title
        story.append(Paragraph(title, styles["TitleRow"]))

        # Meta row (restaurant + category)
        rest_display = ", ".join("OIK5.12" if r == "OIK512" else r for r in rests)
        meta = Table(
            [["Εστιατόριο", rest_display], ["Κατηγορία", cat]],
            colWidths=[120, doc.width - 120]
        )
        meta.setStyle(TableStyle([
            ("FONTNAME",   (0,0), (-1,-1), font_name),
            ("FONTSIZE",   (0,0), (-1,-1), 10),
            ("GRID",       (0,0), (-1,-1), 0.25, colors.grey),
            ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#f6f6f6")),
        ]))
        story += [Spacer(1, 6), meta, Spacer(1, 12)]

        # Ingredients table
        story.append(Paragraph("ΣΥΝΤΑΓΗ", styles["BigLabel"]))
        ing_rows, total = build_ingredient_table(rec_id, bridge_by_recipe, font_name)

        if ing_rows:
            data = [["Συστατικό", "Q", "ΜΜ", "COST/kg", "€"]] + ing_rows + \
                   [["ΣΥΝΟΛΟ", "", "", "", fmt(total)]]
            t = Table(data, colWidths=[260, 50, 60, 60, 70], hAlign="CENTER")
            t.setStyle(TableStyle([
                ("FONTNAME",   (0,0), (-1,-1), font_name),
                ("FONTSIZE",   (0,0), (-1,-1), 10),
                ("BACKGROUND", (0,0), (-1, 0), colors.lightgrey),
                ("GRID",       (0,0), (-1,-1), 0.5, colors.black),
                ("ALIGN",      (1,1), (1,-2), "RIGHT"),
                ("ALIGN",      (2,1), (2,-2), "CENTER"),
                ("ALIGN",      (3,1), (4,-2), "RIGHT"),
                ("ALIGN",      (4,-1), (4,-1), "RIGHT"),
                ("ALIGN",      (0,-1), (0,-1), "LEFT"),
                ("BACKGROUND", (0,-1), (-1,-1), colors.HexColor("#f5f5f5")),
            ]))
            story += [t, Spacer(1, 14)]

        # Costing box
        story.append(Table(
            [[Paragraph("ΚΟΣΤΟΛΟΓΗΣΗ", styles["GreyBar"])]],
            colWidths=[doc.width]
        ))

        # Per-portion cost = total / merides (total already includes VAT)
        per_portion = total / merides if merides > 0 else 0.0
        meta2 = [
            ["Μερίδες", str(merides), "", ""],
            ["Κόστος μερίδας (€)", fmt(per_portion) if per_portion else "",
             "Τιμή Πώλησης (€)", fmt(price) if price > 0 else ""],
        ]
        t2 = Table(meta2, colWidths=[160, 120, 140, 80], hAlign="CENTER")
        t2.setStyle(TableStyle([
            ("FONTNAME", (0,0), (-1,-1), font_name),
            ("FONTSIZE", (0,0), (-1,-1), 10),
            ("GRID",     (0,0), (-1,-1), 0.5, colors.black),
            ("ALIGN",    (1,0), (1,-1), "RIGHT"),
            ("ALIGN",    (3,0), (3,-1), "RIGHT"),
        ]))
        story += [t2, Spacer(1, 18)]

        # Back button
        btn = Table(
            [[Paragraph('<link href="#index">ΑΡΧΙΚΗ ↑</link>', styles["ButtonText"])]],
            colWidths=[120], hAlign="CENTER"
        )
        btn.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), colors.black),
            ("LEFTPADDING",   (0,0), (-1,-1), 10),
            ("RIGHTPADDING",  (0,0), (-1,-1), 10),
            ("TOPPADDING",    (0,0), (-1,-1), 6),
            ("BOTTOMPADDING", (0,0), (-1,-1), 6),
            ("BOX",           (0,0), (-1,-1), 0.5, colors.black),
            ("FONTNAME",      (0,0), (-1,-1), font_name),
        ]))
        story += [btn, PageBreak()]

    doc.build(story)
    print(f"Saved: {output_file}  ({len(recipes)} recipes)")


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate Food Cost PDF from Supabase")
    parser.add_argument("--filter", choices=["OIK104", "OIK512", "ALL"], default="ALL",
                        help="Restaurant filter")
    args = parser.parse_args()

    filter_arg = args.filter
    if filter_arg == "OIK104":
        output = "OIK104 RECIPES.pdf"
        label  = "OIK104"
    elif filter_arg == "OIK512":
        output = "OIK512 RECIPES.pdf"
        label  = "OIK5.12"
    else:
        output = "ALL RECIPES.pdf"
        label  = "OIK104 & OIK5.12"

    print(f"Fetching recipes ({filter_arg})...")
    recipes = fetch_recipes(filter_arg)

    def rest_rank(r):
        """OIK104-only → 0, both → 1, OIK512-only → 2"""
        rests = r.get("restaurant") or []
        has104 = "OIK104" in rests
        has512 = "OIK512" in rests
        if has104 and has512:
            return 1
        if has104:
            return 0
        return 2

    # Sort: restaurant (OIK104 first, then shared, then OIK512), then category, then name
    recipes.sort(key=lambda r: (
        rest_rank(r),
        CAT_RANK.get(r.get("category") or "", 999),
        r.get("name", "")
    ))
    print(f"  {len(recipes)} recipes found")

    print("Fetching ingredients...")
    ids = [r["id"] for r in recipes]
    bridge_rows = fetch_all_bridge_rows(ids)

    # Group bridge rows by recipe_id
    bridge_by_recipe: dict = {}
    for br in bridge_rows:
        rid = br["recipe_id"]
        bridge_by_recipe.setdefault(rid, []).append(br)

    print("Building PDF...")
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    font_name = setup_font()
    styles = build_styles(font_name)
    make_pdf(recipes, bridge_by_recipe, output, label, font_name, styles)


if __name__ == "__main__":
    main()
