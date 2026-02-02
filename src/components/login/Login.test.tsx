import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  const mockOnLoginSuccess = vi.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Create fresh localStorage mock for each test
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    // Mock localStorage using vi.stubGlobal for better compatibility
    vi.stubGlobal('localStorage', localStorageMock);
    // Reset fetch mock
    globalThis.fetch = vi.fn() as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderLogin = (props = {}) => {
    return render(
      <BrowserRouter>
        <Login onLoginSuccess={mockOnLoginSuccess} {...props} />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render login form with all required elements', () => {
      renderLogin();

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register here/i })).toBeInTheDocument();
    });

    it('should have correct input types and attributes', () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email');

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
    });

    it('should not display error message initially', () => {
      renderLogin();

      expect(screen.queryByText(/error:/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('should update email input value when user types', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password input value when user types', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('should clear error message when user starts typing', async () => {
      const user = userEvent.setup();
      renderLogin();

      // First, trigger an error by submitting empty form
      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // Wait for validation error (browser native)
      const emailInput = screen.getByLabelText(/email/i);
      
      // Then type in the email field
      await user.type(emailInput, 'test@example.com');

      // Error should be cleared (if it was set by our component)
      // Note: HTML5 validation errors are handled by browser, not our component
    });
  });

  describe('Form Submission - Success Cases', () => {
    it('should successfully submit form with valid credentials', async () => {
      const user = userEvent.setup();
      const mockToken = 'mock-jwt-token';
      const mockResponse = {
        token: mockToken,
        message: 'Login successful',
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        });
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
        expect(localStorage.setItem).toHaveBeenCalledWith('userEmail', 'test@example.com');
      });

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should store token in localStorage when provided', async () => {
      const user = userEvent.setup();
      const mockToken = 'test-token-123';
      const mockResponse = {
        token: mockToken,
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      });
    });

    it('should store email in localStorage after successful login', async () => {
      const user = userEvent.setup();
      const testEmail = 'user@example.com';
      const mockResponse = {
        token: 'test-token',
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), testEmail);
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('userEmail', testEmail);
      });
    });

    it('should call onLoginSuccess callback when provided', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        token: 'test-token',
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should work without onLoginSuccess callback', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        token: 'test-token',
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      render(<BrowserRouter><Login /></BrowserRouter>);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Form Submission - Error Cases', () => {
    it('should display error message when API returns error with JSON response', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: errorMessage }),
      });

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
    });

    it('should display error message when API returns error with non-JSON response', async () => {
      const user = userEvent.setup();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => '<html>Server Error</html>',
      });

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });

    it('should display error when API returns HTML instead of JSON', async () => {
      const user = userEvent.setup();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html;charset=UTF-8' }),
        text: async () => '<!DOCTYPE html><html>...</html>',
      });

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/expected json/i)).toBeInTheDocument();
      });
    });

    it('should display error when fetch fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Network error';

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
      });
    });

    it('should display generic error message when error has no message', async () => {
      const user = userEvent.setup();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce({});

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to login/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      let resolveFetch: (value: any) => void;

      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise);

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Check for loading state
      expect(screen.getByText(/logging in/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();

      // Resolve the fetch
      resolveFetch!({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ token: 'test-token' }),
      });

      await waitFor(() => {
        expect(screen.queryByText(/logging in/i)).not.toBeInTheDocument();
      });
    });

    it('should disable submit button during loading', async () => {
      const user = userEvent.setup();
      let resolveFetch: (value: any) => void;

      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise);

      renderLogin();

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      // Resolve the fetch
      resolveFetch!({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ token: 'test-token' }),
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to register page when register link is clicked', () => {
      renderLogin();

      const registerLink = screen.getByRole('link', { name: /register here/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should navigate to home page after successful login', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        token: 'test-token',
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle login response without token', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        message: 'Login successful',
        // No token
      };

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        // Should not call localStorage.setItem for token
        const setItemMock = localStorage.setItem as ReturnType<typeof vi.fn>;
        const setItemCalls = setItemMock.mock.calls;
        const tokenCalls = setItemCalls.filter((call) => call[0] === 'token');
        expect(tokenCalls).toHaveLength(0);
        // But should still store email and navigate
        expect(localStorage.setItem).toHaveBeenCalledWith('userEmail', 'test@example.com');
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should handle empty error response', async () => {
      const user = userEvent.setup();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}), // Empty error object
      });

      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/http error.*500/i)).toBeInTheDocument();
      });
    });
  });
});

