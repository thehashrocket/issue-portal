-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('PRODUCTION', 'STAGING', 'DEVELOPMENT', 'TEST', 'LOCAL');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "environment" "Environment" DEFAULT 'LOCAL';
