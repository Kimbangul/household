// Digit strings longer than 15 lose precision once converted to a JS number
// (Number.MAX_SAFE_INTEGER has 16 digits) — no real 원화 amount needs it.
const DIGIT_PATTERN = /^\d{1,15}$/;

export function parseDigitAmount(text: string): number {
  return DIGIT_PATTERN.test(text) ? Number(text) : NaN;
}
