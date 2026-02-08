/*
  Warnings:

  - You are about to drop the column `userId` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `vehicle` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[licenseNumber,organizationId]` on the table `driver` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registrationNumber,organizationId]` on the table `vehicle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CUSTOM', 'VEHICLE_EXPIRY', 'DRIVER_EXPIRY', 'TOUR_LOADING', 'TOUR_UNLOADING');

-- CreateEnum
CREATE TYPE "TourType" AS ENUM ('UVOZ', 'IZVOZ', 'MEDJUTURA');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DIREKTOR', 'DISPONENT', 'KNJIGOVODJA', 'SERVISER');

-- DropForeignKey
ALTER TABLE "driver" DROP CONSTRAINT "driver_userId_fkey";

-- DropForeignKey
ALTER TABLE "vehicle" DROP CONSTRAINT "vehicle_userId_fkey";

-- DropIndex
DROP INDEX "driver_licenseNumber_key";

-- DropIndex
DROP INDEX "vehicle_registrationNumber_key";

-- AlterTable
ALTER TABLE "driver" DROP COLUMN "userId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'DISPONENT';

-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "userId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracted_tour" (
    "id" TEXT NOT NULL,
    "tourType" "TourType" NOT NULL,
    "loadingLocation" TEXT NOT NULL,
    "loadingDate" TIMESTAMP(3),
    "exportCustoms" TEXT,
    "importCustoms" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "company" TEXT NOT NULL,
    "isADR" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isInvoiced" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "trailerId" TEXT,

    CONSTRAINT "contracted_tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unloading_stop" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "unloadingDate" TIMESTAMP(3),
    "tourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unloading_stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "eventType" "EventType" NOT NULL,
    "color" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contracted_tour_organizationId_idx" ON "contracted_tour"("organizationId");

-- CreateIndex
CREATE INDEX "contracted_tour_organizationId_isCompleted_idx" ON "contracted_tour"("organizationId", "isCompleted");

-- CreateIndex
CREATE INDEX "contracted_tour_organizationId_isCompleted_createdAt_idx" ON "contracted_tour"("organizationId", "isCompleted", "createdAt");

-- CreateIndex
CREATE INDEX "contracted_tour_truckId_idx" ON "contracted_tour"("truckId");

-- CreateIndex
CREATE INDEX "contracted_tour_trailerId_idx" ON "contracted_tour"("trailerId");

-- CreateIndex
CREATE INDEX "unloading_stop_tourId_idx" ON "unloading_stop"("tourId");

-- CreateIndex
CREATE INDEX "driver_organizationId_idx" ON "driver"("organizationId");

-- CreateIndex
CREATE INDEX "driver_organizationId_createdAt_idx" ON "driver"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "driver_licenseNumber_organizationId_key" ON "driver"("licenseNumber", "organizationId");

-- CreateIndex
CREATE INDEX "driver_note_driverId_idx" ON "driver_note"("driverId");

-- CreateIndex
CREATE INDEX "vehicle_organizationId_idx" ON "vehicle"("organizationId");

-- CreateIndex
CREATE INDEX "vehicle_organizationId_createdAt_idx" ON "vehicle"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_registrationNumber_organizationId_key" ON "vehicle"("registrationNumber", "organizationId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracted_tour" ADD CONSTRAINT "contracted_tour_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracted_tour" ADD CONSTRAINT "contracted_tour_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracted_tour" ADD CONSTRAINT "contracted_tour_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracted_tour" ADD CONSTRAINT "contracted_tour_trailerId_fkey" FOREIGN KEY ("trailerId") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unloading_stop" ADD CONSTRAINT "unloading_stop_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "contracted_tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
