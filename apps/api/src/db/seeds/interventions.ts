/**
 * Default intervention catalog. These map common out-of-range markers to
 * evidence-based, non-prescriptive supplement / nutrition / lifestyle guidance.
 * Admins can edit, disable, or extend these from the dashboard.
 */
import type { InterventionInput } from '@vital/shared';

export const INTERVENTION_SEED: InterventionInput[] = [
  {
    name: 'Omega-3 (EPA/DHA)',
    slug: 'omega-3',
    category: 'supplement',
    summary: 'Supports a healthier lipid profile and lowers inflammation.',
    detail:
      'Marine omega-3 fatty acids can lower triglycerides and modestly reduce inflammatory markers. Choose a third-party-tested fish or algae oil.',
    dosage: '1–2 g combined EPA/DHA daily with food',
    evidence_level: 'strong',
    url: '',
    target_biomarker_slugs: ['triglycerides', 'hscrp-cardiac', 'hscrp-inflammation', 'apob'],
    trigger_statuses: ['suboptimal', 'alert'],
    is_active: true,
    display_order: 1,
  },
  {
    name: 'Reduce refined carbohydrates',
    slug: 'lower-refined-carbs',
    category: 'nutrition',
    summary: 'Improves glucose control and insulin sensitivity.',
    detail:
      'Replacing refined carbohydrates and sugary drinks with whole foods, fiber, and protein helps stabilize blood sugar and HbA1c over time.',
    dosage: '',
    evidence_level: 'strong',
    url: '',
    target_biomarker_slugs: ['fasting-glucose', 'hba1c', 'glucose-insulin-ratio'],
    trigger_statuses: ['suboptimal', 'alert'],
    is_active: true,
    display_order: 2,
  },
  {
    name: 'Zone 2 cardio',
    slug: 'zone-2-cardio',
    category: 'lifestyle',
    summary: 'Builds metabolic and cardiovascular fitness.',
    detail:
      'Regular low-intensity aerobic exercise improves insulin sensitivity, lipids, and resting heart rate. Aim for conversational-pace sessions.',
    dosage: '150+ minutes per week',
    evidence_level: 'strong',
    url: '',
    target_biomarker_slugs: ['fasting-glucose', 'hba1c', 'triglycerides', 'apob'],
    trigger_statuses: ['suboptimal', 'alert'],
    is_active: true,
    display_order: 3,
  },
  {
    name: 'Vitamin D3',
    slug: 'vitamin-d3',
    category: 'supplement',
    summary: 'Corrects low vitamin D, common with limited sun exposure.',
    detail:
      'Vitamin D supports bone, immune, and metabolic health. Dose to your level and re-test in 8–12 weeks; pair with vitamin K2 if advised.',
    dosage: '1,000–4,000 IU daily with a fat-containing meal',
    evidence_level: 'moderate',
    url: '',
    target_biomarker_slugs: ['vitamin-d', 'vitamin-d-25-oh'],
    trigger_statuses: ['suboptimal', 'alert'],
    is_active: true,
    display_order: 4,
  },
  {
    name: 'Anti-inflammatory diet',
    slug: 'anti-inflammatory-diet',
    category: 'nutrition',
    summary: 'Lowers chronic inflammation through whole-food patterns.',
    detail:
      'A Mediterranean-style pattern rich in vegetables, olive oil, fish, and fiber is associated with lower hs-CRP and better cardiometabolic markers.',
    dosage: '',
    evidence_level: 'moderate',
    url: '',
    target_biomarker_slugs: ['hscrp-inflammation', 'hscrp-cardiac'],
    trigger_statuses: ['suboptimal', 'alert'],
    is_active: true,
    display_order: 5,
  },
  {
    name: 'Re-test in 3 months',
    slug: 'retest-3-months',
    category: 'retest',
    summary: 'Confirm changes and track your trend.',
    detail:
      'For any marker outside its optimal range, a follow-up test in ~12 weeks shows whether lifestyle changes are working and informs next steps.',
    dosage: '',
    evidence_level: 'moderate',
    url: '',
    target_biomarker_slugs: [
      'fasting-glucose',
      'hba1c',
      'triglycerides',
      'apob',
      'hscrp-inflammation',
      'hscrp-cardiac',
    ],
    trigger_statuses: ['alert'],
    is_active: true,
    display_order: 6,
  },
];
