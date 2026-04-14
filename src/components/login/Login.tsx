import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import OAuth2Buttons from '../oauth2/OAuth2Buttons';
import { getApiUrl } from '../../utils/api';
import { normalizeEmail } from '../../utils/email';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check for OAuth2 error from location state
  useEffect(() => {
    const state = location.state as { oauth2Error?: string } | null;
    if (state?.oauth2Error) {
      setError(state.oauth2Error);
      // Clear the state to prevent showing error on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  /** Trim + lowercase so login matches regardless of how the user types their email. */
  const handleEmailBlur = () => {
    setFormData((prev) => ({
      ...prev,
      email: normalizeEmail(prev.email),
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const email = normalizeEmail(formData.email);
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          // Many backends (e.g. Spring Security) use "username" for the login principal; keep in sync with email.
          username: email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData;
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({ message: 'Login failed' }));
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
      console.log('Login successful:', data);
      
      // Store token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Store email for fetching user info (canonical form)
      localStorage.setItem('userEmail', email);

      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      }

      // Redirect to main page after successful login
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-2.5rem)] bg-gray-50 py-2 px-3 flex flex-col justify-center">
      <div className="max-w-sm mx-auto w-full">
        <div className="bg-white rounded-lg shadow-md border border-gray-200/80 p-3">
          <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">Login</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-2">
              <div className="flex items-start gap-2">
                <svg
                  className="h-4 w-4 text-red-600 shrink-0 mt-0.5"
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
                <p className="text-xs text-red-800 font-medium wrap-break-word leading-snug">Error: {error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Email */}
            <div className="w-full">
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-0.5">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                required
                className="w-full max-w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md h-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="w-full">
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-0.5">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full max-w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md h-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-0.5">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-white shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-xs">Logging in...</span>
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>

          {/* OAuth2 Buttons */}
          <div className="mt-3">
            <OAuth2Buttons />
          </div>

          {/* Link to Register */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

