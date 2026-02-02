import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiUrl, getApiBaseUrl } from '../../utils/api';

interface OAuth2CallbackProps {
  onLoginSuccess?: () => void;
}

const OAuth2Callback = ({ onLoginSuccess }: OAuth2CallbackProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showEmailInput, setShowEmailInput] = useState<boolean>(false);
  const [oauth2Email, setOauth2Email] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we're on the backend success page
        // Get backend URL dynamically (works in both dev and production)
        const backendBaseUrl = getApiBaseUrl() || 'http://localhost:8080';
        const currentUrl = window.location.href;
        const isOnBackendSuccessPage = currentUrl.includes(`${backendBaseUrl}/api/oauth2/success`) || 
                                       currentUrl.includes(`${backendBaseUrl}/oauth2/success`) ||
                                       (backendBaseUrl.includes('localhost:8080') && currentUrl.includes('localhost:8080'));
        
        if (isOnBackendSuccessPage) {
          // We're on the backend success page - try to get token from the page
          // Backend might be showing token in HTML or JSON
          try {
            const response = await fetch(currentUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
              credentials: 'include',
            });

            if (response.ok) {
              const contentType = response.headers.get('content-type') || '';
              
              if (contentType.includes('application/json')) {
                const data = await response.json();
                console.log('Backend success page response:', data);
                if (data.token && data.token.trim() !== '') {
                  // Get frontend origin from sessionStorage (stored before OAuth2 redirect)
                  // Fallback to current origin if not found (shouldn't happen in normal flow)
                  const frontendOrigin = sessionStorage.getItem('oauth2_frontend_origin') || window.location.origin;
                  const basePath = import.meta.env.BASE_URL || '/user-management-UI';
                  const callbackPath = basePath.endsWith('/') ? 'oauth2/callback' : '/oauth2/callback';
                  const frontendCallbackUrl = `${frontendOrigin}${basePath}${callbackPath}?token=${encodeURIComponent(data.token)}${data.email ? `&email=${encodeURIComponent(data.email)}` : ''}`;
                  console.log('Redirecting to frontend callback with token:', frontendCallbackUrl);
                  window.location.href = frontendCallbackUrl;
                  return;
                } else {
                  console.error('Backend returned success page but token is missing or empty:', data);
                  throw new Error('OAuth2 authentication succeeded but token is missing. Please try again.');
                }
              } else {
                // If HTML, try to extract token from URL params or page content
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                console.log('Extracted token from URL params:', token ? 'Token found' : 'Token not found');
                if (token && token.trim() !== '') {
                  const email = urlParams.get('email');
                  // Get frontend origin from sessionStorage
                  const frontendOrigin = sessionStorage.getItem('oauth2_frontend_origin') || window.location.origin;
                  const basePath = import.meta.env.BASE_URL || '/user-management-UI';
                  const callbackPath = basePath.endsWith('/') ? 'oauth2/callback' : '/oauth2/callback';
                  const frontendCallbackUrl = `${frontendOrigin}${basePath}${callbackPath}?token=${encodeURIComponent(token)}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
                  console.log('Redirecting to frontend callback with token from URL:', frontendCallbackUrl);
                  window.location.href = frontendCallbackUrl;
                  return;
                } else if (urlParams.has('token')) {
                  // Token parameter exists but is empty
                  console.error('Token parameter in URL but value is empty');
                  throw new Error('OAuth2 token parameter is present but empty. Please try logging in again.');
                }
              }
            }
          } catch (err) {
            console.error('Error extracting token from backend success page:', err);
          }
        }

        // Try to get token from backend success endpoint (if we're on frontend)
        try {
          const successResponse = await fetch(getApiUrl('/api/oauth2/success'), {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            credentials: 'include',
          });

          if (successResponse.ok) {
            const contentType = successResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const successData = await successResponse.json();
              
              if (successData.token) {
                console.log('OAuth2 login successful from success endpoint:', successData);
                
                // Store token temporarily (don't store in localStorage yet)
                setToken(successData.token);
                
                // Get email from OAuth2 response
                const emailFromOAuth = successData.user?.email || successData.email || '';
                console.log('Email from OAuth2:', emailFromOAuth);
                setOauth2Email(emailFromOAuth);
                setUserEmail(emailFromOAuth || ''); // Set empty string if no email
                
                // Always show email input to allow user to confirm/change it
                console.log('Showing email confirmation screen');
                setShowEmailInput(true);
                setLoading(false);
                return;
              }
            }
          }
        } catch (err) {
          console.warn('Could not fetch from success endpoint, trying other methods:', err);
        }

        // Get parameters from URL (fallback if success endpoint doesn't work)
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const tokenFromUrl = searchParams.get('token');
        const emailFromUrl = searchParams.get('email');

        // Check for OAuth2 error from backend redirect
        if (errorParam) {
          const errorDescription = searchParams.get('error_description') || searchParams.get('message') || 'OAuth2 authentication failed';
          throw new Error(errorDescription);
        }

        // If token is directly in URL (from backend success redirect)
        // Check if token exists and is not empty
        if (tokenFromUrl && tokenFromUrl.trim() !== '') {
          console.log('Token found in URL, email from URL:', emailFromUrl);
          
          // Store token temporarily (don't store in localStorage yet)
          setToken(tokenFromUrl);
          
          // Get email from URL or set empty
          const email = emailFromUrl || '';
          setOauth2Email(email);
          setUserEmail(email);
          
          // Always show email input to allow user to confirm/change it
          console.log('Showing email confirmation screen');
          setShowEmailInput(true);
          setLoading(false);
          return;
        } else if (tokenFromUrl !== null) {
          // Token parameter exists but is empty - this is an error
          console.error('Token parameter found in URL but is empty');
          throw new Error('OAuth2 token is missing or empty. Please try logging in again.');
        }

        // If code is present, exchange it for token via backend
        if (code) {
          const provider = sessionStorage.getItem('oauth2_provider') || 'google';
          const redirectUri = `${window.location.origin}/oauth2/callback`;

          // Exchange code for token using backend callback endpoint
          const response = await fetch(getApiUrl('/api/oauth2/callback'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              code,
              state,
              provider,
              redirect_uri: redirectUri,
            }),
          });

          if (!response.ok) {
            const contentType = response.headers.get('content-type');
            let errorData;
            if (contentType && contentType.includes('application/json')) {
              errorData = await response.json().catch(() => ({ message: 'OAuth2 callback failed' }));
            } else {
              const text = await response.text();
              errorData = { message: `Server error (${response.status}): ${text.substring(0, 100)}` };
            }
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Expected JSON but got: ${contentType}. Response: ${text.substring(0, 100)}`);
          }

          const data = await response.json();
          console.log('OAuth2 login successful:', data);

          // Store token temporarily (don't store in localStorage yet)
          if (data.token && data.token.trim() !== '') {
            setToken(data.token);
          } else {
            console.error('Token received from callback endpoint is missing or empty:', data);
            throw new Error('OAuth2 authentication succeeded but token is missing. Please try again.');
          }

          // Get email from OAuth2 response
          const emailFromOAuth = data.user?.email || data.email || '';
          console.log('Email from OAuth2 callback:', emailFromOAuth);
          setOauth2Email(emailFromOAuth);
          setUserEmail(emailFromOAuth || ''); // Set empty string if no email
          
          // Always show email input to allow user to confirm/change it
          console.log('Showing email confirmation screen');
          setShowEmailInput(true);
          setLoading(false);
          return;
        }


        // No code or token found, and success endpoint didn't return token
        // Check if we have a token parameter but it's empty (common issue)
        if (searchParams.has('token') && !tokenFromUrl) {
          throw new Error('OAuth2 token parameter is present in URL but is empty. The backend may not have provided a token. Please check your backend OAuth2 configuration and try again.');
        }
        
        // Check if we have a token in state (from previous attempts)
        if (token) {
          console.log('Token found in state, showing email confirmation');
          setShowEmailInput(true);
          setLoading(false);
          return;
        }
        
        throw new Error('Authorization code or token not found. OAuth2 authentication may have failed. Please try logging in again.');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'OAuth2 authentication failed';
        setError(errorMessage);
        console.error('OAuth2 callback error:', err);
        
        // Clear session storage
        sessionStorage.removeItem('oauth2_redirect_after_login');
        sessionStorage.removeItem('oauth2_provider');
        sessionStorage.removeItem('oauth2_frontend_origin');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate('/login', { state: { oauth2Error: errorMessage } });
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, onLoginSuccess]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <svg
              className="h-6 w-6 text-red-600 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Authentication Failed</h2>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  // Email confirmation/input step
  if (showEmailInput) {
    console.log('Rendering email confirmation screen. OAuth2 email:', oauth2Email, 'User email:', userEmail, 'Token:', token ? 'present' : 'missing');
    
    const handleEmailSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!userEmail.trim()) {
        setError('Please enter an email address');
        return;
      }

      console.log('Submitting email:', userEmail.trim());

      // Store token and email
      if (token) {
        localStorage.setItem('token', token);
      }
      localStorage.setItem('userEmail', userEmail.trim());

      // Call success callback if provided (this sets isAuthenticated to true)
      if (onLoginSuccess) {
        onLoginSuccess();
      }

      // Clear session storage
      sessionStorage.removeItem('oauth2_redirect_after_login');
      sessionStorage.removeItem('oauth2_provider');

      // Navigate to home page (same as regular login)
      navigate('/');
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Confirm Your Email</h2>
          
          <p className="text-sm text-gray-600 mb-4 text-center">
            Please confirm or enter the email address you want to use for your account.
          </p>
          
          {oauth2Email && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Email from OAuth2:</span> {oauth2Email}
              </p>
              <p className="text-xs text-blue-600 mt-1">You can use this email or enter a different one below</p>
            </div>
          )}

          {!oauth2Email && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                No email was provided from OAuth2. Please enter your email address below.
              </p>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={userEmail}
                onChange={(e) => {
                  setUserEmail(e.target.value);
                  if (error) setError(null);
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={oauth2Email || "Enter your email address"}
                autoComplete="email"
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                {oauth2Email ? 'You can change the email from OAuth2 or keep it as is' : 'Enter the email address you want to use'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('oauth2_redirect_after_login');
                  sessionStorage.removeItem('oauth2_provider');
                  navigate('/login');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuth2Callback;

