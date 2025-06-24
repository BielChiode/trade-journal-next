-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" SERIAL NOT NULL,
    "position_id" INTEGER NOT NULL,
    "ticker" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "entry_price" DOUBLE PRECISION NOT NULL,
    "exit_date" TIMESTAMP(3),
    "exit_price" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL,
    "setup" TEXT,
    "observations" TEXT,
    "result" DOUBLE PRECISION,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
