import { NextRequest, NextResponse } from 'next/server';
import { ApiErrors } from './api-utils';

// In-memory store for rate limiting
// Note: In a production environment with multiple instances,
// you would want to use a distributed store like Redis
const loginAttemptStore = new Map();
const issueSubmissionStore = new Map();
const apiRequestStore = new Map();

// Helper function to get IP address from request
export function getIP(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  return xff ? xff.split(',')[0] : '127.0.0.1';
}

// Helper function to get user ID from session
export function getUserIdentifier(request: NextRequest): string {
  // Try to get user ID from session
  // If not available, fall back to IP address
  return getIP(request);
}

// Rate limit middleware for login attempts
export async function loginRateLimiter(request: NextRequest): Promise<NextResponse | null> {
  const ip = getIP(request);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  const requestRecords = loginAttemptStore.get(ip) || [];
  const windowStart = now - windowMs;
  
  // Filter out old requests
  const recentRequests = requestRecords.filter((timestamp: number) => timestamp > windowStart);
  
  if (recentRequests.length >= 5) {
    return ApiErrors.tooManyRequests('Too many login attempts. Please try again later.');
  }
  
  // Add current request timestamp
  recentRequests.push(now);
  loginAttemptStore.set(ip, recentRequests);
  
  return null; // No rate limit hit, continue
}

// Rate limit middleware for issue submissions
export async function issueSubmissionRateLimiter(request: NextRequest): Promise<NextResponse | null> {
  const identifier = getUserIdentifier(request);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  const requestRecords = issueSubmissionStore.get(identifier) || [];
  const windowStart = now - windowMs;
  
  // Filter out old requests
  const recentRequests = requestRecords.filter((timestamp: number) => timestamp > windowStart);
  
  if (recentRequests.length >= 3) {
    return ApiErrors.tooManyRequests('Too many issue submissions. Please try again later.');
  }
  
  // Add current request timestamp
  recentRequests.push(now);
  issueSubmissionStore.set(identifier, recentRequests);
  
  return null; // No rate limit hit, continue
}

// Rate limit middleware for all API requests
export async function apiRequestRateLimiter(request: NextRequest): Promise<NextResponse | null> {
  const identifier = getUserIdentifier(request);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  const requestRecords = apiRequestStore.get(identifier) || [];
  const windowStart = now - windowMs;
  
  // Filter out old requests
  const recentRequests = requestRecords.filter((timestamp: number) => timestamp > windowStart);
  
  if (recentRequests.length >= 100) {
    return ApiErrors.tooManyRequests('API rate limit exceeded. Please try again later.');
  }
  
  // Add current request timestamp
  recentRequests.push(now);
  apiRequestStore.set(identifier, recentRequests);
  
  return null; // No rate limit hit, continue
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const windowStart = now - windowMs;
  
  // Clean up login attempts
  for (const [ip, timestamps] of loginAttemptStore.entries()) {
    const recentRequests = timestamps.filter((timestamp: number) => timestamp > windowStart);
    if (recentRequests.length === 0) {
      loginAttemptStore.delete(ip);
    } else {
      loginAttemptStore.set(ip, recentRequests);
    }
  }
  
  // Clean up issue submissions
  for (const [identifier, timestamps] of issueSubmissionStore.entries()) {
    const recentRequests = timestamps.filter((timestamp: number) => timestamp > windowStart);
    if (recentRequests.length === 0) {
      issueSubmissionStore.delete(identifier);
    } else {
      issueSubmissionStore.set(identifier, recentRequests);
    }
  }
  
  // Clean up API requests
  for (const [identifier, timestamps] of apiRequestStore.entries()) {
    const recentRequests = timestamps.filter((timestamp: number) => timestamp > windowStart);
    if (recentRequests.length === 0) {
      apiRequestStore.delete(identifier);
    } else {
      apiRequestStore.set(identifier, recentRequests);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes 