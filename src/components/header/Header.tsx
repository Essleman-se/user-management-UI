import Navbar from '../navbar/Navbar';
import ContactUs from '../contact-us/ContactUs';

interface HeaderProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

const Header = ({ isAuthenticated = false, onLogout }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-1000 w-full shadow-md shadow-slate-900/15">
      <div className="border-b border-slate-700/80 bg-linear-to-r from-slate-900 via-slate-900 to-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold tracking-tight text-white">Mic_User</p>
          <ContactUs variant="link" />
        </div>
      </div>
      <Navbar isAuthenticated={isAuthenticated} onLogout={onLogout} />
    </header>
  );
};

export default Header;
