-- CreateEnum
CREATE TYPE "public"."PromotionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y');

-- AlterTable
ALTER TABLE "public"."Promotion" ADD COLUMN     "buyQty" INTEGER,
ADD COLUMN     "discountAmt" DECIMAL(10,2),
ADD COLUMN     "getQty" INTEGER,
ADD COLUMN     "type" "public"."PromotionType" NOT NULL DEFAULT 'PERCENTAGE',
ALTER COLUMN "discountPct" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."_PromotionProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PromotionProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_PromotionCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PromotionCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PromotionProducts_B_index" ON "public"."_PromotionProducts"("B");

-- CreateIndex
CREATE INDEX "_PromotionCategories_B_index" ON "public"."_PromotionCategories"("B");

-- AddForeignKey
ALTER TABLE "public"."_PromotionProducts" ADD CONSTRAINT "_PromotionProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PromotionProducts" ADD CONSTRAINT "_PromotionProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PromotionCategories" ADD CONSTRAINT "_PromotionCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PromotionCategories" ADD CONSTRAINT "_PromotionCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
