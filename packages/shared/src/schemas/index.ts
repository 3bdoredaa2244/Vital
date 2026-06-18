/**
 * VITAL — Shared Zod validation schemas (Phase 1)
 *
 * Used by the API to validate request bodies and by the mobile app to validate
 * forms with React Hook Form. Keeping them here guarantees the client and
 * server agree on what a valid payload looks like.
 */
import { z } from 'zod';

import { CHRONIC_CONDITIONS, HEALTH_GOALS } from '../types/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable field schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Egyptian phone number: +20 followed by 10 digits, e.g. +201012345678. */
export const egyptianPhoneSchema = z
  .string()
  .regex(/^\+20\d{10}$/, 'Enter a valid Egyptian number, e.g. +201012345678');

export const emailSchema = z.string().email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[0-9]/, 'Include at least one number');

export const genderSchema = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);

export const healthGoalSchema = z.enum(HEALTH_GOALS);

export const chronicConditionSchema = z.enum(CHRONIC_CONDITIONS);

/** ISO calendar date (no time component). */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format');

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name').max(120),
  email: emailSchema,
  password: passwordSchema,
  phone: egyptianPhoneSchema,
  accepted_terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms of service' }),
  }),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z.object({
  email: emailSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Users / health profile / goals
// ─────────────────────────────────────────────────────────────────────────────

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  phone: egyptianPhoneSchema.optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const healthProfileSchema = z.object({
  date_of_birth: isoDateSchema,
  gender: genderSchema,
  height_cm: z.number().min(50).max(260).optional(),
  weight_kg: z.number().min(20).max(400).optional(),
  chronic_conditions: z.array(chronicConditionSchema).optional().default([]),
  family_history: z.array(chronicConditionSchema).optional().default([]),
});
export type HealthProfileInput = z.infer<typeof healthProfileSchema>;

// Goals are admin-managed slugs; validate shape, not a fixed enum.
export const goalsSchema = z.object({
  health_goals: z
    .array(z.string().min(1).max(60))
    .min(1, 'Pick at least one goal')
    .max(3, 'Pick up to 3 goals'),
});
export type GoalsInput = z.infer<typeof goalsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Payments / subscriptions
// ─────────────────────────────────────────────────────────────────────────────

export const initiatePaymentSchema = z.object({
  plan_id: z.string().uuid('Invalid plan'),
});
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Biomarker queries & results
// ─────────────────────────────────────────────────────────────────────────────

export const biomarkerQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
export type BiomarkerQuery = z.infer<typeof biomarkerQuerySchema>;

export const createResultSchema = z.object({
  biomarker_id: z.string().uuid('Invalid biomarker'),
  value: z.number().finite('Enter a numeric value'),
  tested_at: isoDateSchema,
  lab_name: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateResultInput = z.infer<typeof createResultSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a result schema bound to a biomarker's physiologically plausible
 * window so the client can reject obviously-wrong manual entries before
 * hitting the API.
 */
export function plausibleResultSchema(min: number, max: number) {
  return createResultSchema.extend({
    value: z
      .number()
      .finite()
      .min(min, `Value seems too low (min ${min})`)
      .max(max, `Value seems too high (max ${max})`),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────────────────────────────────────

export const adminUpdateUserSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  phone: z.string().max(20).optional(),
  role: z.enum(['user', 'admin']).optional(),
});
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

/** Admin entering a single result for a user (no plausibility hard-block). */
export const adminCreateResultSchema = z.object({
  biomarker_id: z.string().uuid(),
  value: z.number().finite(),
  tested_at: isoDateSchema,
  lab_name: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});
export type AdminCreateResultInput = z.infer<typeof adminCreateResultSchema>;

/** Confirm (and optionally edit) the rows parsed from a lab PDF. */
export const confirmLabUploadSchema = z.object({
  tested_at: isoDateSchema,
  lab_name: z.string().max(120).optional(),
  rows: z
    .array(
      z.object({
        biomarker_id: z.string().uuid(),
        value: z.number().finite(),
        include: z.boolean(),
      }),
    )
    .min(1, 'Select at least one result to import'),
});
export type ConfirmLabUploadInput = z.infer<typeof confirmLabUploadSchema>;

// Plans CRUD
export const planInputSchema = z.object({
  name: z.enum(['basic', 'premium']),
  price_egp: z.number().int().min(0),
  price_display: z.string().min(1).max(80),
  annual_tests_count: z.number().int().min(0),
  biomarker_count: z.number().int().min(0),
  features: z.array(z.string().max(200)).max(20),
  is_active: z.boolean().optional().default(true),
});
export type PlanInput = z.infer<typeof planInputSchema>;
export const planUpdateSchema = planInputSchema.partial();
export type PlanUpdateInput = z.infer<typeof planUpdateSchema>;

// Category CRUD
export const categoryInputSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'lowercase, digits, and dashes only'),
  description: z.string().max(600).optional().default(''),
  icon: z.string().max(40).optional().default(''),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex color like #4CAF84'),
  display_order: z.number().int().min(0).optional().default(0),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export const categoryUpdateSchema = categoryInputSchema.partial();
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

// Biomarker CRUD
const rangeNumber = z.number().finite();
export const biomarkerInputSchema = z
  .object({
    category_id: z.string().uuid(),
    name: z.string().min(1).max(120),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    unit: z.string().min(1).max(40),
    description: z.string().max(2000).optional().default(''),
    why_it_matters: z.string().max(2000).optional().default(''),
    what_affects_it: z.string().max(2000).optional().default(''),
    optimal_low: rangeNumber,
    optimal_high: rangeNumber,
    normal_low: rangeNumber,
    normal_high: rangeNumber,
    min_plausible: rangeNumber,
    max_plausible: rangeNumber,
    is_active: z.boolean().optional().default(true),
    display_order: z.number().int().min(0).optional().default(0),
    tags: z.array(z.string().max(40)).max(12).optional().default([]),
    // Null/0 = not sold as an add-on; a positive value lists it on the add-ons page.
    addon_price_egp: z.number().int().min(0).max(1_000_000).nullable().optional(),
  })
  .refine(
    (b) =>
      b.min_plausible <= b.normal_low &&
      b.normal_low <= b.optimal_low &&
      b.optimal_low <= b.optimal_high &&
      b.optimal_high <= b.normal_high &&
      b.normal_high <= b.max_plausible,
    {
      message:
        'Ranges must satisfy: min_plausible ≤ normal_low ≤ optimal_low ≤ optimal_high ≤ normal_high ≤ max_plausible',
    },
  );
export type BiomarkerInput = z.infer<typeof biomarkerInputSchema>;

// Subscription management (admin)
export const grantSubscriptionSchema = z.object({
  plan_id: z.string().uuid(),
  months: z.number().int().min(1).max(60).optional().default(12),
  payment_reference: z.string().max(120).optional(),
});
export type GrantSubscriptionInput = z.infer<typeof grantSubscriptionSchema>;

export const updateSubscriptionSchema = z
  .object({
    status: z.enum(['active', 'expired', 'cancelled']).optional(),
    plan_id: z.string().uuid().optional(),
    expires_at: z.string().datetime().optional(),
  })
  .refine((b) => b.status || b.plan_id || b.expires_at, {
    message: 'Provide at least one field to update',
  });
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

// Health goals CRUD (admin)
export const healthGoalInputSchema = z.object({
  slug: z.string().regex(/^[a-z0-9_]+$/, 'lowercase, digits, underscores'),
  label: z.string().min(1).max(80),
  icon: z.string().max(40).optional().default(''),
  display_order: z.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
});
export type HealthGoalInput = z.infer<typeof healthGoalInputSchema>;
export const healthGoalUpdateSchema = healthGoalInputSchema.partial();
export type HealthGoalUpdateInput = z.infer<typeof healthGoalUpdateSchema>;

// App content / settings (admin)
export const labPartnerSchema = z.object({
  name: z.string().max(120).default(''),
  description: z.string().max(600).default(''),
  phone: z.string().max(40).default(''),
  url: z.string().max(300).default(''),
});

export const appContentSchema = z.object({
  welcome_tagline: z.string().max(200),
  support_email: z.string().email().or(z.literal('')),
  lab_partner: labPartnerSchema,
});
export type AppContentInput = z.infer<typeof appContentSchema>;

// AI Health Intelligence (admin)
export const aiConfigSchema = z.object({
  enabled: z.boolean(),
  model: z.string().min(1).max(80),
  max_tokens: z.number().int().min(256).max(8000),
  persona: z.string().max(4000),
  disclaimer: z.string().max(2000),
  features: z.object({
    insights: z.boolean(),
    protocols: z.boolean(),
    chat: z.boolean(),
  }),
  require_review: z.boolean(),
  allow_user_generate: z.boolean(),
});
export type AiConfigInput = z.infer<typeof aiConfigSchema>;

export const chatInputSchema = z.object({
  message: z.string().min(1).max(2000),
});
export type ChatInput = z.infer<typeof chatInputSchema>;

// Interventions / recommendations (admin)
const biomarkerStatusEnum = z.enum(['optimal', 'suboptimal', 'alert', 'untested']);
export const interventionInputSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers and hyphens only'),
  category: z.enum(['supplement', 'nutrition', 'lifestyle', 'retest']),
  summary: z.string().max(400).default(''),
  detail: z.string().max(4000).default(''),
  dosage: z.string().max(200).default(''),
  evidence_level: z.enum(['strong', 'moderate', 'limited']).default('moderate'),
  url: z.string().max(300).default(''),
  target_biomarker_slugs: z.array(z.string()).default([]),
  trigger_statuses: z.array(biomarkerStatusEnum).min(1).default(['suboptimal', 'alert']),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
});
export type InterventionInput = z.infer<typeof interventionInputSchema>;
export const interventionUpdateSchema = interventionInputSchema.partial();
export type InterventionUpdateInput = z.infer<typeof interventionUpdateSchema>;

// Notifications & engagement (admin + user)
export const notificationConfigSchema = z.object({
  out_of_range_alerts: z.boolean(),
  retest_reminders: z.boolean(),
  retest_cadence_months: z.number().int().min(1).max(24),
  score_drop_alerts: z.boolean(),
  score_drop_threshold: z.number().int().min(1).max(50),
});
export type NotificationConfigInput = z.infer<typeof notificationConfigSchema>;

export const broadcastSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(600),
  severity: z.enum(['info', 'warning', 'critical']).default('info'),
});
export type BroadcastInput = z.infer<typeof broadcastSchema>;

