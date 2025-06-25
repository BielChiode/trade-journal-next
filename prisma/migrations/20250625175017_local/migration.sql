-- CreateEnum
CREATE TYPE "PositionType" AS ENUM ('Buy', 'Sell');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('Open', 'Closed');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('Entry', 'Increment', 'PartialExit');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "token_version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ticker" TEXT NOT NULL,
    "type" "PositionType" NOT NULL,
    "status" "PositionStatus" NOT NULL,
    "average_entry_price" DECIMAL(65,30) NOT NULL,
    "current_quantity" INTEGER NOT NULL,
    "total_realized_pnl" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "initial_entry_date" TIMESTAMP(3) NOT NULL,
    "last_exit_date" TIMESTAMP(3),
    "setup" TEXT,
    "observations" TEXT,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations" (
    "id" SERIAL NOT NULL,
    "positionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "operation_type" "OperationType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "result" DECIMAL(65,30),
    "observations" TEXT,

    CONSTRAINT "operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
