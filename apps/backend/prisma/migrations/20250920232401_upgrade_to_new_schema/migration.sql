/*
  Warnings:

  - A unique constraint covering the columns `[loyaltyNumber]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[receiptNumber]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiptNumber` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "loyaltyNumber" TEXT,
ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyTier" "public"."LoyaltyTier" NOT NULL DEFAULT 'BRONZE',
ADD COLUMN     "preferredStore" TEXT;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "minStock" INTEGER DEFAULT 0,
ADD COLUMN     "packSize" INTEGER,
ADD COLUMN     "reorderPoint" INTEGER DEFAULT 10,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "volume" DECIMAL(8,3),
ADD COLUMN     "weight" DECIMAL(8,3);

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "loyaltyPointsEarned" INTEGER DEFAULT 0,
ADD COLUMN     "loyaltyPointsUsed" INTEGER DEFAULT 0,
ADD COLUMN     "receiptNumber" TEXT NOT NULL,
ADD COLUMN     "refundedAmount" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "status" "public"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "public"."LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Return" (
    "id" TEXT NOT NULL,
    "originalTransactionId" TEXT NOT NULL,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_loyaltyNumber_key" ON "public"."Customer"("loyaltyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_receiptNumber_key" ON "public"."Transaction"("receiptNumber");

-- AddForeignKey
ALTER TABLE "public"."LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Return" ADD CONSTRAINT "Return_originalTransactionId_fkey" FOREIGN KEY ("originalTransactionId") REFERENCES "public"."Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
