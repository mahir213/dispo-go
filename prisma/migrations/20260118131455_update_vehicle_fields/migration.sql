/*
  Warnings:

  - The values [KOMBI,TEREN,PUTNICKO] on the enum `VehicleType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `manufacturer` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `vehicle` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VehicleType_new" AS ENUM ('KAMION', 'PRIKOLICA');
ALTER TABLE "vehicle" ALTER COLUMN "vehicleType" TYPE "VehicleType_new" USING ("vehicleType"::text::"VehicleType_new");
ALTER TYPE "VehicleType" RENAME TO "VehicleType_old";
ALTER TYPE "VehicleType_new" RENAME TO "VehicleType";
DROP TYPE "public"."VehicleType_old";
COMMIT;

-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "manufacturer",
DROP COLUMN "model",
DROP COLUMN "year",
ADD COLUMN     "ppAparatExpiryDate" TIMESTAMP(3),
ADD COLUMN     "registrationExpiryDate" TIMESTAMP(3),
ADD COLUMN     "sixMonthInspectionDate" TIMESTAMP(3);
