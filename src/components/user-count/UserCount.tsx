import { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';

interface UserCountProps {
  isAuthenticated: boolean;
  compact?: boolean; // For navbar display
}

const UserCount = ({ isAuthenticated, compact = false }: UserCountProps) => {
  const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const email = localStorage.getItem('userEmail');
        const token = localStorage.getItem('token');
        
        if (!email) {
          throw new Error('No user email found');
        }

        // Try GET with query parameter first
        // Use getApiUrl to handle both dev and production environments
        const apiUrl = `${getApiUrl('/api/users/by-email')}?email=${encodeURIComponent(email)}`;
        console.log('Fetching user info from:', apiUrl);

        const headers: HeadersInit = {
          'Accept': 'application/json',
        };

        // Add token if available
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        let response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
        });

        let contentType = response.headers.get('content-type') || '';

        // If GET returns HTML, try POST with email in body (some APIs require POST)
        if (!contentType.includes('application/json') && response.status === 200) {
          console.log('GET returned HTML, trying POST method...');
          
          const postHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          };
          
          if (token) {
            postHeaders['Authorization'] = `Bearer ${token}`;
          }

          response = await fetch(getApiUrl('/api/users/by-email'), {
            method: 'POST',
            headers: postHeaders,
            body: JSON.stringify({ email: email }),
          });

          contentType = response.headers.get('content-type') || '';
        }

        // Check if response is HTML (error page)
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
          console.error('Response status:', response.status);
          console.error('Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (response.status === 404) {
            throw new Error(`Endpoint not found: /api/users/by-email. Please verify the API endpoint exists.`);
          }
          
          throw new Error(
            `Server returned HTML instead of JSON (Status: ${response.status}). ` +
            `This usually means the endpoint doesn't exist or there's a server configuration issue. ` +
            `Check if the endpoint: http://localhost:8080/api/users/by-email exists. ` +
            `Also check browser console and Network tab for CORS errors.`
          );
        }

        if (!response.ok) {
          if (response.status === 404) {
            // User not found - might be a new OAuth2 user
            // Try to get user info from token-based endpoint instead
            if (token) {
              console.log('User not found by email, trying token-based endpoint...');
              try {
                const meResponse = await fetch(getApiUrl('/api/users/me'), {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                });

                if (meResponse.ok) {
                  const contentType = meResponse.headers.get('content-type');
                  if (contentType && contentType.includes('application/json')) {
                    const meData = await meResponse.json();
                    setUserInfo(meData);
                    return; // Successfully got user info from /me endpoint
                  }
                }
              } catch (meErr) {
                console.warn('Could not fetch from /api/users/me:', meErr);
              }
            }
            
            // If /me endpoint also fails, create a basic user info from email
            console.log('Creating basic user info from email for new OAuth2 user');
            setUserInfo({
              email: email,
              name: email.split('@')[0], // Use email prefix as name
            });
            return; // Don't throw error, use basic info
          }
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use default message
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        // Store all data from API
        setUserInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user information');
        console.error('Error fetching user info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [isAuthenticated]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Compact view for navbar - returns user info for dropdown
  if (compact) {
    if (loading) {
      return (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        </div>
      );
    }

    // For compact view, show avatar even if there's an error or no userInfo
    // Use email from localStorage as fallback
    const email = localStorage.getItem('userEmail') || '';
    const displayName = userInfo 
      ? ((userInfo.name as string) || (userInfo.username as string) || email.split('@')[0] || 'User')
      : (email.split('@')[0] || 'User');

    return (
      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
        {displayName.charAt(0).toUpperCase()}
      </div>
    );
  }

  // Full view for main page
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading user information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-red-600 mr-2"
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
          <p className="text-red-800 font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  // Display all fields from API
  const excludeKeys = ['password', 'id']; // Exclude sensitive fields
  const userFields = Object.entries(userInfo).filter(([key]) => !excludeKeys.includes(key.toLowerCase()));

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">User Account</h2>
      <div className="space-y-3">
        {userFields.map(([key, value]) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            <span className="text-sm font-medium text-gray-500 sm:w-32 capitalize shrink-0">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <span className="text-base sm:text-lg text-gray-900 wrap-break-word">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserCount;

