import { describe, test, expect } from 'vitest';
import { calculateCO2, CARBON_COEFFICIENTS } from './carbonMath';

describe('calculateCO2', () => {
  test('correctly calculates carbon for car mode', () => {
    // coefficient = 0.21
    expect(calculateCO2('car', 10)).toBe(2.1);
    expect(calculateCO2('car', 5.5)).toBe(1.16); // 5.5 * 0.21 = 1.155 -> rounded to 1.16
  });

  test('correctly calculates carbon for bus mode', () => {
    // coefficient = 0.10
    expect(calculateCO2('bus', 15)).toBe(1.5);
    expect(calculateCO2('bus', 0)).toBe(0);
  });

  test('correctly calculates carbon for train mode', () => {
    // coefficient = 0.04
    expect(calculateCO2('train', 100)).toBe(4);
    expect(calculateCO2('train', 25.3)).toBe(1.01); // 25.3 * 0.04 = 1.012 -> rounded to 1.01
  });

  test('correctly calculates carbon for bike mode', () => {
    // coefficient = 0.00
    expect(calculateCO2('bike', 12.5)).toBe(0);
  });

  test('correctly calculates carbon for walk mode', () => {
    // coefficient = 0.00
    expect(calculateCO2('walk', 5)).toBe(0);
  });

  test('correctly calculates carbon for flight mode', () => {
    // coefficient = 0.25
    expect(calculateCO2('flight', 500)).toBe(125);
    expect(calculateCO2('flight', 1234.5)).toBe(308.63); // 1234.5 * 0.25 = 308.625 -> rounded to 308.63
  });

  test('handles invalid mode gracefully', () => {
    expect(calculateCO2('spaceship', 10)).toBe(0);
    expect(calculateCO2('', 10)).toBe(0);
    expect(calculateCO2(null, 10)).toBe(0);
    expect(calculateCO2(undefined, 10)).toBe(0);
  });

  test('handles invalid or edge case distances gracefully', () => {
    expect(calculateCO2('car', -10)).toBe(0);
    expect(calculateCO2('car', '10')).toBe(0);
    expect(calculateCO2('car', null)).toBe(0);
    expect(calculateCO2('car', NaN)).toBe(0);
  });

  test('handles case sensitivity and spaces in mode names', () => {
    expect(calculateCO2('  CAR  ', 10)).toBe(2.1);
    expect(calculateCO2('Flight', 10)).toBe(2.5);
  });
});