export const registerDeviceSchema = z.object({
  token: z.string().min(1).max(300),
  platform: z.enum(['ios', 'android', 'web']).default('ios'),
});
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

export const markReadSchema = z.object({
  ids: z.array(z.string()).optional(),
});
export type MarkReadInput = z.infer<typeof markReadSchema>;

// Client info (activity level + address + map location)
const activityLevelSchema = z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']);
export const clientInfoSchema = z.object({
  activity_level: activityLevelSchema.optional(),
  address: z.string().max(400).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type ClientInfoInput = z.infer<typeof clientInfoSchema>;

// Test booking — admin
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM');
export const serviceAreaInputSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers and hyphens only'),
  city: z.string().max(120).default(''),
  default_slot_minutes: z.number().int().min(15).max(480).default(60),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
});
export type ServiceAreaInput = z.infer<typeof serviceAreaInputSchema>;
export const serviceAreaUpdateSchema = serviceAreaInputSchema.partial();
export type ServiceAreaUpdateInput = z.infer<typeof serviceAreaUpdateSchema>;

export const availabilityWindowInputSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: timeSchema,
    end_time: timeSchema,
    capacity: z.number().int().min(1).max(500),
  })
  .refine((w) => w.end_time > w.start_time, { message: 'end_time must be after start_time' });
