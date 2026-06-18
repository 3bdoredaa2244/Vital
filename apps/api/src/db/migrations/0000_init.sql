CREATE TABLE IF NOT EXISTS "biomarker_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"color" text DEFAULT '#C9A84C' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "biomarker_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "biomarkers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"unit" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"why_it_matters" text DEFAULT '' NOT NULL,
	"what_affects_it" text DEFAULT '' NOT NULL,
	"optimal_low" numeric(12, 4) NOT NULL,
	"optimal_high" numeric(12, 4) NOT NULL,
	"normal_low" numeric(12, 4) NOT NULL,
	"normal_high" numeric(12, 4) NOT NULL,
	"min_plausible" numeric(12, 4) NOT NULL,
	"max_plausible" numeric(12, 4) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price_egp" integer NOT NULL,
	"price_display" text NOT NULL,
	"annual_tests_count" integer NOT NULL,
	"biomarker_count" integer NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"payment_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_biomarker_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"biomarker_id" uuid NOT NULL,
	"value" numeric(12, 4) NOT NULL,
	"tested_at" date NOT NULL,
	"lab_name" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"date_of_birth" date,
	"gender" text,
	"height_cm" integer,
	"weight_kg" integer,
	"chronic_conditions" text[] DEFAULT '{}' NOT NULL,
	"family_history" text[] DEFAULT '{}' NOT NULL,
	"health_goals" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "biomarkers" ADD CONSTRAINT "biomarkers_category_id_biomarker_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."biomarker_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_biomarker_results" ADD CONSTRAINT "user_biomarker_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_biomarker_results" ADD CONSTRAINT "user_biomarker_results_biomarker_id_biomarkers_id_fk" FOREIGN KEY ("biomarker_id") REFERENCES "public"."biomarkers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "biomarkers_slug_idx" ON "biomarkers" USING btree ("slug");