/**
 * OAuth2 Utility Functions
 * Handles OAuth2 authentication flow
 */

import { getApiUrl, getApiBaseUrl } from './api';

export type OAuth2Provider = 'google' | 'facebook' | 'microsoft';

const VALID_OAUTH2_PROVIDERS = new Set<string>(['google', 'facebook', 'microsoft']);

/** Backend may still list these; we never show a button or start a flow for them. */
const EXCLUDED_OAUTH2_PROVIDER_IDS = new Set<string>(['github']);

function normalizeOAuth2Providers(list: unknown): OAuth2Provider[] {
  const arr = Array.isArray(list) ? list : [];
  const filtered = arr
    .filter((p) => typeof p === 'string' && !EXCLUDED_OAUTH2_PROVIDER_IDS.has(p.toLowerCase()))
    .filter(
      (p): p is OAuth2Provider =>
        typeof p === 'string' && VALID_OAUTH2_PROVIDERS.has(p)
    );
  return filtered.length > 0 ? filtered : ['google'];
}

export interface OAuth2Config {
  provider: OAuth2Provider;
  authorizationUrl: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
  responseType?: string;
}

/**
 * Get OAuth2 authorization URL for a provider from backend
 */
export const getOAuth2AuthorizationUrl = async (provider: OAuth2Provider): Promise<string> => {
  try {
    const basePath = import.meta.env.BASE_URL || '/user-management-UI';
    const callbackPath = basePath.endsWith('/') ? 'oauth2/callback' : '/oauth2/callback';
    const redirectUri = `${window.location.origin}${basePath}${callbackPath}`;
    const response = await fetch(`${getApiUrl(`/api/oauth2/authorization-url/${provider}`)}?redirect_uri=${encodeURIComponent(redirectUri)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to get authorization URL' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON but got: ${contentType}. Response: ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    let authUrl = data.authorizationUrl || data.url || data.authorization_url || '';
    
    // Ensure the URL is absolute
    if (authUrl && !authUrl.startsWith('http://') && !authUrl.startsWith('https://')) {
      // If it starts with /, it's a relative URL
      if (authUrl.startsWith('/')) {
        // If it's a backend path (starts with /oauth2/ or /api/), use backend origin
        // Otherwise, use current origin
        if (authUrl.startsWith('/oauth2/') || authUrl.startsWith('/api/')) {
          // Backend path - use backend origin from API config
          const backendOrigin = getApiBaseUrl() || 'http://localhost:8080';
          authUrl = `${backendOrigin}${authUrl}`;
        } else {
          // Frontend path - use current origin
          authUrl = `${window.location.origin}${authUrl}`;
        }
      } else {
        // If it doesn't start with /, prepend current origin
        authUrl = `${window.location.origin}/${authUrl}`;
      }
    }
    
    console.log('OAuth2 Authorization URL:', authUrl);
    return authUrl;
  } catch (error) {
    console.error('Error fetching authorization URL:', error);
    throw error;
  }
};

/**
 * Initiate OAuth2 login flow
 * Fetches authorization URL from backend and redirects user to OAuth2 provider's authorization page
 */
export const initiateOAuth2Login = async (provider: OAuth2Provider): Promise<void> => {
  try {
    // Store the provider and frontend origin in sessionStorage for callback handling
    sessionStorage.setItem('oauth2_provider', provider);
    sessionStorage.setItem('oauth2_redirect_after_login', window.location.pathname);
    sessionStorage.setItem('oauth2_frontend_origin', window.location.origin);
    
    // Get authorization URL from backend
    const authUrl = await getOAuth2AuthorizationUrl(provider);
    
    if (!authUrl) {
      throw new Error('Authorization URL not received from server');
    }
    
    // Use window.location.href to redirect - this bypasses React Router
    // If the URL is absolute (starts with http:// or https://), it will navigate away
    // If it's relative, it will navigate within the same origin
    window.location.href = authUrl;
  } catch (error) {
    console.error('Error initiating OAuth2 login:', error);
    sessionStorage.removeItem('oauth2_provider');
    sessionStorage.removeItem('oauth2_redirect_after_login');
    sessionStorage.removeItem('oauth2_frontend_origin');
    throw error;
  }
};

/**
 * Handle OAuth2 callback
 * Processes the authorization code from OAuth2 provider
 */
export const handleOAuth2Callback = async (
  code: string,
  state?: string
): Promise<{ token: string; user?: Record<string, unknown> }> => {
  const provider = sessionStorage.getItem('oauth2_provider') as OAuth2Provider;
  
  if (!provider) {
    throw new Error('OAuth2 provider not found in session');
  }

  try {
    const response = await fetch(getApiUrl('/api/oauth2/callback'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state,
        provider,
        redirect_uri: (() => {
          const frontendOrigin = sessionStorage.getItem('oauth2_frontend_origin') || window.location.origin;
          const basePath = import.meta.env.BASE_URL || '/user-management-UI';
          const callbackPath = basePath.endsWith('/') ? 'oauth2/callback' : '/oauth2/callback';
          return `${frontendOrigin}${basePath}${callbackPath}`;
        })(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: 'OAuth2 callback failed' 
      }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Clear session storage
    sessionStorage.removeItem('oauth2_provider');
    sessionStorage.removeItem('oauth2_redirect_after_login');
    sessionStorage.removeItem('oauth2_frontend_origin');
    
    return data;
  } catch (error) {
    sessionStorage.removeItem('oauth2_provider');
    sessionStorage.removeItem('oauth2_redirect_after_login');
    sessionStorage.removeItem('oauth2_frontend_origin');
    throw error;
  }
};

/**
 * Get available OAuth2 providers from backend
 * Note: If your backend doesn't have this endpoint, it will use defaults
 */
export const getAvailableOAuth2Providers = async (): Promise<OAuth2Provider[]> => {
  try {
    const response = await fetch(getApiUrl('/api/oauth2/providers'), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn('Failed to fetch OAuth2 providers, using defaults');
      return ['google'];
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Invalid response type from providers endpoint, using defaults');
      return ['google'];
    }

    const data = await response.json();
    const raw = data.providers ?? data;
    return normalizeOAuth2Providers(raw);
  } catch (error) {
    console.error('Error fetching OAuth2 providers:', error);
    return ['google'];
  }
};

/**
 * Get provider display name
 */
export const getProviderDisplayName = (provider: OAuth2Provider): string => {
  const names: Record<OAuth2Provider, string> = {
    google: 'Google',
    facebook: 'Facebook',
    microsoft: 'Microsoft',
  };
  return names[provider] || provider;
};

/**
 * Get provider icon SVG path (for custom icons)
 */
export const getProviderIcon = (provider: OAuth2Provider): string => {
  // These are placeholder paths - you can replace with actual SVG paths or use icon libraries
  const icons: Record<OAuth2Provider, string> = {
    google: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z',
    facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    microsoft: 'M11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4zM11.4 24H0V12.6h11.4V24zm12.6 0H12.6V12.6H24V24z',
  };
  return icons[provider] || '';
};

