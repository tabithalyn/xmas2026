ALTER TABLE "products" RENAME COLUMN "link" TO "product_url";--> statement-breakpoint
ALTER TABLE "products" RENAME COLUMN "preferences" TO "preference";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image_url" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;