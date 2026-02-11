-- AlterTable
ALTER TABLE "contracted_tour" ADD COLUMN     "parentTourId" TEXT;

-- CreateIndex
CREATE INDEX "contracted_tour_parentTourId_idx" ON "contracted_tour"("parentTourId");

-- AddForeignKey
ALTER TABLE "contracted_tour" ADD CONSTRAINT "contracted_tour_parentTourId_fkey" FOREIGN KEY ("parentTourId") REFERENCES "contracted_tour"("id") ON DELETE SET NULL ON UPDATE CASCADE;
