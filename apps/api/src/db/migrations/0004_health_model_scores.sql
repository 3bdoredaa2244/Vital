ALTER TABLE "score_snapshots" ADD COLUMN "cardiometabolic_score" integer;--> statement-breakpoint
ALTER TABLE "score_snapshots" ADD COLUMN "longevity_score" integer;--> statement-breakpoint
ALTER TABLE "score_snapshots" ADD COLUMN "confidence" integer DEFAULT 0 NOT NULL;