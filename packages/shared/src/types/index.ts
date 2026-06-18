/**
 * VITAL — Shared domain types (Phase 1)
 *
 * These mirror the database schema and the API contracts. They are the single
 * source of truth for the shapes that cross the API boundary between the Hono
 * backend and the Expo mobile client.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Primitives & enums
// ─────────────────────────────────────────────────────────────────────────────

export type UUID = string;
export type ISODateString = string; // e.g. "2026-06-03"
export type ISODateTimeString = string; // e.g. "2026-06-03T11:37:00.000Z"

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export type UserRole = 'user' | 'admin' | 'lab_partner';

export type ResultSource = 'manual' | 'admin' | 'lab_upload';

export type LabUploadStatus = 'parsed' | 'confirmed' | 'failed';

export type PlanName = 'basic' | 'premium';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export type BiomarkerStatus = 'optimal' | 'suboptimal' | 'alert' | 'untested';

export type CategorySlug =
  | 'metabolic'
  | 'hormonal'
  | 'cardiovascular'
  | 'nutritional'
  | 'inflammatory'
  | 'thyroid'
  | 'hepatic'
  | 'blood';

/** Default goal slugs used to seed the (now admin-managed) health_goals table. */
export const HEALTH_GOALS = [
  'optimize_energy',
  'metabolic_health',
  'balance_hormones',
  'reduce_inflammation',
  'longevity',
  'athletic_performance',
  'weight_management',
  'general_awareness',
] as const;

/**
 * A user's stored health goal is a slug. Goals are managed in the dashboard, so
 * this is a plain string rather than a fixed union.
 */
export type HealthGoal = string;

