export const CATEGORY_ORDER = [
  'ΠΡΩΙΝΟ',
  'ΟΡΕΚΤΙΚΑ',
  'ΣΑΛΑΤΕΣ',
  'ΤΥΡΙΑ',
  'ΚΥΡΙΩΣ',
  'ΠΑΣΤΕΣ - ΡΙΖΟΤΑ',
  'ΕΛΛΗΝΙΚΑ ΠΑΡΑΔΟΣΙΑΚΑ',
  'ΚΡΕΑΤΙΚΑ ΣΤΑ ΚΑΡΒΟΥΝΑ',
  'ΨΑΡΙΑ ΘΑΛΑΣΣΙΝΑ ΣΤΑ ΚΑΡΒΟΥΝΑ',
  'ΕΠΙΔΟΡΠΙΑ',
  'ΕΝΔΙΑΜΕΣΑ',
  'ΠΙΤΣΑ',
  'ΣΝΑΚΣ',
  'ΤΥΛΙΧΤΗ ΠΙΤΑ',
];

export const CATEGORY_RANK: Record<string, number> = Object.fromEntries(
  CATEGORY_ORDER.map((c, i) => [c, i])
);

export const INGREDIENT_CATEGORIES = [
  'ΔΙΑΦΟΡΑ',
  'ΤΥΡΙΑ',
  'ΤΥΡΟΚΟΜΙΚΑ',
  'ΛΑΧΑΝΙΚΑ',
  'ΚΡΕΑΤΙΚΑ',
  'ΨΑΡΙΑ',
  'ΑΛΕΥΡΑ',
  'SUPER FOOD',
  'COMPOSITE',
  'ΑΝΑΨΥΚΤΙΚΑ',
  'ΜΠΑΧΑΡΙΚΑ',
  'ΕΛΑΙΟΛΑΔΑ',
  'ΓΑΛΑΚΤΟΚΟΜΙΚΑ',
  'ΖΥΜΑΡΙΚΑ',
  'ΑΛΛΑΝΤΙΚΑ',
];

export const RESTAURANT_LABELS: Record<string, string> = {
  OIK104: 'OIK104',
  OIK512: 'OIK5.12',
};

// Category badge colors for Ingredient Category
export const CATEGORY_COLORS: Record<string, string> = {
  ΤΥΡΙΑ: '#f59e0b',
  ΤΥΡΟΚΟΜΙΚΑ: '#fbbf24',
  ΛΑΧΑΝΙΚΑ: '#34d399',
  ΚΡΕΑΤΙΚΑ: '#f87171',
  ΨΑΡΙΑ: '#60a5fa',
  ΑΛΕΥΡΑ: '#d4b896',
  'SUPER FOOD': '#a78bfa',
  COMPOSITE: '#fb923c',
  ΔΙΑΦΟΡΑ: '#9ca3af',
  ΜΠΑΧΑΡΙΚΑ: '#86efac',
  ΕΛΑΙΟΛΑΔΑ: '#fde68a',
  ΓΑΛΑΚΤΟΚΟΜΙΚΑ: '#e0f2fe',
  ΖΥΜΑΡΙΚΑ: '#fef3c7',
  ΑΛΛΑΝΤΙΚΑ: '#fca5a5',
};
