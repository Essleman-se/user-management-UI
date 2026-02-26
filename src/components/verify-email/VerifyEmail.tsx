import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [isEmailNotFound, setIsEmailNotFound] = useState<boolean>(false);
  const hasVerifiedRef = useRef<boolean>(false);
  const token = searchParams.get('token');

  useEffect(() => {
    // Prevent multiple verification attempts
    if (hasVerifiedRef.current) {
      return;
    }

    const verifyEmail = async () => {
      // Check if token exists in URL
      if (!token) {
        hasVerifiedRef.current = true;
        setStatus('error');
        setMessage('Verification token is missing. Please check your email link.');
        return;
      }

      // Mark as verifying to prevent duplicate calls
      hasVerifiedRef.current = true;
      
      // Ensure we're in loading state
      setStatus('loading');
      setMessage('');

      try {
        // Call backend API to verify the token
        const response = await fetch(getApiUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Check if response is ok (status 200-299)
        if (response.ok) {
          try {
            const data = await response.json();
            setStatus('success');
            setMessage(data.message || 'Email verified successfully! You can now log in.');
          } catch (jsonError) {
            // If response is ok but not JSON, still treat as success
            console.warn('Response is ok but not JSON:', jsonError);
            setStatus('success');
            setMessage('Email verified successfully! You can now log in.');
          }
        } else {
          // Handle error response - extract detailed error information
          let errorMessage = 'Email verification failed.';
          let errorDetails = '';
          let emailNotFound = false;
          const statusCode = response.status;
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            
            // Check if this is an "Email address not found" error (404 status)
            const lowerMessage = errorMessage.toLowerCase();
            if (
              statusCode === 404 ||
              lowerMessage.includes('email address not found') ||
              lowerMessage.includes('email not found') ||
              lowerMessage.includes('user not found') ||
              lowerMessage.includes('email does not exist')
            ) {
              emailNotFound = true;
              // Keep the backend message but ensure it's clear
              if (!lowerMessage.includes('not found') && !lowerMessage.includes('does not exist')) {
                errorMessage = 'Email address not found. The email address may not be registered in our system.';
              }
              errorDetails = 'Please register a new account to continue.';
            } else {
              // Extract additional error details if available (only for other errors)
              if (errorData.details) {
                errorDetails = errorData.details;
              } else if (errorData.validationErrors) {
                errorDetails = Array.isArray(errorData.validationErrors) 
                  ? errorData.validationErrors.join(', ')
                  : String(errorData.validationErrors);
              }
              
              // Include status code in details if available
              if (statusCode) {
                errorDetails = errorDetails 
                  ? `${errorDetails} (Status: ${statusCode})`
                  : `Status: ${statusCode}`;
              }
            }
          } catch {
            // If response is not JSON, check status code
            if (statusCode === 404) {
              emailNotFound = true;
              errorMessage = 'Email address not found. The email address may not be registered in our system.';
              errorDetails = 'Please register a new account to continue.';
            } else {
              errorMessage = response.statusText || `Verification failed with status ${statusCode}`;
              errorDetails = `HTTP Status: ${statusCode}`;
            }
          }
          
          setStatus('error');
          setMessage(errorMessage);
          setErrorDetails(errorDetails);
          setIsEmailNotFound(emailNotFound);
        }
      } catch (error) {
        // Only show error for actual network/request errors
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again later.');
        setErrorDetails(error instanceof Error ? error.message : 'Network or connection error');
      }
    };

    // Run verification
    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Verifying your email...</h2>
            <p className="mt-2 text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Email Verified Successfully!</h2>
            <p className="mt-4 text-gray-600">{message}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                Go to Login
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              {isEmailNotFound ? 'Email Address Not Found' : 'Email Verification Failed'}
            </h2>
            <div className="mt-4 text-left bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">Reason:</p>
              <p className="text-red-700 text-sm">{message}</p>
              {errorDetails && (
                <>
                  <p className="text-red-800 font-medium mt-3 mb-2">
                    {isEmailNotFound ? 'Next Steps:' : 'Details:'}
                  </p>
                  <p className="text-red-600 text-xs">{errorDetails}</p>
                </>
              )}
            </div>
            <div className="mt-6 space-y-3">
              {isEmailNotFound ? (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    This email address is not registered in our system. Please create a new account to continue.
                  </p>
                  <button
                    onClick={() => navigate('/register', { replace: true })}
                    className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Register New Account
                  </button>
                  <button
                    onClick={() => navigate('/login', { replace: true })}
                    className="w-full bg-gray-200 text-gray-800 py-2.5 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
                  >
                    Go to Login
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-2">What would you like to do?</p>
                  <button
                    onClick={() => navigate('/login', { replace: true })}
                    className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Go to Login
                  </button>
                  <button
                    onClick={() => navigate('/register', { replace: true })}
                    className="w-full bg-gray-200 text-gray-800 py-2.5 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
                  >
                    Register Again
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

