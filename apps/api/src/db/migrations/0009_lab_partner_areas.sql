CREATE TABLE IF NOT EXISTS "lab_partner_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lab_partner_areas" ADD CONSTRAINT "lab_partner_areas_partner_id_users_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lab_partner_areas" ADD CONSTRAINT "lab_partner_areas_area_id_service_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."service_areas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lab_partner_areas_partner_area_idx" ON "lab_partner_areas" USING btree ("partner_id","area_id");