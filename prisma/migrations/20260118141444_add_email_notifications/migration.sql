-- AlterTable
ALTER TABLE "user" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notificationDaysBefore" INTEGER NOT NULL DEFAULT 30;
