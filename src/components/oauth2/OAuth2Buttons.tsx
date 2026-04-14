import { useState, useEffect } from 'react';
import { getAvailableOAuth2Providers, initiateOAuth2Login, getProviderDisplayName, type OAuth2Provider } from '../../utils/oauth2';

interface OAuth2ButtonsProps {
  onProviderClick?: (provider: OAuth2Provider) => void;
  className?: string;
}

const OAuth2Buttons = ({ onProviderClick, className = '' }: OAuth2ButtonsProps) => {
  const [providers, setProviders] = useState<OAuth2Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const availableProviders = await getAvailableOAuth2Providers();
        if (Array.isArray(availableProviders) && availableProviders.length > 0) {
          setProviders(availableProviders);
        } else {
          setProviders(['google']);
        }
      } catch (error) {
        console.error('Error loading OAuth2 providers:', error);
        setProviders(['google']);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleProviderClick = async (provider: OAuth2Provider) => {
    if (onProviderClick) {
      onProviderClick(provider);
    }
    try {
      await initiateOAuth2Login(provider);
    } catch (error) {
      console.error('Error initiating OAuth2 login:', error);
      // Error will be handled by the callback component or can show a toast notification
    }
  };

  const getProviderButtonClass = (provider: OAuth2Provider): string => {
    const baseClass =
      'w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
    
    const providerClasses: Record<OAuth2Provider, string> = {
      google: 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
      facebook: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      microsoft: 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    };

    return `${baseClass} ${providerClasses[provider] || 'bg-white text-gray-700 hover:bg-gray-50'}`;
  };

  const getProviderIcon = (provider: OAuth2Provider) => {
    // Simple SVG icons for common providers
    switch (provider) {
      case 'google':
        return (
          <svg className="w-4 h-4 mr-1.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-4 h-4 mr-1.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case 'microsoft':
        return (
          <svg className="w-4 h-4 mr-1.5 shrink-0" viewBox="0 0 24 24">
            <path fill="#f25022" d="M1 1h10v10H1z" />
            <path fill="#00a4ef" d="M13 1h10v10H13z" />
            <path fill="#7fba00" d="M1 13h10v10H1z" />
            <path fill="#ffb900" d="M13 13h10v10H13z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-2 ${className}`}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => handleProviderClick(provider)}
            className={getProviderButtonClass(provider)}
          >
            {getProviderIcon(provider)}
            <span>Continue with {getProviderDisplayName(provider)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OAuth2Buttons;

