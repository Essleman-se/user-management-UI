import { Link } from 'react-router-dom';

const SUPPORT_EMAIL = 'support@micuser.com';

type ContactUsProps = {
  /** Compact link for header vs full page content */
  variant?: 'link' | 'page';
};

const ContactUs = ({ variant = 'link' }: ContactUsProps) => {
  if (variant === 'page') {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Contact us</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Questions or feedback? Email us and we&apos;ll get back to you as soon as we can.
        </p>
        <p className="mt-6 text-sm text-gray-800">
          <span className="font-medium text-gray-700">Email: </span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-indigo-600 hover:text-indigo-500 underline-offset-2 hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    );
  }

  return (
    <Link
      to="/contact"
      className="text-xs font-medium text-slate-300 transition-colors hover:text-white"
    >
      Contact us
    </Link>
  );
};

export default ContactUs;
