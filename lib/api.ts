// Utility to get the correct API URL based on environment
export function getApiUrl(): string {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // In browser: use same-origin (empty string) for both local and production
    // This avoids CORS issues completely
    return '';
  }
  
  // Server-side: use the environment variable or empty string
  return process.env.NEXT_PUBLIC_API_URL || '';
}

// For client-side usage - always use same-origin to avoid CORS
export const API_URL = '';
