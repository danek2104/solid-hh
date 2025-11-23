-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "desiredRate" TEXT,
ADD COLUMN     "documentsNote" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "inn" TEXT,
ADD COLUMN     "minRate" TEXT,
ADD COLUMN     "passport" TEXT,
ADD COLUMN     "readyToTravel" TEXT,
ADD COLUMN     "startWindow" TEXT,
ADD COLUMN     "telegram" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "wasInRussia" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsapp" TEXT,
ALTER COLUMN "experience" SET DATA TYPE TEXT;
