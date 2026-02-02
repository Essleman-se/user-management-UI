/**
 * API Configuration Utility
 * Handles API base URL for both development and production environments
 */

/**
 * Get the API base URL based on the environment
 * - In development: Uses relative paths (proxied by Vite to localhost:8080)
 * - In production: Uses the actual backend URL
 */
export const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // In development, use relative paths (Vite proxy handles it)
    return '';
  }

  // In production, use the backend URL from environment variable or default
  // You can set this via GitHub Pages environment variables or build-time config
  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  
  return backendUrl;
};

/**
 * Build a full API URL
 * @param endpoint - API endpoint (e.g., '/api/auth/login')
 * @returns Full URL to the API endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If baseUrl is empty (development), return the endpoint as-is (for proxy)
  if (!baseUrl) {
    return cleanEndpoint;
  }
  
  // In production, combine base URL with endpoint
  return `${baseUrl}${cleanEndpoint}`;
};