export type AvailabilityWindowInput = z.infer<typeof availabilityWindowInputSchema>;

const overrideWindowSchema = z
  .object({
    start_time: timeSchema,
    end_time: timeSchema,
    capacity: z.number().int().min(1).max(500),
  })
  .refine((w) => w.end_time > w.start_time, { message: 'end_time must be after start_time' });

export const availabilityOverrideInputSchema = z.object({
  date: isoDateSchema,
  is_closed: z.boolean().default(false),
  windows: z.array(overrideWindowSchema).nullable().default(null),
});
export type AvailabilityOverrideInput = z.infer<typeof availabilityOverrideInputSchema>;

// Test booking — customer
export const createBookingSchema = z.object({
  area_id: z.string().uuid(),
  date: isoDateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  notes: z.string().max(400).optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// Extra (add-on) markers purchased alongside a booking, paid at checkout.
export const initiateAddonPaymentSchema = z.object({
  booking_id: z.string().uuid(),
  biomarker_ids: z.array(z.string().uuid()).min(1).max(30),
});
export type InitiateAddonPaymentInput = z.infer<typeof initiateAddonPaymentSchema>;

// Lab partner management (admin-created accounts)
export const createPartnerSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(120),
  password: z.string().min(8).max(72),
  phone: z.string().max(20).optional(),
});
export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;

export const assignPartnerAreasSchema = z.object({
  area_ids: z.array(z.string().uuid()),
});
export type AssignPartnerAreasInput = z.infer<typeof assignPartnerAreasSchema>;

// Visit notification templates (admin-managed; pushed by the visiting doctor)
export const notificationTemplateInputSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(300),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
});
export type NotificationTemplateInput = z.infer<typeof notificationTemplateInputSchema>;
export const notificationTemplateUpdateSchema = notificationTemplateInputSchema.partial();
export type NotificationTemplateUpdateInput = z.infer<typeof notificationTemplateUpdateSchema>;

export const sendVisitNotificationSchema = z.object({ template_id: z.string().uuid() });
export type SendVisitNotificationInput = z.infer<typeof sendVisitNotificationSchema>;
