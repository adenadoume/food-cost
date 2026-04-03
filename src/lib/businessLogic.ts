import { RecipeIngredient, Ingredient } from './types';

/** Cost for one ingredient line: (grams / kg_tmx) × cost_per_kg */
export function lineCost(grams: number, kg_tmx: number, cost_per_kg: number): number {
  if (!kg_tmx || kg_tmx === 0) return 0;
  return (grams / kg_tmx) * cost_per_kg;
}

/** Sum of all line costs for a recipe (pre-VAT) */
export function recipeCost(
  lines: Array<RecipeIngredient & { ingredients?: Ingredient | null }>
): number {
  return lines.reduce((sum, l) => {
    const cpk = l.ingredients?.cost_per_kg ?? 0;
    return sum + lineCost(l.grams, l.kg_tmx, cpk);
  }, 0);
}

export function vatAmount(cost: number): number {
  return cost * 0.13;
}

export function totalCost(cost: number): number {
  return cost * 1.13;
}

export function totalPerMeride(total: number, merides: number): number {
  return merides > 0 ? total / merides : 0;
}

export function priceX3(perMeride: number): number {
  return perMeride * 3;
}

export function priceX4(perMeride: number): number {
  return perMeride * 4;
}

/** Display unit from kg_tmx value */
export function unitLabel(kg_tmx: number): string {
  return kg_tmx === 1 ? 'ΤΜΧ' : 'grm';
}

/** Format a number to 2 decimal places, dash if zero/null */
export function fmt(n: number | null | undefined, zeroAsDash = false): string {
  if (n === null || n === undefined) return '-';
  if (zeroAsDash && n === 0) return '-';
  return n.toFixed(2);
}
