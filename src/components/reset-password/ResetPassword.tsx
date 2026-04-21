import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { messageFromApiErrorBody } from '../../utils/apiErrors';
import { frontendContextHeaders } from '../../utils/frontendRequestHints';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token.trim()) {
      setError('Reset link is invalid or expired. Request a new link from the forgot password page.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: frontendContextHeaders(),
        body: JSON.stringify({
          token: token.trim(),
          password,
          confirmPassword,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data: Record<string, unknown> = {};

      if (contentType?.includes('application/json')) {
        data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      }

      if (!response.ok) {
        const detail = messageFromApiErrorBody(data);
        const message =
          detail ||
          (typeof data.message === 'string' ? data.message : null) ||
          `Request failed (${response.status})`;
        console.error('Reset password failed:', response.status, data);
        throw new Error(message);
      }

      const msg =
        typeof data.message === 'string' ? data.message : 'Your password was updated. You can sign in now.';
      setSuccessMessage(msg);
      setPassword('');
      setConfirmPassword('');

      window.setTimeout(() => {
        navigate('/login', { replace: true, state: { passwordReset: true, resetMessage: msg } });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!token.trim()) {
    return (
      <div className="min-h-[calc(100dvh-2.5rem)] bg-gray-50 py-2 px-3 flex flex-col justify-center">
        <div className="max-w-sm mx-auto w-full">
          <div className="bg-white rounded-lg shadow-md border border-gray-200/80 p-3 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Reset password</h1>
            <p className="text-xs text-gray-600 mb-3 leading-snug">
              This link is missing a token. Open the link from your email, or request a new reset email.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot password
            </Link>
            <p className="mt-2">
              <Link to="/login" className="text-xs text-gray-500 hover:text-gray-700">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-2.5rem)] bg-gray-50 py-2 px-3 flex flex-col justify-center">
      <div className="max-w-sm mx-auto w-full">
        <div className="bg-white rounded-lg shadow-md border border-gray-200/80 p-3">
          <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Set new password</h1>
          <p className="text-[11px] text-gray-500 text-center mb-3 leading-snug">
            Choose a new password for your account.
          </p>

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2 mb-2">
              <p className="text-xs text-emerald-900 wrap-break-word leading-snug">{successMessage}</p>
              <p className="text-[11px] text-emerald-800 mt-1">Redirecting to login…</p>
            </div>
          )}

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

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <label htmlFor="new-password" className="block text-xs font-medium text-gray-700 mb-0.5">
                  New password
                </label>
                <input
                  type="password"
                  id="new-password"
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full max-w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md h-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label htmlFor="confirm-new-password" className="block text-xs font-medium text-gray-700 mb-0.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  id="confirm-new-password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full max-w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md h-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Re-enter password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}

          <div className="mt-3 text-center">
            <Link to="/login" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
