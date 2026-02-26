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
  
  // Frontend Configuration
  frontend: {
    // Frontend base URL for local development
    baseUrl: 'http://localhost:5173',
    // Frontend base path (matches Vite config base: "/user-management-UI")
    basePath: '/user-management-UI',
  },
  
  // OAuth2 Configuration
  oauth2: {
    // Frontend callback URL for local development (includes base path)
    callbackUrl: 'http://localhost:5173/user-management-UI/oauth2/callback',
  },
  
  // Email Verification Configuration
  emailVerification: {
    // Frontend verification URL for local development (includes base path)
    // Backend uses this when generating email verification links
    verificationUrl: 'http://localhost:5173/user-management-UI/verify-email',
  },
  
  // Environment
  environment: 'local' as const,
};

