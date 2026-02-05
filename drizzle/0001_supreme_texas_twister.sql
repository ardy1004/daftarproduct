ALTER TABLE "products" ALTER COLUMN "original_price" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "commission" numeric DEFAULT '0';