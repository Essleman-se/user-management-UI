import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Get base path from Vite config
// Backend now includes the base path in email verification links
// Both development and production use "/user-management-UI" base path
const basePath = import.meta.env.BASE_URL || '/user-management-UI';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basePath}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
