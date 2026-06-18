/**
 * Onboarding progress store. Persists the user's answers across the multi-step
 * health-profile + goals flow so they can resume if they exit mid-way.
 */
import type {
  ChronicCondition,
  Gender,
  HealthGoal,
  HealthProfileInput,
} from '@vital/shared';
import { create } from 'zustand';

export type OnboardingStep =
  | 'dob'
  | 'gender'
  | 'measurements'
  | 'conditions'
  | 'family_history'
  | 'goals'
  | 'complete';

const STEP_ORDER: OnboardingStep[] = [
  'dob',
  'gender',
  'measurements',
  'conditions',
  'family_history',
  'goals',
  'complete',
];

interface OnboardingState {
  step: OnboardingStep;
  dateOfBirth: string | null;
  gender: Gender | null;
  heightCm: number | null;
  weightKg: number | null;
  chronicConditions: ChronicCondition[];
  familyHistory: ChronicCondition[];
  healthGoals: HealthGoal[];

  setField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  next: () => void;
  back: () => void;
  goTo: (step: OnboardingStep) => void;
  progress: () => number; // 0..1
  toHealthProfile: () => HealthProfileInput | null;
  reset: () => void;
}

type OnboardingData = Pick<
  OnboardingState,
  | 'dateOfBirth'
  | 'gender'
  | 'heightCm'
  | 'weightKg'
  | 'chronicConditions'
  | 'familyHistory'
  | 'healthGoals'
>;

const initialData: OnboardingData = {
  dateOfBirth: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  chronicConditions: [],
  familyHistory: [],
  healthGoals: [],
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  step: 'dob',
  ...initialData,

  setField: (key, value) => set({ [key]: value } as Partial<OnboardingState>),

  next: () => {
    const idx = STEP_ORDER.indexOf(get().step);
    const nextStep = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
    if (nextStep) set({ step: nextStep });
  },

  back: () => {
    const idx = STEP_ORDER.indexOf(get().step);
    const prevStep = STEP_ORDER[Math.max(idx - 1, 0)];
    if (prevStep) set({ step: prevStep });
  },

  goTo: (step) => set({ step }),

  progress: () => {
    const idx = STEP_ORDER.indexOf(get().step);
    return idx / (STEP_ORDER.length - 1);
  },

  toHealthProfile: () => {
    const s = get();
    if (!s.dateOfBirth || !s.gender) return null;
    return {
      date_of_birth: s.dateOfBirth,
      gender: s.gender,
      height_cm: s.heightCm ?? undefined,
      weight_kg: s.weightKg ?? undefined,
      chronic_conditions: s.chronicConditions,
      family_history: s.familyHistory,
    };
  },

  reset: () => set({ step: 'dob', ...initialData }),
}));
