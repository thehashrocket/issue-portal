import { NextResponse } from "next/server";

/**
 * Standard API response types
 */
export type ApiErrorResponse = {
  error: string;
  details?: unknown;
  code?: string;
};

export type ApiSuccessResponse<T> = {
  data: T;
  message?: string;
};

/**
 * Creates a standardized error response
 * @param message Error message
 * @param status HTTP status code
 * @param details Optional additional error details
 * @param code Optional error code for client-side error handling
 * @returns NextResponse with standardized error format
 */
export function createErrorResponse(
  message: string,
  status: number,
  details?: unknown,
  code?: string
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error: message,
  };

  if (details) {
    response.details = details;
  }

  if (code) {
    response.code = code;
  }

  return NextResponse.json(response, { status });
}

/**
 * Creates a standardized success response
 * @param data Response data
 * @param status HTTP status code (defaults to 200)
 * @param message Optional success message
 * @returns NextResponse with the data wrapped in a standard format
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    data,
  };

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
  /**
   * 401 Unauthorized - Authentication required
   */
  unauthorized: (message: string = "Unauthorized: Authentication required", code?: string) => 
    createErrorResponse(message, 401, undefined, code),
  
  /**
   * 403 Forbidden - Insufficient permissions
   */
  forbidden: (message: string = "Forbidden: Insufficient permissions", code?: string) => 
    createErrorResponse(message, 403, undefined, code),
  
  /**
   * 404 Not Found - Resource not found
   */
  notFound: (resource: string = "Resource", code?: string) => 
    createErrorResponse(`${resource} not found`, 404, undefined, code),
  
  /**
   * 400 Bad Request - Validation failed
   */
  validationFailed: (details: unknown, message: string = "Validation failed", code?: string) => 
    createErrorResponse(message, 400, details, code),
  
  /**
   * 500 Internal Server Error - Unexpected error
   */
  serverError: (message: string = "An unexpected error occurred", code?: string) => 
    createErrorResponse(message, 500, undefined, code),
  
  /**
   * 409 Conflict - Resource conflict
   */
  conflict: (message: string = "Resource conflict", code?: string) => 
    createErrorResponse(message, 409, undefined, code),
  
  /**
   * 429 Too Many Requests - Rate limit exceeded
   */
  tooManyRequests: (message: string = "Rate limit exceeded", code?: string) => 
    createErrorResponse(message, 429, undefined, code),
  
  /**
   * 422 Unprocessable Entity - Request could not be processed
   */
  unprocessableEntity: (message: string = "Request could not be processed", details?: unknown, code?: string) => 
    createErrorResponse(message, 422, details, code),
  
  /**
   * 405 Method Not Allowed - HTTP method not allowed
   */
  methodNotAllowed: (message: string = "Method not allowed", code?: string) => 
    createErrorResponse(message, 405, undefined, code),
  
  /**
   * Custom error - Create a custom error response
   */
  custom: (message: string, status: number, details?: unknown, code?: string) => 
    createErrorResponse(message, status, details, code),
}; 