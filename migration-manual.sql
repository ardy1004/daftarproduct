-- Manual Migration Script for Supabase
-- Run this in Supabase SQL Editor

-- Migration 0003: Add item and video_url columns
ALTER TABLE "products" ADD COLUMN "item" text;
ALTER TABLE "products" ADD COLUMN "video_url" text;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('item', 'video_url')
ORDER BY column_name;