CREATE TABLE "product_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" text NOT NULL,
	"event_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" text,
	"product_name" text NOT NULL,
	"price" numeric NOT NULL,
	"original_price" numeric DEFAULT null,
	"sales" integer DEFAULT 0,
	"category" text NOT NULL,
	"subcategory" text,
	"affiliate_url" text,
	"image_url" text,
	"rating" numeric DEFAULT '0',
	"is_featured" boolean DEFAULT false,
	"featured_order" integer,
	"stock_available" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_category_filter" boolean DEFAULT true,
	"facebook_pixel_id" text,
	"google_analytics_id" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
