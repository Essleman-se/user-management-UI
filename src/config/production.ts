/**
 * Production Configuration
 * This file is used when building for production (npm run build)
 * 
 * IMPORTANT: Update VITE_API_BASE_URL in your build process or .env.production file
 * before deploying to production.
 */

export const productionConfig = {
  // API Configuration
  api: {
    // Production backend URL
    // Priority: 1. VITE_API_BASE_URL env variable, 2. Default from config
    // Set VITE_API_BASE_URL before building: VITE_API_BASE_URL=https://api.example.com npm run build
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  },
  
  // OAuth2 Configuration
  oauth2: {
    // Frontend callback URL for production (GitHub Pages)
    callbackUrl: 'https://essleman-se.github.io/user-management-UI/oauth2/callback',
  },
  
  // Environment
  environment: 'production' as const,
};

