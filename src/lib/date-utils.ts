/**
 * Date utility functions for the application
 */

/**
 * Calculate a date that is a specified number of business days in the future
 * Business days are Monday through Friday, excluding weekends
 * 
 * @param days Number of business days to add
 * @param startDate Starting date (defaults to current date)
 * @returns Date object representing the future date
 */
export function addBusinessDays(days: number, startDate: Date = new Date()): Date {
  // Clone the date to avoid modifying the original
  const date = new Date(startDate);
  
  // Counter for business days
  let businessDays = 0;
  
  // Loop until we've added the requested number of business days
  while (businessDays < days) {
    // Move to the next day
    date.setDate(date.getDate() + 1);
    
    // Check if it's a weekday (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // If it's a weekday, increment our counter
      businessDays++;
    }
  }
  
  return date;
}

/**
 * Validates that a date is not in the past
 * 
 * @param date The date to validate
 * @returns true if the date is today or in the future, false otherwise
 */
export function isNotPastDate(date: Date): boolean {
  // Create a new date object set to the start of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Compare the provided date with today
  return date >= today;
}

/**
 * Get the default due date for new issues (10 business days from now)
 * 
 * @returns Date object representing the default due date
 */
export function getDefaultDueDate(): Date {
  return addBusinessDays(10);
} 