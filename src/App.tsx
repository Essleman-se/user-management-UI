import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import Navbar from './components/navbar/Navbar'
import Main from './components/main/Main'
import Register from './components/register/Register'
import Login from './components/login/Login'
import UserAccount from './components/user-account/UserAccount'
import OAuth2Callback from './components/oauth2/OAuth2Callback'
import VerifyEmail from './components/verify-email/VerifyEmail'

// Component to handle GitHub Pages 404 redirects from index.html
// Also handles direct access to routes without base path (for email verification links)
// Handles both OAuth2 callbacks and email verification links
function RedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);
  
  useEffect(() => {
    // Only redirect once to prevent loops
    if (hasRedirectedRef.current) return;
    
    const pathname = location.pathname;
    const search = location.search;
    const hasToken = search.includes('token=');
    const hasCode = search.includes('code=');
    const hasEmail = search.includes('email=');
    const hasRole = search.includes('role=');
    const isIndexPage = pathname === '/index.html';
    const basePath = import.meta.env.BASE_URL || '/user-management-UI';
    
    // Handle direct access to /verify-email without base path (from email links)
    if (pathname === '/verify-email' && hasToken && !pathname.startsWith(basePath)) {
      console.log('RedirectHandler: Detected direct access to /verify-email, redirecting with base path');
      hasRedirectedRef.current = true;
      navigate('/verify-email' + search + location.hash, { replace: true });
      return;
    }
    
    // Handle direct access to /oauth2/callback without base path
    if (pathname === '/oauth2/callback' && !pathname.startsWith(basePath)) {
      console.log('RedirectHandler: Detected direct access to /oauth2/callback, redirecting with base path');
      hasRedirectedRef.current = true;
      navigate('/oauth2/callback' + search + location.hash, { replace: true });
      return;
    }
    
    if (isIndexPage && hasToken) {
      // Check if this is an OAuth2 callback (has email and/or role params) or email verification
      if (hasEmail || hasRole || hasCode) {
        // OAuth2 callback - redirect to /oauth2/callback
        console.log('RedirectHandler: Detected OAuth2 callback, redirecting to /oauth2/callback');
        hasRedirectedRef.current = true;
        navigate('/oauth2/callback' + search + location.hash, { replace: true });
      } else {
        // Email verification - redirect to /verify-email
        console.log('RedirectHandler: Detected email verification, redirecting to /verify-email');
        hasRedirectedRef.current = true;
        navigate('/verify-email' + search + location.hash, { replace: true });
      }
    } else if (isIndexPage && hasCode) {
      // OAuth2 code exchange
      console.log('RedirectHandler: Detected OAuth2 code, redirecting to /oauth2/callback');
      hasRedirectedRef.current = true;
      navigate('/oauth2/callback' + search + location.hash, { replace: true });
    } else if (isIndexPage && !hasToken && !hasCode) {
      // If on index.html without params, redirect to home
      hasRedirectedRef.current = true;
      navigate('/', { replace: true });
    }
  }, [location, navigate]);
  
  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    // Clear token and email from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    console.log('User logged out')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Main isAuthenticated={isAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLogin} />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route 
          path="/oauth2/callback" 
          element={<OAuth2Callback onLoginSuccess={handleLogin} />} 
        />
        <Route 
          path="/user-account" 
          element={
            isAuthenticated ? (
              <UserAccount isAuthenticated={isAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="/about" element={<div className="p-8"><h1 className="text-3xl font-bold">About</h1><p className="mt-4">About page coming soon...</p></div>} />
        {/* Catch-all route for index.html redirects - handles OAuth2 and email verification */}
        <Route path="/index.html" element={<RedirectHandler />} />
      </Routes>
    </div>
  )
}

export default App
