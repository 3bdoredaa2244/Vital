ALTER TABLE "user_biomarker_results" ADD COLUMN "reference_range" text;--> statement-breakpoint
ALTER TABLE "user_biomarker_results" ADD COLUMN "ref_low" numeric(12, 4);--> statement-breakpoint
ALTER TABLE "user_biomarker_results" ADD COLUMN "ref_high" numeric(12, 4);