CREATE TABLE IF NOT EXISTS "lab_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"file_path" text NOT NULL,
	"original_name" text NOT NULL,
	"lab_name" text,
	"tested_at" date,
	"status" text DEFAULT 'parsed' NOT NULL,
	"parsed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_biomarker_results" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_biomarker_results" ADD COLUMN "lab_upload_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lab_uploads" ADD CONSTRAINT "lab_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
