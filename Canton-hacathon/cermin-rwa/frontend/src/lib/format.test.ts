import { describe, expect, it } from 'vitest';
import { formatPrice, formatShortDate } from './format';

// Only the two Task 17 additions get their own tests here — the rest of
// format.ts is already exercised indirectly through health/store/component
// tests and this file's job is not to duplicate that coverage.

describe('formatPrice (Task 17 chart header + defense/floor line labels)', () => {
  it('shows 2 decimals for a price that rounds cleanly to cents', () => {
    expect(formatPrice(0.78)).toBe('$0.78');
    expect(formatPrice(1)).toBe('$1.00');
    expect(formatPrice(0.5)).toBe('$0.50');
  });

  it('shows a 3rd decimal only when 2 decimals would lose information (demo floor $0.585)', () => {
    expect(formatPrice(0.585)).toBe('$0.585');
  });

  it('rounds a longer float to 3 decimals rather than showing floating-point noise', () => {
    expect(formatPrice(0.7833333333)).toBe('$0.783');
  });

  it('handles 0', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});

describe('formatShortDate (chart x-axis ticks — no year)', () => {
  it('formats as "Mon D"', () => {
    expect(formatShortDate(new Date(Date.UTC(2026, 6, 10, 12)))).toMatch(/^Jul 10$/);
    expect(formatShortDate(new Date(Date.UTC(2026, 0, 1, 12)))).toMatch(/^Jan 1$/);
  });
});
