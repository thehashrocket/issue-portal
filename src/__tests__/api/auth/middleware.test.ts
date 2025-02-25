import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

// Mock the next/server module
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        body
      };
    }),
    next: jest.fn().mockImplementation(() => {
      return { status: 200 };
    }),
  },
}));

// Mock the global Response object if it's not available in the test environment
if (typeof Response === 'undefined') {
  global.Response = class Response {
    status: number;
    constructor(body: any, init?: any) {
      this.status = init?.status || 200;
    }
  } as any;
}

// Mock the auth module
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock the ApiErrors - used indirectly by middleware
jest.mock("@/lib/api-utils", () => ({
  ApiErrors: {
    unauthorized: jest.fn().mockReturnValue({ status: 401 }),
    forbidden: jest.fn().mockReturnValue({ status: 403 }),
  },
}));

describe("Middleware RBAC Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create a mock request
  const createMockRequest = (path: string) => {
    const req = {
      nextUrl: {
        pathname: path,
      },
    } as unknown as NextRequest;
    return req;
  };

  // Test cases for different user roles and routes
  const testCases = [
    // Admin access tests
    {
      role: "ADMIN" as Role,
      path: "/api/users/list",
      expectedStatus: 200,
      description: "Admin should access admin routes",
    },
    {
      role: "ADMIN" as Role,
      path: "/api/clients/list",
      expectedStatus: 200,
      description: "Admin should access client routes",
    },
    {
      role: "ADMIN" as Role,
      path: "/api/issues/list",
      expectedStatus: 200,
      description: "Admin should access issue routes",
    },
    
    // Developer access tests
    {
      role: "DEVELOPER" as Role,
      path: "/api/users/list",
      expectedStatus: 403,
      description: "Developer should not access admin routes",
    },
    {
      role: "DEVELOPER" as Role,
      path: "/api/clients/list",
      expectedStatus: 200,
      description: "Developer should access client routes",
    },
    {
      role: "DEVELOPER" as Role,
      path: "/api/issues/list",
      expectedStatus: 200,
      description: "Developer should access issue routes",
    },
    
    // Account Manager access tests
    {
      role: "ACCOUNT_MANAGER" as Role,
      path: "/api/users/list",
      expectedStatus: 403,
      description: "Account Manager should not access admin routes",
    },
    {
      role: "ACCOUNT_MANAGER" as Role,
      path: "/api/clients/list",
      expectedStatus: 200,
      description: "Account Manager should access client routes",
    },
    {
      role: "ACCOUNT_MANAGER" as Role,
      path: "/api/issues/list",
      expectedStatus: 200,
      description: "Account Manager should access issue routes",
    },
    
    // Regular user access tests
    {
      role: "USER" as Role,
      path: "/api/users/list",
      expectedStatus: 403,
      description: "Regular user should not access admin routes",
    },
    {
      role: "USER" as Role,
      path: "/api/clients/list",
      expectedStatus: 403,
      description: "Regular user should not access client routes",
    },
    {
      role: "USER" as Role,
      path: "/api/issues/list",
      expectedStatus: 200,
      description: "Regular user should access issue routes",
    },
    
    // Unauthenticated access tests
    {
      role: null,
      path: "/api/users/list",
      expectedStatus: 401,
      description: "Unauthenticated user should not access admin routes",
    },
    {
      role: null,
      path: "/api/clients/list",
      expectedStatus: 401,
      description: "Unauthenticated user should not access client routes",
    },
    {
      role: null,
      path: "/api/issues/list",
      expectedStatus: 401,
      description: "Unauthenticated user should not access issue routes",
    },
  ];

  // Run all test cases
  test.each(testCases)(
    "$description",
    async ({ role, path, expectedStatus }) => {
      // Mock the auth response based on the role
      if (role) {
        (auth as jest.Mock).mockResolvedValue({
          user: {
            id: "user-id",
            role,
            name: "Test User",
            email: "test@example.com",
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      } else {
        (auth as jest.Mock).mockResolvedValue(null);
      }

      // Create the request and call the middleware
      const req = createMockRequest(path);
      const response = await middleware(req);

      // Check the response status
      expect(response.status).toBe(expectedStatus);
    }
  );
}); 