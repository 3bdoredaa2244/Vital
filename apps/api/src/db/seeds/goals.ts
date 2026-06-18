/**
 * Default onboarding health-goal options (admin-editable thereafter).
 */
export interface HealthGoalSeed {
  slug: string;
  label: string;
  icon: string;
  display_order: number;
}

export const HEALTH_GOAL_SEED: HealthGoalSeed[] = [
  { slug: 'optimize_energy', label: 'Optimize energy levels', icon: 'Zap', display_order: 1 },
  { slug: 'metabolic_health', label: 'Improve metabolic health', icon: 'Flame', display_order: 2 },
  { slug: 'balance_hormones', label: 'Balance hormones', icon: 'Activity', display_order: 3 },
  { slug: 'reduce_inflammation', label: 'Reduce inflammation', icon: 'Gauge', display_order: 4 },
  { slug: 'longevity', label: 'Longevity & prevention', icon: 'Hourglass', display_order: 5 },
  { slug: 'athletic_performance', label: 'Athletic performance', icon: 'Dumbbell', display_order: 6 },
  { slug: 'weight_management', label: 'Weight management', icon: 'Scale', display_order: 7 },
  { slug: 'general_awareness', label: 'General health awareness', icon: 'HeartPulse', display_order: 8 },
];
