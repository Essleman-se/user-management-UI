import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-800 bg-linear-to-b from-slate-900 to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold tracking-tight text-white">Mic_User</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">
              User management and account tools. Built for clarity and reliability.
            </p>
          </div>
          <nav
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-300 sm:justify-end"
            aria-label="Footer"
          >
            <Link to="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <Link to="/about" className="transition-colors hover:text-white">
              About
            </Link>
            <Link to="/contact" className="transition-colors hover:text-white">
              Contact
            </Link>
            <Link to="/login" className="transition-colors hover:text-indigo-300">
              Sign in
            </Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-slate-800/80 pt-6 text-center">
          <p className="text-xs text-slate-500">
            © {year} Mic_User. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
