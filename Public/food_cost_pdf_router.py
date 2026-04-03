"""
food_cost_pdf_router.py
-----------------------
FastAPI router that generates a Food Cost Recipe PDF from Supabase and
returns it as a downloadable file.

Mount in main.py:
    from food_cost_pdf_router import router as food_cost_router
    app.include_router(food_cost_router)

GET /api/food-cost/pdf?filter=ALL        → ALL RECIPES.pdf
GET /api/food-cost/pdf?filter=OIK104     → OIK104 RECIPES.pdf
GET /api/food-cost/pdf?filter=OIK512     → OIK512 RECIPES.pdf
"""

import os
import io
import httpx

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

router = APIRouter()

# ── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("FOOD_COST_SUPABASE_URL", "https://hgqigqmzgdrmkerxkwaa.supabase.co")
SUPABASE_KEY = os.environ.get("FOOD_COST_SUPABASE_ANON_KEY", "")

CATEGORY_ORDER = [
    "ΠΡΩΙΝΟ", "ΟΡΕΚΤΙΚΑ", "ΣΑΛΑΤΕΣ", "ΤΥΡΙΑ", "ΚΥΡΙΩΣ", "ΠΑΣΤΕΣ - ΡΙΖΟΤΑ",
    "ΕΛΛΗΝΙΚΑ ΠΑΡΑΔΟΣΙΑΚΑ", "ΚΡΕΑΤΙΚΑ ΣΤΑ ΚΑΡΒΟΥΝΑ",
    "ΨΑΡΙΑ ΘΑΛΑΣΣΙΝΑ ΣΤΑ ΚΑΡΒΟΥΝΑ",
    "ΕΠΙΔΟΡΠΙΑ", "ΕΝΔΙΑΜΕΣΑ", "ΠΙΤΣΑ", "ΣΝΑΚΣ", "ΤΥΛΙΧΤΗ ΠΙΤΑ",
]
CAT_RANK = {c: i for i, c in enumerate(CATEGORY_ORDER)}

# ── Supabase helpers ─────────────────────────────────────────────────────────

def _headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }


def _sb_get(path, params=None):
    r = httpx.get(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers=_headers(),
        params=params,
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def _fetch_recipes(restaurant_filter: str):
    params = {"select": "*", "order": "name.asc"}
    if restaurant_filter != "ALL":
        params["restaurant"] = f'cs.{{"{restaurant_filter}"}}'
    return _sb_get("recipes", params)


def _fetch_bridge(recipe_ids: list):
    if not recipe_ids:
        return []
    ids_str = ",".join(recipe_ids)
    return _sb_get(
        "recipe_ingredients",
        {
            "select": "recipe_id,grams,kg_tmx,ingredients(name,cost_per_kg,unit_type)",
            "recipe_id": f"in.({ids_str})",
        },
    )


# ── Business logic ───────────────────────────────────────────────────────────

def _line_cost(grams, kg_tmx, cost_per_kg):
    if not kg_tmx:
        return 0.0
    return (grams / kg_tmx) * cost_per_kg * 1.13


def _unit_label(kg_tmx):
    return "ΤΜΧ" if kg_tmx == 1 else "grm"


def _fmt(v):
    if v is None:
        return ""
    return f"{float(v):.2f}"


def _rest_rank(r):
    rests = r.get("restaurant") or []
    has104 = "OIK104" in rests
    has512 = "OIK512" in rests
    if has104 and has512:
        return 1
    if has104:
        return 0
    return 2


# ── Font ─────────────────────────────────────────────────────────────────────

_FONT_NAME = None


def _ensure_font():
    global _FONT_NAME
    if _FONT_NAME:
        return _FONT_NAME
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(here, "DejaVuSans.ttf"),
        os.path.join(here, "scripts", "DejaVuSans.ttf"),
    ]
    for p in candidates:
        if os.path.exists(p):
            pdfmetrics.registerFont(TTFont("DejaVuSans", p))
            _FONT_NAME = "DejaVuSans"
            return _FONT_NAME
    raise FileNotFoundError("DejaVuSans.ttf not found next to food_cost_pdf_router.py")


