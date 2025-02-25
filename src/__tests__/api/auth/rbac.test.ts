import { checkRole, isAdmin, isAccountManager, isDeveloper } from "@/lib/auth-utils";
import { Session } from "next-auth";
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

describe("Role-Based Access Control", () => {
  // Mock session data
  const adminSession: Session = {
    user: {
      id: "admin-id",
      role: "ADMIN" as Role,
      name: "Admin User",
      email: "admin@example.com",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const developerSession: Session = {
    user: {
      id: "developer-id",
      role: "DEVELOPER" as Role,
      name: "Developer User",
      email: "developer@example.com",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const accountManagerSession: Session = {
    user: {
      id: "account-manager-id",
      role: "ACCOUNT_MANAGER" as Role,
      name: "Account Manager User",
      email: "account-manager@example.com",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const regularUserSession: Session = {
    user: {
      id: "user-id",
      role: "USER" as Role,
      name: "Regular User",
      email: "user@example.com",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const noRoleSession: Session = {
    user: {
      id: "no-role-id",
      name: "No Role User",
      email: "no-role@example.com",
    } as any,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const nullSession = null;

  describe("Role check functions", () => {
    test("isAdmin should correctly identify admin users", () => {
      expect(isAdmin(adminSession)).toBe(true);
      expect(isAdmin(developerSession)).toBe(false);
      expect(isAdmin(accountManagerSession)).toBe(false);
      expect(isAdmin(regularUserSession)).toBe(false);
      expect(isAdmin(noRoleSession)).toBe(false);
      expect(isAdmin(nullSession)).toBe(false);
    });

    test("isDeveloper should correctly identify developer users", () => {
      expect(isDeveloper(adminSession)).toBe(false);
      expect(isDeveloper(developerSession)).toBe(true);
      expect(isDeveloper(accountManagerSession)).toBe(false);
      expect(isDeveloper(regularUserSession)).toBe(false);
      expect(isDeveloper(noRoleSession)).toBe(false);
      expect(isDeveloper(nullSession)).toBe(false);
    });

    test("isAccountManager should correctly identify account manager users", () => {
      expect(isAccountManager(adminSession)).toBe(false);
      expect(isAccountManager(developerSession)).toBe(false);
      expect(isAccountManager(accountManagerSession)).toBe(true);
      expect(isAccountManager(regularUserSession)).toBe(false);
      expect(isAccountManager(noRoleSession)).toBe(false);
      expect(isAccountManager(nullSession)).toBe(false);
    });
  });

  describe("checkRole function", () => {
    test("checkRole should correctly validate single roles", () => {
      expect(checkRole(adminSession.user, ["ADMIN"])).toBe(true);
      expect(checkRole(developerSession.user, ["DEVELOPER"])).toBe(true);
      expect(checkRole(accountManagerSession.user, ["ACCOUNT_MANAGER"])).toBe(true);
      expect(checkRole(regularUserSession.user, ["USER"])).toBe(true);
      
      expect(checkRole(adminSession.user, ["DEVELOPER"])).toBe(false);
      expect(checkRole(developerSession.user, ["ADMIN"])).toBe(false);
      expect(checkRole(noRoleSession.user, ["ADMIN"])).toBe(false);
      expect(checkRole(null, ["ADMIN"])).toBe(false);
    });

    test("checkRole should correctly validate multiple roles", () => {
      expect(checkRole(adminSession.user, ["ADMIN", "DEVELOPER"])).toBe(true);
      expect(checkRole(developerSession.user, ["ADMIN", "DEVELOPER"])).toBe(true);
      expect(checkRole(accountManagerSession.user, ["ADMIN", "ACCOUNT_MANAGER"])).toBe(true);
      expect(checkRole(regularUserSession.user, ["ADMIN", "DEVELOPER", "ACCOUNT_MANAGER"])).toBe(false);
      expect(checkRole(regularUserSession.user, ["ADMIN", "DEVELOPER", "ACCOUNT_MANAGER", "USER"])).toBe(true);
    });
  });
}); 