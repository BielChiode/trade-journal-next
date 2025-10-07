/*
  Warnings:

  - You are about to alter the column `last_price` on the `positions` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "positions" ADD COLUMN     "last_price_updated_at" TIMESTAMP(3),
ALTER COLUMN "last_price" SET DATA TYPE DECIMAL(65,30);
