-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "rootCauseDescription" TEXT,
ADD COLUMN     "rootCauseIdentified" BOOLEAN DEFAULT false,
ALTER COLUMN "howDisovered" SET DEFAULT 'OTHER',
ALTER COLUMN "workAroundAvailable" SET DEFAULT false;
