/**
 * Subscription plan seed data (Basic + Premium).
 */
export interface PlanSeed {
  name: 'basic' | 'premium';
  price_egp: number;
  price_display: string;
  annual_tests_count: number;
  biomarker_count: number;
  features: string[];
  is_active: boolean;
}

export const PLAN_SEED: PlanSeed[] = [
  {
    name: 'basic',
    price_egp: 5999,
    price_display: '5,999 EGP / year',
    annual_tests_count: 1,
    biomarker_count: 60,
    features: [
      '1 comprehensive test per year',
      '60+ biomarkers',
      'Full dashboard access',
      'Historical tracking',
      'Educational content',
    ],
    is_active: true,
  },
  {
    name: 'premium',
    price_egp: 9999,
    price_display: '9,999 EGP / year',
    annual_tests_count: 2,
    biomarker_count: 80,
    features: [
      '2 tests per year',
      '80+ biomarkers (expanded panel)',
      'Optimal vs. normal range comparison',
      'Priority access to new features',
      'Personalized supplement guidance (Phase 2)',
    ],
    is_active: true,
  },
];
