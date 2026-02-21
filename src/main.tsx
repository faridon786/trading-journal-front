import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize theme from localStorage
const storedTheme = localStorage.getItem('theme')
if (storedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