# ── Styles ───────────────────────────────────────────────────────────────────

def _build_styles(font_name):
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


# ── PDF builder ──────────────────────────────────────────────────────────────

def _build_ingredient_rows(recipe_id, bridge_by_recipe):
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
        grams  = float(br.get("grams") or 0)
        kg_tmx = float(br.get("kg_tmx") or 1000)
        cpk    = float(ingr.get("cost_per_kg") or 0)
        lc     = _line_cost(grams, kg_tmx, cpk)
        total += lc
        rows.append([
            name,
            str(int(grams)) if grams else "",
            _unit_label(kg_tmx),
            _fmt(cpk) if cpk else "",
            _fmt(lc) if lc else "",
        ])
    return rows, total


def _generate_pdf_bytes(recipes, bridge_by_recipe, restaurant_label, font_name, styles) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36,
    )
    story = []

    # Cover
    story += [
        Spacer(1, 60),
        Paragraph("ΣΥΝΤΑΓΕΣ - FOOD COST", styles["CoverTitle"]),
        Paragraph(restaurant_label, styles["IndexTitle"]),
        PageBreak(),
    ]

    # Index
    story.append(Paragraph('<a name="index"/>ΕΥΡΕΤΗΡΙΟ ΚΑΤΗΓΟΡΙΩΝ', styles["IndexTitle"]))
    cats_in_data = list(dict.fromkeys(r["category"] for r in recipes if r.get("category")))
    ordered_cats = [c for c in CATEGORY_ORDER if c in cats_in_data] + \
                   [c for c in cats_in_data if c not in CATEGORY_ORDER]
    first_per_cat: dict = {}
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
        rec_id   = recipe["id"]
        rec_name = recipe["name"]
        cat      = recipe.get("category") or ""
        rests    = recipe.get("restaurant") or []
        merides  = int(recipe.get("merides") or 1)
        price    = float(recipe.get("final_price") or 0)

        # Header strip
        hdr = Table(
            [[Paragraph("ΑΝΑΛΥΣΗ ΣΥΝΤΑΓΗΣ", styles["Hdr"])]],
            colWidths=[doc.width],
        )
        hdr.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), colors.black),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("FONTNAME",      (0, 0), (-1, -1), font_name),
        ]))
        story += [hdr, Spacer(1, 6)]

        # Title + anchor
        title = rec_name
        if first_per_cat.get(cat) == rec_name:
            anchor = rec_name.replace(" ", "_")
            title = f'<a name="rec_{anchor}"/>' + title
        story.append(Paragraph(title, styles["TitleRow"]))

        # Meta
        rest_display = ", ".join("OIK5.12" if r == "OIK512" else r for r in rests)
        meta = Table(
            [["Εστιατόριο", rest_display], ["Κατηγορία", cat]],
            colWidths=[120, doc.width - 120],
        )
        meta.setStyle(TableStyle([
            ("FONTNAME",   (0, 0), (-1, -1), font_name),
            ("FONTSIZE",   (0, 0), (-1, -1), 10),
            ("GRID",       (0, 0), (-1, -1), 0.25, colors.grey),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f6f6f6")),
        ]))
        story += [Spacer(1, 6), meta, Spacer(1, 12)]

        # Ingredients
        story.append(Paragraph("ΣΥΝΤΑΓΗ", styles["BigLabel"]))
        ing_rows, total = _build_ingredient_rows(rec_id, bridge_by_recipe)

        if ing_rows:
            data = [["Συστατικό", "Q", "ΜΜ", "COST/kg", "€"]] + ing_rows + \
                   [["ΣΥΝΟΛΟ", "", "", "", _fmt(total)]]
            t = Table(data, colWidths=[260, 50, 60, 60, 70], hAlign="CENTER")
            t.setStyle(TableStyle([
                ("FONTNAME",   (0, 0), (-1, -1), font_name),
                ("FONTSIZE",   (0, 0), (-1, -1), 10),
                ("BACKGROUND", (0, 0), (-1,  0), colors.lightgrey),
                ("GRID",       (0, 0), (-1, -1), 0.5, colors.black),
                ("ALIGN",      (1, 1), (1, -2), "RIGHT"),
                ("ALIGN",      (2, 1), (2, -2), "CENTER"),
                ("ALIGN",      (3, 1), (4, -2), "RIGHT"),
                ("ALIGN",      (4, -1), (4, -1), "RIGHT"),
                ("ALIGN",      (0, -1), (0, -1), "LEFT"),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f5f5f5")),
            ]))
            story += [t, Spacer(1, 14)]

        # Costing
        story.append(Table(
            [[Paragraph("ΚΟΣΤΟΛΟΓΗΣΗ", styles["GreyBar"])]],
            colWidths=[doc.width],
        ))
        per_portion = total / merides if merides > 0 else 0.0
        meta2 = [
            ["Μερίδες", str(merides), "", ""],
            ["Κόστος μερίδας (€)", _fmt(per_portion) if per_portion else "",
             "Τιμή Πώλησης (€)", _fmt(price) if price > 0 else ""],
        ]
        t2 = Table(meta2, colWidths=[160, 120, 140, 80], hAlign="CENTER")
        t2.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), font_name),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID",     (0, 0), (-1, -1), 0.5, colors.black),
            ("ALIGN",    (1, 0), (1, -1), "RIGHT"),
            ("ALIGN",    (3, 0), (3, -1), "RIGHT"),
        ]))
        story += [t2, Spacer(1, 18)]

        # Back button
        btn = Table(
            [[Paragraph('<link href="#index">ΑΡΧΙΚΗ ↑</link>', styles["ButtonText"])]],
            colWidths=[120], hAlign="CENTER",
        )
        btn.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), colors.black),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("BOX",           (0, 0), (-1, -1), 0.5, colors.black),
            ("FONTNAME",      (0, 0), (-1, -1), font_name),
        ]))
        story += [btn, PageBreak()]

    doc.build(story)
    buf.seek(0)
    return buf.read()


