#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_pdf_v38_merged_dejavu.py
---------------------------------

Builds a "Recipe Analysis" PDF (v38 rules) from two CSVs that contain BOTH restaurants (OIK104 & OIK5.12).

INPUT FILES (same folder):
  • OIK104 MENU.csv
  • OIK104 MENU INGREDIENTS.csv
  • PYC logo 2024.jpg (optional)

OUTPUT:
  • ALL_RECIPES_v38_FINAL.pdf

BUSINESS LOGIC (v38):
  • "Εστιατόριο" (Restaurant):
	  - From RESTAURANT column; aggregate to "OIK104, OIK5.12" if a recipe belongs to both (OIK104 first).
  • Sorting:
	  1) CATEGORY (custom order below)
	  2) Inside category: OIK104 block first, then OIK5.12
	  3) Inside each block: RECIPE NAME ascending (A→Z)
  • Ingredients table:
	  - Filter by RECIPENAME
	  - Drop duplicates by INGREDIENT (avoid double-counting)
	  - Quantity uses GRAMS
	  - Unit rule:
		  KG/TMX == 1  ->  "Τεμάχια"
		  else         ->  "Γραμμάρια"
	  - Line Cost (Κόστος (€)) = costcosrecipe × 1.13  (13% VAT added in v38)
  • ΣΥΝΟΛΟ (under table) = sum of taxed line costs.
  • Κόστος μερίδας (€) = from MENU column "TOTAL / MERIDA composite" (ALREADY includes VAT).

NOTES:
  • Same structure as v37 but with VAT applied on ingredient line costs and per-portion cost taken from the composite column.
  • Customize column name detection with the helper col_like() if needed.
  
  
Same as your original v38 script, but hard-wired to use DejaVu Sans from the local
'scripts' folder so Greek characters render correctly.

Expected font path (one of these must exist):
  ./scripts/DejaVuSans.ttf
  ./DejaVuSans.ttf
