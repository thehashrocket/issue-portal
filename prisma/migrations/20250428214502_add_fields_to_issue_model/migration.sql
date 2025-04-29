-- CreateEnum
CREATE TYPE "HowDisovered" AS ENUM ('AUTOMATED_TESTING', 'CLIENT_REFERRED', 'MANUAL_TESTING', 'MONITORING_TOOL', 'OTHER', 'QA_TEAM', 'REFERRAL', 'SELF_DISCOVERED', 'SOCIAL_MEDIA', 'WEB_SEARCH');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "actualResult" TEXT,
ADD COLUMN     "expectedResult" TEXT,
ADD COLUMN     "howDisovered" "HowDisovered",
ADD COLUMN     "impact" TEXT,
ADD COLUMN     "relatedLogs" TEXT,
ADD COLUMN     "stepsToReproduce" TEXT,
ADD COLUMN     "workAroundAvailable" BOOLEAN,
ADD COLUMN     "workAroundDescription" TEXT;
