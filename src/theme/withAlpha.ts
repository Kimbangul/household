// Appends a 2-digit hex alpha suffix to a 6-digit hex color (e.g.
// `withAlpha('#3629b7', 0.35)` -> '#3629b759'), used throughout the
// soft-modern reskin for tinted chip backgrounds and colored shadows. Only
// works for 6-digit hex input — never pass an rgb()/hsl() string.
export function withAlpha(hex: string, opacity: number): string {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alpha}`;
}
