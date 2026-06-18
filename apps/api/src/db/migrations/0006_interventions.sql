CREATE TABLE IF NOT EXISTS "interventions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"dosage" text DEFAULT '' NOT NULL,
	"evidence_level" text DEFAULT 'moderate' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"target_biomarker_slugs" text[] DEFAULT '{}' NOT NULL,
	"trigger_statuses" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "interventions_slug_unique" UNIQUE("slug")
);
