/*
  Warnings:

  - Added the required column `returnAmount` to the `Return` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Return" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "processedBy" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "returnAmount" DECIMAL(12,2) NOT NULL;
