import { useState } from 'react';
import type { FormEvent } from 'react';
import { getApiUrl } from '../../utils/api';
import { messageFromApiErrorBody } from '../../utils/apiErrors';
import { normalizeEmail } from '../../utils/email';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
}

const Register = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleEmailBlur = () => {
    setFormData((prev) => ({
      ...prev,
      email: normalizeEmail(prev.email),
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== (formData.confirmPassword ?? '')) {
      setError('Passwords do not match');
      return;
    }

    const first = formData.firstName.trim();
    const last = formData.lastName.trim();
    if (!first || !last) {
      setError('Please enter your first name and last name');
      return;
    }
    const email = normalizeEmail(formData.email);
    const phone = formData.phone.trim();

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: first,
          lastName: last,
          email,
          phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword ?? '',
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData: Record<string, unknown> = { message: 'Registration failed' };
        if (contentType?.includes('application/json')) {
          errorData = (await response.json().catch(() => errorData)) as Record<string, unknown>;
        } else {
          const text = await response.text();
          errorData = { message: text ? `${text.slice(0, 200)} (${response.status})` : `HTTP ${response.status}` };
        }
        const detail = messageFromApiErrorBody(errorData);
        const message =
          detail ||
          (typeof errorData.message === 'string' ? errorData.message : null) ||
          `HTTP error! status: ${response.status}`;
        console.error('Registration failed:', response.status, errorData);
        throw new Error(message);
      }

      const data = await response.json();
      setSuccess(true);
      console.log('Registration successful:', data);

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register user');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-shadow placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

  return (
    <div className="h-[calc(100dvh-2.5rem)] overflow-hidden bg-linear-to-b from-slate-50 via-white to-indigo-50/40 px-4 py-3 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        <div className="rounded-2xl bg-white p-5 shadow-xl shadow-indigo-950/5 ring-1 ring-gray-200/80 sm:p-6">
          <p className="text-center text-[11px] leading-snug text-gray-500 sm:text-xs">
            Create your account — join us in a minute.
          </p>

          <div className="mt-3 max-h-[calc(100dvh-2.5rem-4.25rem)] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pr-0.5">
            {success && (
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 shadow-sm">
                <div className="flex gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-900">You&apos;re registered</p>
                    <p className="mt-0.5 text-xs text-emerald-800/90 leading-snug sm:text-sm">
                      Check your email for the verification link, then you can log in.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50/90 p-3 shadow-sm">
                <div className="flex gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-600">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="wrap-break-word text-xs font-medium text-red-900 leading-snug sm:text-sm">
                    Error: {error}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label htmlFor="firstName" className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  First name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                  className={inputClass}
                  placeholder="Jane"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Last name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                  className={inputClass}
                  placeholder="Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
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
                  autoComplete="email"
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  className={inputClass}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Confirm password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword ?? ''}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Re-enter your password"
                />
              </div>

              <div className="pt-0.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Creating account…</span>
                    </span>
                  ) : (
                    'Create account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
