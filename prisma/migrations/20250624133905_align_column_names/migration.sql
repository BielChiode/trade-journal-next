/*
  Warnings:

  - You are about to drop the column `entry_date` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `entry_price` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `exit_date` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `exit_price` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `position_id` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Trade` table. All the data in the column will be lost.
  - Added the required column `entryDate` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entryPrice` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `positionId` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_user_id_fkey";

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "entry_date",
DROP COLUMN "entry_price",
DROP COLUMN "exit_date",
DROP COLUMN "exit_price",
DROP COLUMN "position_id",
DROP COLUMN "user_id",
ADD COLUMN     "entryDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "entryPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "exitDate" TIMESTAMP(3),
ADD COLUMN     "exitPrice" DOUBLE PRECISION,
ADD COLUMN     "positionId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
