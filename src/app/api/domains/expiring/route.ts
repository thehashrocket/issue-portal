import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { addDays } from "date-fns";

export async function GET() {
  // Authentication is handled by middleware
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    return ApiErrors.unauthorized();
  }
  
  try {
    const thirtyDaysFromNow = addDays(new Date(), 30);
    
    const expiringDomains = await prisma.domainName.findMany({
      where: {
        domainStatus: 'ACTIVE',
        domainExpiration: {
          not: null,
          lte: thirtyDaysFromNow,
          gt: new Date(),
        },
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        domainExpiration: 'asc',
      },
    });
    
    return createSuccessResponse(expiringDomains, 200, "Expiring domains retrieved successfully");
  } catch (error) {
    console.error("Error fetching expiring domains:", error);
    return ApiErrors.serverError("Failed to fetch expiring domains");
  }
} 