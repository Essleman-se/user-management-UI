import { useState } from 'react';
import { Link } from 'react-router-dom';
import UserCount from '../user-count/UserCount';

interface NavbarProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

const linkBase =
  'rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-700';

const Navbar = ({ isAuthenticated = false, onLogout }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-11 items-center justify-between gap-4 py-1">
          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={linkBase}>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth — desktop */}
          <div className="hidden items-center gap-2 md:flex">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 rounded-md border border-slate-200/80 bg-slate-100/90 px-2 py-1.5 text-slate-700 shadow-sm transition-colors hover:bg-slate-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  aria-expanded={isProfileDropdownOpen}
                  aria-haspopup="menu"
                >
                  <UserCount isAuthenticated={isAuthenticated} compact={true} />
                  <svg
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {isProfileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      aria-hidden
                      onClick={() => setIsProfileDropdownOpen(false)}
                    />
                    <div
                      className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border border-slate-200/80 bg-white py-1 shadow-lg ring-1 ring-slate-900/5"
                      role="menu"
                    >
                      <Link
                        to="/user-account"
                        role="menuitem"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Account
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          handleLogout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <div className="flex w-full items-center justify-end md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
            >
              <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {!isMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div id="mobile-nav" className="border-t border-slate-200/90 bg-slate-50/95 md:hidden">
          <div className="mx-auto max-w-7xl space-y-0.5 px-4 py-3 sm:px-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block rounded-md px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-white hover:text-indigo-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="block rounded-md px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-white hover:text-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="mt-1 block rounded-md bg-indigo-600 px-3 py-2.5 text-center text-base font-semibold text-white hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/user-account"
                  className="block rounded-md px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-white hover:text-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Account
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="mt-1 w-full rounded-md border border-red-200 bg-white px-3 py-2.5 text-left text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
