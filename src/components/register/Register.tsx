import { useState } from 'react';
import type { FormEvent } from 'react';
import { getApiUrl } from '../../utils/api';
import { normalizeEmail } from '../../utils/email';

interface RegisterFormData {
  name: string;
  age: string;
  sex: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role: string;
}

const Register = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    age: '',
    sex: '',
    email: '',
    password: '',
    role: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isSexOpen, setIsSexOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleEmailBlur = () => {
    setFormData((prev) => ({
      ...prev,
      email: normalizeEmail(prev.email),
    }));
  };

  const handleSexSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      sex: value,
    }));
    setIsSexOpen(false);
    if (error) setError(null);
  };

  const handleRoleSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }));
    setIsRoleOpen(false);
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== (formData.confirmPassword ?? '')) {
      setError('Passwords do not match');
      return;
    }

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
          name: formData.name,
          age: parseInt(formData.age),
          sex: formData.sex,
          email: normalizeEmail(formData.email),
          password: formData.password,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuccess(true);
      console.log('Registration successful:', data);
      
      // Reset form after successful registration
      setFormData({
        name: '',
        age: '',
        sex: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register user');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-2.5rem)] bg-gray-50 py-2 sm:py-3 px-3 sm:px-4 flex flex-col justify-center">
      <div className="max-w-3xl mx-auto w-full max-h-[calc(100dvh-2.5rem)] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 w-full">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">
            User Registration
          </h1>

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-2 sm:p-2.5 mb-2 sm:mb-3">
              <div className="flex items-start gap-2">
                <svg
                  className="h-4 w-4 text-green-600 shrink-0 mt-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-green-800 font-medium wrap-break-word">
                    Registration successful!
                  </p>
                  <p className="text-xs text-green-700 mt-0.5 wrap-break-word leading-snug">
                    Check your email for the verification link, then you can log in.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 sm:p-2.5 mb-2 sm:mb-3">
              <div className="flex items-start sm:items-center gap-2">
                <svg
                  className="h-4 w-4 text-red-600 shrink-0 mt-0.5 sm:mt-0"
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
                <p className="text-xs sm:text-sm text-red-800 font-medium wrap-break-word">Error: {error}</p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-2.5 w-full max-w-full min-w-0"
          >
            {/* Name */}
            <div className="w-full min-w-0">
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-0.5">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full max-w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            {/* Age */}
            <div className="w-full min-w-0">
              <label htmlFor="age" className="block text-xs font-medium text-gray-700 mb-0.5">
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="1"
                max="120"
                className="w-full max-w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your age"
              />
            </div>

            {/* Sex */}
            <div className="w-full min-w-0">
              <label htmlFor="sex" className="block text-xs font-medium text-gray-700 mb-0.5">
                Sex
              </label>
              <div className="relative w-full min-w-0">
                <button
                  type="button"
                  id="sex"
                  className="w-full min-w-0 px-2.5 py-1.5 pr-7 text-left text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent box-border flex items-center justify-between"
                  onClick={() => setIsSexOpen((prev) => !prev)}
                >
                  <span className={formData.sex ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.sex || 'Select sex'}
                  </span>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${isSexOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {isSexOpen && (
                  <div className="absolute z-30 mt-0.5 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                    {['MALE', 'FEMALE', 'OTHER'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSexSelect(option)}
                        className={`w-full text-left px-2.5 py-1.5 text-sm hover:bg-gray-100 ${
                          formData.sex === option ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                        }`}
                      >
                        {option.charAt(0) + option.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="w-full min-w-0">
              <label htmlFor="role" className="block text-xs font-medium text-gray-700 mb-0.5">
                Role
              </label>
              <div className="relative w-full min-w-0">
                <button
                  type="button"
                  id="role"
                  className="w-full min-w-0 px-2.5 py-1.5 pr-7 text-left text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent box-border flex items-center justify-between"
                  onClick={() => setIsRoleOpen((prev) => !prev)}
                >
                  <span className={formData.role ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.role || 'Select role'}
                  </span>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${isRoleOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {isRoleOpen && (
                  <div className="absolute z-30 mt-0.5 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                    {['USER', 'ADMIN', 'MODERATOR'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleRoleSelect(option)}
                        className={`w-full text-left px-2.5 py-1.5 text-sm hover:bg-gray-100 ${
                          formData.role === option ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                        }`}
                      >
                        {option.charAt(0) + option.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="w-full min-w-0 sm:col-span-2">
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
                className="w-full max-w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div className="w-full min-w-0">
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
                minLength={6}
                className="w-full max-w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            {/* Confirm Password */}
            <div className="w-full min-w-0">
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-0.5">
                Re-enter Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword ?? ''}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full max-w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Re-enter your password"
              />
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                    <span className="text-xs sm:text-sm">Registering...</span>
                  </span>
                ) : (
                  'Register'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

