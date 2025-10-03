-- Add last_price column to positions table (nullable)
ALTER TABLE "positions"
ADD COLUMN IF NOT EXISTS "last_price" DECIMAL;


