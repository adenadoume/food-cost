export interface Supplier {
  id: string;
  code: string | null;
  ime_code: string | null;
  name: string;
  tax_id: string | null;
  tax_office: string | null;
  city: string | null;
  business_type: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export interface Ingredient {
  id: string;
  code: string | null;
  ime_code: string | null;
  name: string;
  cost_per_kg: number;
  category: string | null;
  supplier_id: string | null;
  unit_type: string; // 'kg' = measured in grams (kg_tmx=1000), 'pcs' = pieces (kg_tmx=1)
  created_at: string;
  // joined
  suppliers?: Supplier | null;
}

export interface Recipe {
  id: string;
  code: string | null;
  name: string;
  category: string | null;
  restaurant: string[]; // ['OIK104'], ['OIK512'], or ['OIK104','OIK512']
  merides: number;
  final_price: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  grams: number;
  kg_tmx: number; // 1000 = grams unit, 1 = pieces
  comments: string | null;
  created_at: string;
  // joined
  ingredients?: Ingredient | null;
}

// Computed cost row (client-side)
export interface RecipeIngredientWithCost extends RecipeIngredient {
  line_cost: number; // (grams / kg_tmx) * cost_per_kg
}

// Recipe enriched with all computed cost columns
export interface RecipeWithCosts extends Recipe {
  recipe_cost: number;
  vat_13: number;
  total_cost: number;
  total_per_meride: number;
  price_x3: number;
  price_x4: number;
}
