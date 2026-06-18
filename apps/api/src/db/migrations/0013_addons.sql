CREATE TABLE IF NOT EXISTS "addon_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"biomarker_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_egp" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addon_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"subtotal_egp" integer NOT NULL,
	"vat_egp" integer NOT NULL,
	"total_egp" integer NOT NULL,
	"payment_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biomarkers" ADD COLUMN "addon_price_egp" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addon_order_items" ADD CONSTRAINT "addon_order_items_order_id_addon_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."addon_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addon_order_items" ADD CONSTRAINT "addon_order_items_biomarker_id_biomarkers_id_fk" FOREIGN KEY ("biomarker_id") REFERENCES "public"."biomarkers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addon_orders" ADD CONSTRAINT "addon_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addon_orders" ADD CONSTRAINT "addon_orders_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
