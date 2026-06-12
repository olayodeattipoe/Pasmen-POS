import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import { CartProvider } from './components/context/CartContext'
import { AuthProvider } from './components/context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </CartProvider>
  </StrictMode>,
)
