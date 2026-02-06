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
    // If we're on the root path but have OAuth2 query params, redirect to /oauth2/callback
    if (location.pathname === '/' && (location.search.includes('token=') || location.search.includes('code='))) {
      navigate('/oauth2/callback' + location.search + location.hash, { replace: true });
    }
  }, [location, navigate]);
  
  return null;
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
      </Routes>
    </div>
  )
}

export default App