"""

import os
import pandas as pd
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
	SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
)
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

# ---------- Configuration (unchanged) ----------
MENU = "OIK104 MENU.csv"
INGS = "OIK104 MENU INGREDIENTS.csv"
LOGO = "PYC logo 2024.jpg"
OUTPUT = "ALL_RECIPES_v38_FINAL.pdf"


def num(x):
	"""String-to-float converter tolerant to currency symbols and European decimals."""
	import numpy as np
	if pd.isna(x):
		return np.nan
	s = str(x).replace("€", "").replace(" ", "")
	s = s.replace(".", "").replace(",", ".")
	try:
		return float(s)
	except Exception:
		return np.nan


def col_like(df, *keywords):
	"""Find a column by fuzzy match of keywords (lowercase, no spaces)."""
	for c in df.columns:
		lc = c.lower().replace(" ", "")
		if all(k in lc for k in keywords):
			return c
	return None


def restaurants_for_recipe(df, recipe):
	"""
	Aggregate restaurant labels for a recipe.
	Returns comma-separated "OIK104, OIK5.12" where applicable (OIK104 first).
	"""
	vals = (
		df.loc[df["RECIPE NAME"] == recipe, "RESTAURANT"]
		  .dropna()
		  .astype(str)
		  .str.strip()
		  .unique()
		  .tolist()
	)
	vals_norm = []
	for v in vals:
		parts = [p.strip() for p in str(v).replace(";", ",").split(",") if p.strip()]
		for p in parts:
			if p not in vals_norm:
				vals_norm.append(p)
	order = {"OIK104": 0, "OIK5.12": 1}
	vals_norm.sort(key=lambda x: (order.get(x, 9), x))
	return ", ".join(vals_norm) if vals_norm else ""


def rest_sort_key(rest_list_str):
	"""Sorting key to place OIK104 block before OIK5.12."""
	s = str(rest_list_str)
	if "OIK104" in s:
		return 0
	if "OIK5.12" in s:
		return 1
	return 2


def read_csv_smart(path):
	"""
	Read CSV trying UTF-8 first, then BOM-stripped, then common Greek encodings.
	(Keeps behavior identical when UTF-8; only helps if source files are cp1253/iso8859-7.)
	"""
	encodings = ["utf-8", "utf-8-sig", "cp1253", "iso8859-7"]
	last_err = None
	for enc in encodings:
		try:
			return pd.read_csv(path, encoding=enc)
		except Exception as e:
			last_err = e
	raise last_err


def load_and_prepare():
	"""
	Load MENU/INGS, compute category sorting, and aggregate restaurants per recipe.
	Also detect the composite per-portion cost column in MENU (TOTAL / MERIDA composite).
	"""
	menu = read_csv_smart(MENU)
	ings = read_csv_smart(INGS)

	cat_order = [
		"ΠΡΩΙΝΟ", "ΟΡΕΚΤΙΚΑ", "ΣΑΛΑΤΕΣ", "ΤΥΡΙΑ", "ΚΥΡΙΩΣ", "ΠΑΣΤΕΣ ΡΙΖΟΤΑ",
		"ΕΛΛΗΝΙΚΑ ΠΑΡΑΔΟΣΙΑΚΑ", "ΚΡΕΑΤΙΚΑ ΣΤΑ ΚΑΡΒΟΥΝΑ", "ΨΑΡΙΑ ΘΑΛΑΣΣΙΝΑ ΣΤΑ ΚΑΡΒΟΥΝΑ",
		"ΕΠΙΔΟΡΠΙΑ", "ΕΝΔΙΑΜΕΣΑ", "ΠΙΤΣΑ", "ΣΝΑΚΣ", "ΤΥΛΙΧΤΗ ΠΙΤΑ"
	]
	rank = {c: i for i, c in enumerate(cat_order)}
	menu["cat_rank"] = menu["CATEGORY"].map(rank).fillna(9999).astype(int)

	# Collapse to 1 row per recipe with aggregated restaurants
	rows = []
	for rname, sub in menu.groupby("RECIPE NAME", sort=False):
		first = sub.iloc[0].to_dict()
		first["RESTAURANTS_JOINED"] = restaurants_for_recipe(menu, rname)
		rows.append(first)
	agg = pd.DataFrame(rows)

	# Sort by category, then by restaurant block (OIK104 first), then recipe name
	agg["rest_block"] = agg["RESTAURANTS_JOINED"].apply(rest_sort_key)
	agg.sort_values(["cat_rank", "CATEGORY", "rest_block", "RECIPE NAME"], inplace=True)

	# Detect per-portion composite column in MENU (e.g., "TOTAL / MERIDA composite")
	pp_col = None
	for c in menu.columns:
		lc = c.lower()
		if "total" in lc and "merida" in lc and "composite" in lc:
			pp_col = c
			break

	return agg, ings, cat_order, pp_col


def build_styles():
	"""
	Force DejaVu Sans from local 'scripts' folder (or project root) as the ONLY font.
	This guarantees Greek glyphs render correctly.
	"""
	# Look for the font in typical local spots
	here = os.path.abspath(os.path.dirname(__file__)) if "__file__" in globals() else os.getcwd()
	candidate_paths = [
		os.path.join(here, "scripts", "DejaVuSans.ttf"),
		os.path.join(here, "DejaVuSans.ttf"),
	]
	font_path = None
	for p in candidate_paths:
		if os.path.exists(p):
			font_path = p
			break

	if not font_path:
		raise FileNotFoundError(
			"DejaVuSans.ttf not found. Place it at ./scripts/DejaVuSans.ttf or ./DejaVuSans.ttf"
		)

	# Register and set as the one-and-only font used
	pdfmetrics.registerFont(TTFont("DejaVuSans", font_path))
	font_name = "DejaVuSans"

	styles = getSampleStyleSheet()
	# Overwrite or add styles using DejaVuSans everywhere
	styles.add(ParagraphStyle(name="Hdr",       fontName=font_name, fontSize=14, alignment=TA_CENTER, textColor=colors.white, leading=18))
	styles.add(ParagraphStyle(name="TitleRow",  fontName=font_name, fontSize=18, alignment=0,           leading=22, spaceAfter=8))
	styles.add(ParagraphStyle(name="GreyBar",   fontName=font_name, fontSize=12, alignment=0, textColor=colors.black, spaceBefore=6, spaceAfter=6))
	styles.add(ParagraphStyle(name="BigLabel",  fontName=font_name, fontSize=14, spaceAfter=10))
	styles.add(ParagraphStyle(name="CoverTitle",fontName=font_name, fontSize=26, alignment=TA_CENTER, spaceAfter=12, leading=30))
	styles.add(ParagraphStyle(name="IndexTitle",fontName=font_name, fontSize=18, alignment=TA_CENTER, spaceAfter=14))
	styles.add(ParagraphStyle(name="IndexItem", fontName=font_name, fontSize=13, alignment=0, spaceAfter=8))
	styles.add(ParagraphStyle(name="ButtonText",fontName=font_name, fontSize=11, alignment=TA_CENTER, textColor=colors.white))
	return styles, font_name


def build_ing(recipe, ings):
	"""
	Build ingredients df for a recipe.
	Returns (df, total_cost_taxed) where line costs are costcosrecipe × 1.13 (VAT).
	PLUS: COST/kg column from 'costcos'. ΜΜ values: grm / ΤΜΧ.
	"""
	base = ings[ings["RECIPENAME"] == recipe].copy()
	if base.empty:
		return None, 0.0

	grams_col  = "GRAMS" if "GRAMS" in base.columns else col_like(base, "grams")
	kgtmx_col  = "KG / TMX" if "KG / TMX" in base.columns else ("KG/TMX" if "KG/TMX" in base.columns else col_like(base, "kg", "tmx"))
	cost_col   = col_like(base, "costcosrecipe")

	# COST/kg should come from 'costcos' (distinct from costcosrecipe)
	costkg_col = None
	if "costcos" in base.columns:
		costkg_col = "costcos"
	else:
		for c in base.columns:
			lc = c.lower().replace(" ", "")
			if "costcos" in lc and "recipe" not in lc:
				costkg_col = c
				break

	# Drop duplicates by INGREDIENT (keep first) to avoid double counting
	base = base.sort_values(by=["INGREDIENT"]).drop_duplicates(subset=["INGREDIENT"], keep="first")

	rows = []
	total = 0.0
	for _, r in base.iterrows():
		ingr  = str(r.get("INGREDIENT", ""))
		grams = num(r.get(grams_col))
		kg    = num(r.get(kgtmx_col)) if kgtmx_col else None

		# ΜΜ values conversion (lowercase 'grm' else 'ΤΜΧ')
		unit  = "ΤΜΧ" if kg == 1 else "grm"

		raw_cost = num(r.get(cost_col)) if cost_col else None
		taxed    = raw_cost * 1.13 if raw_cost is not None else None  # 13% VAT
		costkg   = num(r.get(costkg_col)) if costkg_col else None     # taken as-is

		rows.append([
			ingr,                                         # Συστατικό
			f"{int(grams) if pd.notna(grams) else ''}",   # Q
			unit,                                         # ΜΜ (grm/ΤΜΧ)
			f"{costkg:.2f}" if costkg is not None else "",# COST/kg
			f"{taxed:.2f}" if taxed is not None else "",  # €
		])

		if taxed is not None:
			total += taxed

	df = pd.DataFrame(rows, columns=["Συστατικό", "Q", "ΜΜ", "COST/kg", "€"])
	return df, float(total)


def main():
	"""Entry point: build the PDF using v38 rules (VAT applied + per-portion from composite col)."""
	menu, ings, cat_order, pp_col = load_and_prepare()
	styles, font_name = build_styles()

	doc = SimpleDocTemplate(
		OUTPUT, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
	)
	story = []

	# Cover
	if os.path.exists(LOGO):
		img = Image(LOGO, width=220, height=220)
		img.hAlign = "CENTER"
		story += [Spacer(1, 40), img]
	story += [Spacer(1, 20), Paragraph("ΣΥΝΤΑΓΕΣ - FOOD COST", styles["CoverTitle"]), PageBreak()]

	# Index
	story.append(Paragraph('<a name="index"/>ΕΥΡΕΤΗΡΙΟ ΚΑΤΗΓΟΡΙΩΝ', styles["IndexTitle"]))

	# Determine first recipe per category for index anchors
	first_anchor = {}
	for _, row in menu.iterrows():
		cat = str(row["CATEGORY"])
		if cat and cat not in first_anchor:
			first_anchor[cat] = str(row["RECIPE NAME"])

	cats = list(menu["CATEGORY"].dropna().astype(str).unique())
	ordered = [c for c in cat_order if c in cats] + [c for c in cats if c not in cat_order]
	for cat in ordered:
		first = first_anchor.get(cat)
		if first:
			story.append(Paragraph(f'<link href="#rec_{first.replace(" ","_")}">{cat}</link>', styles["IndexItem"]))
		else:
			story.append(Paragraph(cat, styles["IndexItem"]))
	story.append(PageBreak())

	# Content pages (one per recipe)
	for _, row in menu.iterrows():
		rec         = str(row["RECIPE NAME"])
		cat         = str(row["CATEGORY"])
		restaurants = row["RESTAURANTS_JOINED"]
		merides     = int(row.get("MERIDES", 1) or 1)
		final_price = num(row.get("FINAL PRICE"))
		per_portion = num(row.get(pp_col)) if pp_col else None

		# Header strip
		hdr = Table([[Paragraph("ΑΝΑΛΥΣΗ ΣΥΝΤΑΓΗΣ", styles["Hdr"])]], colWidths=[doc.width])
		hdr.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), colors.black),
								 ("TOPPADDING", (0,0), (-1,-1), 6),
								 ("BOTTOMPADDING", (0,0), (-1,-1), 6),
								 ("FONTNAME", (0,0), (-1,-1), font_name)]))
		story += [hdr, Spacer(1, 6)]

		# Title + anchor if first in category
		title = rec
		if first_anchor.get(cat) == rec:
			title = f'<a name="rec_{rec.replace(" ","_")}"/>' + title
		story.append(Paragraph(title, styles["TitleRow"]))

		# Meta (restaurant(s) & category)
		meta = Table([["Εστιατόριο", restaurants], ["Κατηγορία", cat]], colWidths=[120, doc.width-120])
		meta.setStyle(TableStyle([
			("FONTNAME",   (0,0), (-1,-1), font_name),
			("FONTSIZE",   (0,0), (-1,-1), 10),
			("GRID",       (0,0), (-1,-1), 0.25, colors.grey),
			("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#f6f6f6")),
		]))
		story += [Spacer(1, 6), meta, Spacer(1, 12)]

		# Ingredients table (VAT applied in line cost)
		story.append(Paragraph("ΣΥΝΤΑΓΗ", styles["BigLabel"]))
		df, total = build_ing(rec, ings)
		if df is not None and not df.empty:
			data = [list(df.columns)] + df.values.tolist() + [["ΣΥΝΟΛΟ", "", "", "", f"{total:.2f}"]]
		
			# Professional, narrower column widths (aligned visually with meta tables)
			t = Table(
				data,
				colWidths=[260, 50, 60, 60, 70],  # Συστατικό | Q | ΜΜ | COST/kg | €
				hAlign="CENTER"
			)
			t.setStyle(TableStyle([
				("FONTNAME",   (0,0), (-1,-1), font_name),
				("FONTSIZE",   (0,0), (-1,-1), 10),
				("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
				("GRID",       (0,0), (-1,-1), 0.5, colors.black),
		
				# Alignments
				("ALIGN",      (1,1), (1,-2), "RIGHT"),   # Q
				("ALIGN",      (2,1), (2,-2), "CENTER"),  # ΜΜ
				("ALIGN",      (3,1), (4,-2), "RIGHT"),   # COST/kg + €
		
				# Totals row
				("ALIGN",      (4,-1), (4,-1), "RIGHT"),
				("ALIGN",      (0,-1), (0,-1), "LEFT"),
				("BACKGROUND", (0,-1), (-1,-1), colors.HexColor("#f5f5f5")),
			]))
			story += [t, Spacer(1, 14)]

		# Costing box
		story.append(Table([[Paragraph("ΚΟΣΤΟΛΟΓΗΣΗ", styles["GreyBar"])]], colWidths=[doc.width]))

		# Blank out missing/zero values
		pp_txt    = f"{per_portion:.2f}" if per_portion and not pd.isna(per_portion) else ""
		price_txt = f"{final_price:.2f}" if final_price and not pd.isna(final_price) and final_price != 0 else ""

		meta2 = [
			["Μερίδες", str(merides), "", ""],
			["Κόστος μερίδας (€)", pp_txt, "Τιμή Πώλησης (€)", price_txt],
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

		# Back-to-index button
		btn = Table([[Paragraph('<link href="#index">ΑΡΧΙΚΗ ↑</link>', styles["ButtonText"])]], colWidths=[120], hAlign="CENTER")
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

	# Build PDF
	doc.build(story)
	print("Saved:", OUTPUT)


if __name__ == "__main__":
	main()
