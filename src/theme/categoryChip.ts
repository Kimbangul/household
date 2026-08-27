// Fixed accent palette pulled from the Figma reference (iBank UI kit,
// node-id 143:601) — used as-is in both light and dark mode, since the chip
// background is always this saturated color with white text on top.
export const CATEGORY_CHIP_COLORS = [
  '#3629B7', // indigo
  '#FF4267', // red
  '#0890FE', // blue
  '#FFAF2A', // orange
  '#52D5BA', // teal
  '#5655B9', // violet
];

// A stable, order-independent hash so a category keeps the same chip color
// across renders/sessions regardless of where it sits in the category list.
// `null` (미분류) hashes through the same path as any other id.
function hashKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % CATEGORY_CHIP_COLORS.length;
  }
  return hash;
}

export function getCategoryChipColor(categoryId: string | null): string {
  const key = categoryId ?? 'uncategorized';
  return CATEGORY_CHIP_COLORS[hashKey(key)];
}

export function getCategoryInitial(label: string): string {
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : '?';
}
