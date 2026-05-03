import { useState, useEffect, useRef, type FormEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import OAuth2Buttons from '../oauth2/OAuth2Buttons';
import { getApiUrl } from '../../utils/api';
import { messageFromApiErrorBody } from '../../utils/apiErrors';
import { normalizeEmail } from '../../utils/email';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginProps {
  onLoginSuccess?: () => void;
}

type LoginStep = 'credentials' | 'otp';

const OTP_LEN = 6;

const OTP_RETRY_HINT = 'Please go back and sign in again to request a new code.';

function shouldAppendOtpRetryHint(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('invalid login verification code') ||
    lower.includes('verification code has expired') ||
    lower.includes('already been used') ||
    lower.includes('this login verification code')
  );
}

function formatLoginError(data: Record<string, unknown>, fallback: string): string {
  const detail = messageFromApiErrorBody(data);
  return detail || (typeof data.message === 'string' ? data.message : fallback);
}

/** Optional fields some backends return with requiresVerification for the verify-code call. */
function extractVerifyExtras(data: Record<string, unknown>): Record<string, unknown> {
  const keys = ['challengeId', 'verificationChallengeId', 'tempToken', 'sessionId', 'loginChallengeId'] as const;
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (data[k] != null && data[k] !== '') {
      out[k] = data[k];
    }
  }
  return out;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [step, setStep] = useState<LoginStep>('credentials');
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array(OTP_LEN).fill(''));
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [verifyExtras, setVerifyExtras] = useState<Record<string, unknown>>({});

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const state = location.state as {
      oauth2Error?: string;
      passwordReset?: boolean;
      resetMessage?: string;
    } | null;
    if (state?.oauth2Error) {
      setError(state.oauth2Error);
      window.history.replaceState({}, document.title);
    }
    if (state?.passwordReset && state?.resetMessage) {
      setInfoMessage(state.resetMessage);
      setError(null);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const resetOtpStep = () => {
    setStep('credentials');
    setOtpDigits(Array(OTP_LEN).fill(''));
    setPendingEmail(null);
    setVerifyExtras({});
    setError(null);
    setInfoMessage(null);
  };

  const completeLoginSuccess = (email: string, data: { token?: string }) => {
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    localStorage.setItem('userEmail', email);
    if (onLoginSuccess) {
      onLoginSuccess();
    }
    navigate('/');
  };

  const handleCredentialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
    if (infoMessage) setInfoMessage(null);
  };

  const handleEmailBlur = () => {
    setFormData((prev) => ({
      ...prev,
      email: normalizeEmail(prev.email),
    }));
  };

  const handleOtpChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LEN - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    if (error) setError(null);
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Backspace') return;
    e.preventDefault();
    setOtpDigits((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = '';
        return next;
      }
      if (index > 0) {
        next[index - 1] = '';
        otpRefs.current[index - 1]?.focus();
      }
      return next;
    });
    if (error) setError(null);
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    const next = Array(OTP_LEN).fill('');
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i] ?? '';
    }
    setOtpDigits(next);
    const focusIdx = Math.min(Math.max(pasted.length - 1, 0), OTP_LEN - 1);
    otpRefs.current[focusIdx]?.focus();
    if (error) setError(null);
  };

  const handleCredentialSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
          username: email,
          password: formData.password,
        }),
      });

      const contentType = response.headers.get('content-type');
      let errorData: Record<string, unknown> = { message: 'Login failed' };

      if (!response.ok) {
        if (contentType?.includes('application/json')) {
          errorData = (await response.json().catch(() => errorData)) as Record<string, unknown>;
        } else {
          const text = await response.text();
          errorData = { message: `Server error (${response.status}): ${text.substring(0, 100)}` };
        }
        throw new Error(formatLoginError(errorData, `HTTP error! status: ${response.status}`));
      }

      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got: ${contentType}. Response: ${text.substring(0, 100)}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      console.log('Login response:', data);

      if (data.requiresVerification === true) {
        setPendingEmail(email);
        setVerifyExtras(extractVerifyExtras(data));
        setFormData((prev) => ({ ...prev, password: '' }));
        setOtpDigits(Array(OTP_LEN).fill(''));
        setStep('otp');
        setInfoMessage(
          typeof data.message === 'string' && data.message.trim()
            ? data.message
            : 'Enter the 6-digit code we sent to your email.'
        );
        setError(null);
        window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
        return;
      }

      if (typeof data.token === 'string' && data.token) {
        localStorage.setItem('token', data.token);
      }
      localStorage.setItem('userEmail', email);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pendingEmail) {
      setError('Session expired. Please sign in again.');
      return;
    }

    const code = otpDigits.join('');
    if (code.length !== OTP_LEN) {
      setError(`Enter all ${OTP_LEN} digits.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl('/api/auth/login/verify-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: pendingEmail,
          username: pendingEmail,
          code,
          ...verifyExtras,
        }),
      });

      const contentType = response.headers.get('content-type');
      let errorData: Record<string, unknown> = { message: 'Verification failed' };

      if (!response.ok) {
        if (contentType?.includes('application/json')) {
          errorData = (await response.json().catch(() => errorData)) as Record<string, unknown>;
        } else {
          const text = await response.text();
          errorData = { message: `Server error (${response.status}): ${text.substring(0, 100)}` };
        }
        let msg = formatLoginError(errorData, `HTTP error! status: ${response.status}`);
        if (shouldAppendOtpRetryHint(msg)) {
          msg = `${msg} ${OTP_RETRY_HINT}`;
        }
        throw new Error(msg);
      }

      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got: ${contentType}. Response: ${text.substring(0, 100)}`);
      }

      const data = (await response.json()) as { token?: string };
      console.log('Login verify successful:', data);
      completeLoginSuccess(pendingEmail, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      console.error('Verify code error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-2.5rem)] bg-gray-50 py-2 px-3 flex flex-col justify-center">
      <div className="max-w-sm mx-auto w-full">
        <div className="bg-white rounded-lg shadow-md border border-gray-200/80 p-3">
          <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">
            {step === 'credentials' ? 'Login' : 'Enter verification code'}
          </h1>

          {infoMessage && (
            <div
              className={
                step === 'otp'
                  ? 'bg-indigo-50 border border-indigo-200 rounded-md p-2 mb-2'
                  : 'bg-emerald-50 border border-emerald-200 rounded-md p-2 mb-2'
              }
            >
              <p
                className={
                  step === 'otp'
                    ? 'text-xs text-indigo-900 wrap-break-word leading-snug'
                    : 'text-xs text-emerald-900 wrap-break-word leading-snug'
                }
              >
                {infoMessage}
              </p>
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
                <p className="text-xs text-red-800 font-medium wrap-break-word leading-snug whitespace-pre-wrap">
                  Error: {error}
                </p>
              </div>
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentialSubmit} className="space-y-2">
              <div className="w-full">
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-0.5">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleCredentialChange}
                  onBlur={handleEmailBlur}
                  required
                  className="w-full max-w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md h-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>

              <div className="w-full">
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-0.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleCredentialChange}
                    required
                    className="w-full max-w-full px-2.5 py-1.5 pr-10 text-sm border border-gray-300 rounded-md h-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide sign-in secret' : 'Show sign-in secret'}
                    className="absolute inset-y-0 right-0 flex items-center border border-transparent bg-transparent px-2.5 text-gray-500 shadow-none outline-none hover:text-gray-700 focus:outline-none focus:ring-0"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="mt-1 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="text-xs">Logging in...</span>
                    </span>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-3">
              <p className="text-[11px] text-gray-600 text-center leading-snug">
                Code sent to <span className="font-medium text-gray-800">{pendingEmail}</span>
              </p>
              <div>
                <p className="sr-only">6-digit verification code</p>
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: OTP_LEN }, (_, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={otpDigits[i]}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      aria-label={`Digit ${i + 1}`}
                      className="h-9 w-9 sm:h-10 sm:w-10 text-center text-base font-semibold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying…' : 'Verify and sign in'}
              </button>
              <button
                type="button"
                onClick={resetOtpStep}
                className="w-full text-xs font-medium text-gray-600 hover:text-gray-800 py-1"
              >
                Back to sign in
              </button>
            </form>
          )}

          {step === 'credentials' && (
            <>
              <div className="mt-3">
                <OAuth2Buttons />
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Register here
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
