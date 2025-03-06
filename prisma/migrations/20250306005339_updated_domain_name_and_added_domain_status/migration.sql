/*
  Warnings:

  - You are about to drop the column `domainName` on the `DomainName` table. All the data in the column will be lost.
  - The `domainStatus` column on the `DomainName` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "DomainName" DROP COLUMN "domainName",
DROP COLUMN "domainStatus",
ADD COLUMN     "domainStatus" "DomainStatus";
