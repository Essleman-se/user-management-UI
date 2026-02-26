import { useState } from 'react';
import type { FormEvent } from 'react';
import { getApiUrl } from '../../utils/api';

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
          email: formData.email,
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
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">User Registration</h1>

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-600 mr-2 shrink-0 mt-0.5"
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
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-green-800 font-medium wrap-break-word">
                    Registration successful!
                  </p>
                  <p className="text-sm text-green-700 mt-1 wrap-break-word">
                    Please check your email and click the verification link to activate your account. You will be able to login after verifying your email.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start sm:items-center">
                <svg
                  className="h-5 w-5 text-red-600 mr-2 shrink-0 mt-0.5 sm:mt-0"
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
                <p className="text-sm sm:text-base text-red-800 font-medium wrap-break-word">Error: {error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
            {/* Name */}
            <div className="w-full">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full max-w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            {/* Age */}
            <div className="w-full">
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
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
                className="w-full max-w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your age"
              />
            </div>

            {/* Sex */}
            <div className="w-full min-w-0">
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Sex
              </label>
              <div className="relative w-full min-w-0">
                <button
                  type="button"
                  id="sex"
                  className="w-full min-w-0 px-3 sm:px-4 py-2 pr-8 text-left text-sm sm:text-base border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent box-border flex items-center justify-between"
                  onClick={() => setIsSexOpen((prev) => !prev)}
                >
                  <span className={formData.sex ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.sex || 'Select sex'}
                  </span>
                  <svg
                    className={`h-5 w-5 text-gray-400 transition-transform ${isSexOpen ? 'rotate-180' : ''}`}
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
                  <div className="absolute z-30 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                    {['MALE', 'FEMALE', 'OTHER'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSexSelect(option)}
                        className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-gray-100 ${
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

            {/* Email */}
            <div className="w-full">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full max-w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div className="w-full">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
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
                className="w-full max-w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            {/* Confirm Password */}
            <div className="w-full">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
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
                className="w-full max-w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Re-enter your password"
              />
            </div>

            {/* Role */}
            <div className="w-full min-w-0">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Role
              </label>
              <div className="relative w-full min-w-0">
                <button
                  type="button"
                  id="role"
                  className="w-full min-w-0 px-3 sm:px-4 py-2 pr-8 text-left text-sm sm:text-base border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent box-border flex items-center justify-between"
                  onClick={() => setIsRoleOpen((prev) => !prev)}
                >
                  <span className={formData.role ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.role || 'Select role'}
                  </span>
                  <svg
                    className={`h-5 w-5 text-gray-400 transition-transform ${isRoleOpen ? 'rotate-180' : ''}`}
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
                  <div className="absolute z-30 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                    {['USER', 'ADMIN', 'MODERATOR'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleRoleSelect(option)}
                        className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-gray-100 ${
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

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 sm:py-3 px-4 rounded-md text-sm sm:text-base font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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

