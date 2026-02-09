/**
 * API Configuration Utility
 * Handles API base URL for both development and production environments
 */

import config from '../config';

/**
 * Get the API base URL based on the environment
 * - In development: Uses relative paths (proxied by Vite to localhost:8080)
 * - In production: Uses the actual backend URL from config
 */
export const getApiBaseUrl = (): string => {
  // Use configuration from config module
  return config.api.baseUrl;
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