# ── Endpoint ─────────────────────────────────────────────────────────────────

FILTER_LABELS = {
    "ALL":    "OIK104 & OIK5.12",
    "OIK104": "OIK104",
    "OIK512": "OIK5.12",
}
FILTER_FILENAMES = {
    "ALL":    "ALL RECIPES.pdf",
    "OIK104": "OIK104 RECIPES.pdf",
    "OIK512": "OIK512 RECIPES.pdf",
}


@router.get("/api/food-cost/pdf")
async def export_recipes_pdf(
    filter: str = Query("ALL", regex="^(ALL|OIK104|OIK512)$"),
):
    """Generate and return the food cost recipe PDF."""
    try:
        font_name = _ensure_font()
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        recipes = _fetch_recipes(filter)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Supabase fetch failed: {e}")

    if not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="FOOD_COST_SUPABASE_ANON_KEY env var not set")

    # Sort: OIK104 first → shared → OIK512, then category, then name
    recipes.sort(key=lambda r: (
        _rest_rank(r),
        CAT_RANK.get(r.get("category") or "", 999),
        r.get("name", ""),
    ))

    ids = [r["id"] for r in recipes]
    try:
        bridge_rows = _fetch_bridge(ids)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Supabase bridge fetch failed: {e}")

    bridge_by_recipe: dict = {}
    for br in bridge_rows:
        rid = br["recipe_id"]
        bridge_by_recipe.setdefault(rid, []).append(br)

    styles = _build_styles(font_name)
    label = FILTER_LABELS[filter]
    pdf_bytes = _generate_pdf_bytes(recipes, bridge_by_recipe, label, font_name, styles)

    filename = FILTER_FILENAMES[filter]
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
