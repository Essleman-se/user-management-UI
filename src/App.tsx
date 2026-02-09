import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import Navbar from './components/navbar/Navbar'
import Main from './components/main/Main'
import Register from './components/register/Register'
import Login from './components/login/Login'
import UserAccount from './components/user-account/UserAccount'
import OAuth2Callback from './components/oauth2/OAuth2Callback'

// Component to handle GitHub Pages 404 redirects
function OAuth2RedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if we're on index.html (from 404.html redirect) or root path with OAuth2 params
    const pathname = location.pathname;
    const hasOAuthParams = location.search.includes('token=') || location.search.includes('code=');
    const isIndexPage = pathname === '/' || pathname === '/index.html' || pathname.endsWith('/index.html') || pathname.endsWith('index.html');
    
    if (isIndexPage && hasOAuthParams) {
      // Redirect to /oauth2/callback with the query params preserved
      console.log('OAuth2RedirectHandler: Detected index.html with OAuth2 params, redirecting to /oauth2/callback');
      console.log('OAuth2RedirectHandler: Search params:', location.search);
      navigate('/oauth2/callback' + location.search + location.hash, { replace: true });
    } else if (isIndexPage && !hasOAuthParams) {
      // If on index.html without OAuth params, redirect to home
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
      <OAuth2RedirectHandler />
      <Routes>
        <Route path="/" element={<Main isAuthenticated={isAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLogin} />} />
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
        {/* Catch-all route for index.html redirects - will be handled by OAuth2RedirectHandler */}
        <Route path="/index.html" element={<OAuth2RedirectHandler />} />
      </Routes>
    </div>
  )
}

export default App
