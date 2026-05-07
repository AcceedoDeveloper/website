import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {

  /**
   * Formats a date for backend storage without timezone conversion issues
   * @param date - Date object, date string, or any date-like value
   * @returns Formatted date string in YYYY-MM-DD format
   */
  formatDateForBackend(date: any): string {
    if (!date) return '';
    
    console.log('DateUtilsService - formatDateForBackend input:', date, 'type:', typeof date);
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // If it's already a string in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.log('DateUtilsService - Already in correct format:', date);
        return date;
      }
      
      // Handle different string formats
      if (date.includes('T') || date.includes('Z')) {
        // ISO string format
        dateObj = new Date(date);
      } else {
        // Try to parse as local date
        const parts = date.split(/[-/]/);
        if (parts.length === 3) {
          // Assume YYYY-MM-DD or MM/DD/YYYY format
          if (parts[0].length === 4) {
            // YYYY-MM-DD format
            dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            // MM/DD/YYYY format
            dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        } else {
          dateObj = new Date(date);
        }
      }
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      // Try to convert to Date
      dateObj = new Date(date);
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.log('DateUtilsService - Invalid date:', date);
      return '';
    }
    
    // Use local date components to avoid timezone issues
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    const result = `${year}-${month}-${day}`;
    console.log('DateUtilsService - formatDateForBackend result:', result);
    return result;
  }

  /**
   * Formats a date for display in forms (for HTML date inputs)
   * @param date - Date object or date string
   * @returns Formatted date string in YYYY-MM-DD format for HTML date inputs
   */
  formatDateForForm(date: any): string {
    if (!date) return '';
    
    console.log('DateUtilsService - formatDateForForm input:', date, 'type:', typeof date);
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
      console.log('DateUtilsService - Invalid date for form:', date);
      return '';
    }
    
    // Use local date components
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    const result = `${year}-${month}-${day}`;
    console.log('DateUtilsService - formatDateForForm result:', result);
    return result;
  }

  /**
   * Converts a date string to a Date object for Angular Material date pickers
   * @param dateString - Date string in YYYY-MM-DD format
   * @returns Date object
   */
  stringToDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    console.log('DateUtilsService - stringToDate input:', dateString);
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const parts = dateString.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const day = parseInt(parts[2]);
      
      const date = new Date(year, month, day);
      console.log('DateUtilsService - stringToDate result:', date);
      return date;
    }
    
    const date = new Date(dateString);
    console.log('DateUtilsService - stringToDate result (fallback):', date);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Gets current date in YYYY-MM-DD format
   * @returns Current date string
   */
  getCurrentDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
