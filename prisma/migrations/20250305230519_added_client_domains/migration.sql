-- CreateTable
CREATE TABLE "DomainName" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostingProvider" TEXT,
    "domainExpiration" TIMESTAMP(3),
    "domainName" TEXT,
    "domainStatus" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainName_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DomainName" ADD CONSTRAINT "DomainName_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
