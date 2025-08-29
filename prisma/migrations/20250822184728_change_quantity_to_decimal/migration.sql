-- AlterTable
ALTER TABLE "operations" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "positions" ALTER COLUMN "current_quantity" SET DATA TYPE DECIMAL(65,30);
