/**
 * Small formatting + health-math helpers used across screens.
 */

export function calculateAge(isoDate: string): number {
  const dob = new Date(isoDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

export interface BmiResult {
  value: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
}

export function calculateBmi(heightCm: number, weightKg: number): BmiResult | null {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  const value = Math.round((weightKg / (m * m)) * 10) / 10;
  let category: BmiResult['category'] = 'Normal';
  if (value < 18.5) category = 'Underweight';
  else if (value < 25) category = 'Normal';
  else if (value < 30) category = 'Overweight';
  else category = 'Obese';
  return { value, category };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatNumber(value: number): string {
  // Trim trailing zeros but keep up to 2 decimals.
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
