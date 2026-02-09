/**
 * Local Development Configuration
 * This file is used when running the app locally (npm run dev)
 */

export const localConfig = {
  // API Configuration
  api: {
    // Leave empty to use Vite proxy (recommended)
    // The proxy forwards /api requests to http://localhost:8080
    baseUrl: '',
    // Or specify the backend URL directly
    // baseUrl: 'http://localhost:8080',
  },
  
  // OAuth2 Configuration
  oauth2: {
    // Frontend callback URL for local development
    callbackUrl: 'http://localhost:5173/oauth2/callback',
  },
  
  // Environment
  environment: 'local' as const,
};