/** An admin-managed onboarding goal option. */
export interface HealthGoalOption {
  id: UUID;
  slug: string;
  label: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

export const CHRONIC_CONDITIONS = [
  'diabetes',
  'hypertension',
  'thyroid',
  'none',
  'prefer_not_to_say',
] as const;

export type ChronicCondition = (typeof CHRONIC_CONDITIONS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: UUID;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  date_of_birth: ISODateString | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  chronic_conditions: ChronicCondition[];
  family_history: ChronicCondition[];
  health_goals: HealthGoal[];
  activity_level: ActivityLevel | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription
// ─────────────────────────────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: UUID;
  name: PlanName;
  price_egp: number;
  price_display: string;
  annual_tests_count: number;
  biomarker_count: number;
  features: string[];
  is_active: boolean;
}

export interface Subscription {
  id: UUID;
  user_id: UUID;
  plan_id: UUID;
  status: SubscriptionStatus;
  started_at: ISODateTimeString;
  expires_at: ISODateTimeString;
  payment_reference: string | null;
  created_at: ISODateTimeString;
}

export interface SubscriptionWithPlan extends Subscription {
  plan: SubscriptionPlan;
}

// ─────────────────────────────────────────────────────────────────────────────
// Biomarkers
// ─────────────────────────────────────────────────────────────────────────────

export interface BiomarkerCategory {
  id: UUID;
  name: string;
  slug: CategorySlug;
  description: string;
  icon: string;
  color: string;
  display_order: number;
}

export interface Biomarker {
  id: UUID;
  category_id: UUID;
  name: string;
  slug: string;
  unit: string;
  description: string;
  why_it_matters: string;
  what_affects_it: string;
  optimal_low: number;
  optimal_high: number;
  normal_low: number;
  normal_high: number;
  min_plausible: number;
  max_plausible: number;
  is_active: boolean;
  display_order: number;
  tags: string[];
  /** À-la-carte add-on price in EGP; null/0 = not purchasable outside a plan. */
  addon_price_egp: number | null;
}

/** A biomarker offered as a paid add-on (extra test) at booking checkout. */
export interface AddonMarker {
  id: UUID;
  name: string;
  unit: string;
  category_id: UUID;
  category_name: string;
  price_egp: number;
}

export type AddonOrderStatus = 'pending' | 'paid' | 'cancelled';

export interface AddonOrderItem {
  biomarker_id: UUID;
  name: string;
  price_egp: number;
}

/** A paid (or pending) order for extra markers attached to a booking. */
export interface AddonOrder {
  id: UUID;
  user_id: UUID;
  booking_id: UUID;
  status: AddonOrderStatus;
  subtotal_egp: number;
  vat_egp: number;
  total_egp: number;
  items: AddonOrderItem[];
  created_at: string;
}

export interface BiomarkerWithCategory extends Biomarker {
  category: BiomarkerCategory;
}

/** Biomarker plus the requesting user's latest result + computed status. */
export interface BiomarkerWithResult extends Biomarker {
  category?: BiomarkerCategory;
  latest_result: UserBiomarkerResult | null;
  status: BiomarkerStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

export interface UserBiomarkerResult {
  id: UUID;
  user_id: UUID;
  biomarker_id: UUID;
  value: number;
  tested_at: ISODateString;
  lab_name: string | null;
  notes: string | null;
  source: ResultSource;
  lab_upload_id: UUID | null;
  // The lab's printed reference range for this result (provenance), when known.
  reference_range: string | null;
  ref_low: number | null;
  ref_high: number | null;
  created_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────────────────────────────────────

/** One row of values extracted from a lab PDF, pending admin confirmation. */
export interface ParsedLabRow {
  biomarker_id: UUID | null;
  biomarker_name: string; // as written in the PDF
  matched_name: string | null; // the VITAL biomarker it matched, if any
  value: number | null;
  unit: string | null;
  confidence: number; // 0..1
  include: boolean;
  // The lab's reference range as printed on the PDF (patient-specific), if found.
  reference_range?: string | null; // raw text, e.g. "40 - 129", "Up to 0.90"
  ref_low?: number | null;
  ref_high?: number | null;
}

export interface LabUpload {
  id: UUID;
  user_id: UUID;
  file_path: string;
  original_name: string;
  lab_name: string | null;
  tested_at: ISODateString | null;
  status: LabUploadStatus;
  parsed: ParsedLabRow[];
  result_count: number;
  uploaded_by: UUID | null;
  created_at: ISODateTimeString;
  /** Signed URL to view the original PDF (populated on demand). */
  file_url?: string;
}

/** Compact row for the admin user list. */
export interface AdminUserSummary {
  id: UUID;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  subscription_status: SubscriptionStatus | null;
  plan_name: PlanName | null;
  result_count: number;
  created_at: ISODateTimeString;
}

/** Full admin view of a single user. */
export interface AdminUserDetail {
  user: User;
  subscription: SubscriptionWithPlan | null;
  results: UserBiomarkerResult[];
  lab_uploads: LabUpload[];
  score: VitalScore | null;
}

export interface AdminOverview {
  users_total: number;
  admins_total: number;
  active_subscriptions: number;
  revenue_egp: number;
  results_total: number;
  lab_uploads_total: number;
  pending_uploads: number;
  plan_breakdown: { plan: PlanName; count: number }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// App content / settings (admin-managed, surfaced in the mobile app)
// ─────────────────────────────────────────────────────────────────────────────

export interface LabPartnerInfo {
  name: string;
  description: string;
  phone: string;
  url: string;
}

/** The structured, mobile-facing content bundle. Keys map to app_settings rows. */
export interface AppContent {
  welcome_tagline: string;
  support_email: string;
  lab_partner: LabPartnerInfo;
}

export const DEFAULT_APP_CONTENT: AppContent = {
  welcome_tagline: 'Know your body.\nBefore it fails you.',
  support_email: 'support@vital.app',
  lab_partner: {
    name: 'VITAL Lab Partners',
    description: 'Book your comprehensive panel at a partner lab near you.',
    phone: '',
    url: '',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// VITAL Score (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

/** Score quality band — drives ring color and label. */
export type ScoreBand = 'excellent' | 'good' | 'fair' | 'attention';

/** Per-category contribution to the overall score. */
export interface CategoryScore {
  slug: string;
  name: string;
  score: number; // 0..100, continuous health score of the category's tested markers
  band: ScoreBand;
  tested: number; // markers with a result in this category
  total: number; // active markers in this category
}

/** Levine clinical PhenoAge result (the lab-grade biological-age engine). */
export interface PhenoAgeResult {
  biological_age: number; // years
  mortality_risk_10yr: number; // 0..1, the model's 10-year mortality probability
  markers_used: number; // real (non-imputed) markers used, of markers_total
  markers_total: number; // markers the full model expects (9)
  imputed: string[]; // canonical marker keys that were imputed (missing data)
}

/** A single marker called out as moving a score up or down. */
export interface ScoreDriver {
  slug: string;
  name: string;
  category: string;
  score: number; // 0..100 marker health score
}

/** The computed VITAL Score for a user at a point in time (lab-only model). */
export interface VitalScore {
  score: number; // 0..100 overall Health Score
  band: ScoreBand;
  tested_count: number; // markers with a result
  total_count: number; // active markers considered
  coverage: number; // tested_count / total_count, 0..1
  confidence: number; // 0..100 — how much to trust this assessment
  category_scores: CategoryScore[];
  // Sub-scores (null when the underlying data is insufficient)
  cardiometabolic_score: number | null; // 0..100
  longevity_score: number | null; // 0..100
  // Biological age (Levine PhenoAge when labs allow; null otherwise)
  chronological_age: number | null;
  biological_age: number | null;
  age_delta: number | null; // biological_age − chronological_age
  phenoage: PhenoAgeResult | null;
  drivers: { positive: ScoreDriver[]; negative: ScoreDriver[] };
  computed_at: ISODateTimeString;
}

/** A persisted snapshot of the score, for the history trend. */
export interface ScoreHistoryPoint {
  id: UUID;
  score: number;
  band: ScoreBand;
  tested_count: number;
  total_count: number;
  biological_age: number | null;
  cardiometabolic_score: number | null;
  longevity_score: number | null;
  confidence: number;
  recorded_on: ISODateString;
  created_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Health Intelligence (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

export type AiInsightType = 'summary' | 'protocol';
export type AiInsightStatus = 'draft' | 'published' | 'archived';
export type AiInsightSource = 'system' | 'admin' | 'user';

/** A generated clinician note / protocol grounded in a user's lab data. */
export interface AiInsight {
  id: UUID;
  user_id: UUID;
  type: AiInsightType;
  title: string;
  body: string; // markdown
  status: AiInsightStatus;
  model: string;
  source: AiInsightSource;
  input_tokens: number;
  output_tokens: number;
  created_at: ISODateTimeString;
  published_at: ISODateTimeString | null;
}

export type AiChatRole = 'user' | 'assistant';

export interface AiChatMessage {
  id: UUID;
  user_id: UUID;
  role: AiChatRole;
  content: string;
  created_at: ISODateTimeString;
}

/** Admin-controlled AI configuration (stored in app_settings). */
export interface AiConfig {
  enabled: boolean;
  model: string;
  max_tokens: number;
  persona: string; // appended to the system prompt
  disclaimer: string; // shown to users alongside AI output
  features: { insights: boolean; protocols: boolean; chat: boolean };
  require_review: boolean; // insights start as drafts; users see only published
  allow_user_generate: boolean; // users may trigger generation themselves
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  enabled: false,
  model: 'claude-opus-4-8',
  max_tokens: 3000,
  persona:
    'You are VITAL, a careful, encouraging preventive-health guide. You explain blood biomarker results in plain language, focus on what is modifiable, and never diagnose disease or prescribe medication.',
  disclaimer:
    'This is AI-generated wellness information, not medical advice. Always consult a licensed clinician before making health decisions.',
  features: { insights: true, protocols: true, chat: true },
  require_review: true,
  allow_user_generate: false,
};

/** Public AI status surfaced to the mobile app. */
export interface AiStatus {
  enabled: boolean;
  features: { insights: boolean; protocols: boolean; chat: boolean };
  allow_user_generate: boolean;
  disclaimer: string;
}

export interface AiUsageStats {
  total_input_tokens: number;
  total_output_tokens: number;
  insight_count: number;
  chat_message_count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interventions / Recommendations (Phase 2 — supplement & protocol guidance)
// ─────────────────────────────────────────────────────────────────────────────

export type InterventionCategory = 'supplement' | 'nutrition' | 'lifestyle' | 'retest';
export type EvidenceLevel = 'strong' | 'moderate' | 'limited';

/** An admin-managed catalog entry that can be recommended to users. */
export interface Intervention {
  id: UUID;
  name: string;
  slug: string;
  category: InterventionCategory;
  summary: string;
  detail: string;
  dosage: string;
  evidence_level: EvidenceLevel;
  url: string;
  target_biomarker_slugs: string[]; // markers this addresses
  trigger_statuses: BiomarkerStatus[]; // statuses that surface it
  is_active: boolean;
  display_order: number;
}

export interface RecommendationMarker {
  slug: string;
  name: string;
  status: BiomarkerStatus;
}

/** An intervention surfaced for a user, with the markers that triggered it. */
export interface RecommendedIntervention {
  intervention: Intervention;
  matched: RecommendationMarker[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications & engagement (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'alert'
  | 'retest'
  | 'score'
  | 'insight'
  | 'booking'
  | 'visit'
  | 'results'
  | 'announcement'
  | 'system';
export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface AppNotification {
  id: UUID;
  user_id: UUID;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  link: string | null; // optional in-app deep link, e.g. "biomarker/<id>"
  read_at: ISODateTimeString | null;
  created_at: ISODateTimeString;
}

export interface NotificationFeed {
  notifications: AppNotification[];
  unread_count: number;
}

/** Admin-controlled rules for system-generated alerts. */
export interface NotificationConfig {
  out_of_range_alerts: boolean;
  retest_reminders: boolean;
  retest_cadence_months: number;
  score_drop_alerts: boolean;
  score_drop_threshold: number; // points of VITAL Score
}

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  out_of_range_alerts: true,
  retest_reminders: true,
  retest_cadence_months: 6,
  score_drop_alerts: true,
  score_drop_threshold: 5,
};

export interface NotificationStats {
  total: number;
  unread: number;
  device_count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test booking (Phase 2 — service areas, availability, bookings)
// ─────────────────────────────────────────────────────────────────────────────

/** A serviceable area (e.g. "New Cairo") with its default slot window length. */
export interface ServiceArea {
  id: UUID;
  name: string;
  slug: string;
  city: string;
  default_slot_minutes: number; // 60 | 120 | 180 — the area's default window length
  is_active: boolean;
  display_order: number;
}

/** A recurring weekly availability window template for an area. */
export interface AvailabilityWindow {
  id: UUID;
  area_id: UUID;
  day_of_week: number; // 0=Sunday … 6=Saturday
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  capacity: number; // number of tests bookable in this window
}

/** A custom window inside a date override. */
export interface OverrideWindow {
  start_time: string;
  end_time: string;
  capacity: number;
}

/** A per-date override: close the date, or replace its windows. */
export interface AvailabilityOverride {
  id: UUID;
  area_id: UUID;
  date: ISODateString;
  is_closed: boolean;
  windows: OverrideWindow[] | null; // null = fall back to the weekly template
}

/** A resolved, bookable slot for a specific date with live remaining capacity. */
export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  capacity: number;
  booked: number;
  remaining: number;
}

export interface DayAvailability {
  date: ISODateString;
  is_closed: boolean;
  slots: AvailabilitySlot[];
}

export type BookingStatus = 'booked' | 'cancelled' | 'completed';

export interface Booking {
  id: UUID;
  user_id: UUID;
  area_id: UUID;
  area_name: string;
  date: ISODateString;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  created_at: ISODateTimeString;
}

/** Admin booking row with the user attached. */
export interface AdminBooking extends Booking {
  user_name: string;
  user_email: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lab partner portal
// ─────────────────────────────────────────────────────────────────────────────

/** A lab-partner account with the service areas it's assigned to. */
export interface LabPartnerSummary {
  id: UUID;
  email: string;
  full_name: string;
  phone: string | null;
  area_ids: UUID[];
  areas: { id: UUID; name: string; city: string }[];
}

/** Summary of the patient's active plan — what tests the draw should cover. */
export interface PartnerPlanSummary {
  name: PlanName;
  biomarker_count: number;
  annual_tests_count: number;
  features: string[];
}

/** Patient summary shown to a lab partner alongside an appointment. */
export interface PartnerUserSummary {
  id: UUID;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: ISODateString | null;
  gender: Gender | null;
  height_cm: number | null;
}

/** A booking enriched for the partner appointments view. */
export interface PartnerAppointment extends Booking {
  user: PartnerUserSummary;
  plan: PartnerPlanSummary | null;
}

/** Full patient detail for the partner (gated to the partner's areas). */
export interface PartnerUserDetail {
  user: PartnerUserSummary;
  plan: PartnerPlanSummary | null;
  appointments: Booking[];
  lab_uploads: LabUpload[];
  results: UserBiomarkerResult[];
  /** Paid extra markers (out-of-plan add-ons), grouped by booking. */
  addon_orders: AddonOrder[];
}

/** An admin-managed message a visiting doctor can push to a patient
 *  (e.g. "Doctor arriving within 30 minutes"). */
export interface NotificationTemplate {
  id: UUID;
  title: string;
  body: string;
  is_active: boolean;
  display_order: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API envelopes
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface BiomarkerListResponse {
  biomarkers: BiomarkerWithResult[];
  total: number;
  categories: BiomarkerCategory[];
}

export interface PaymentInitiateResponse {
  payment_key: string;
  iframe_url: string;
  order_id: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: User;
}
