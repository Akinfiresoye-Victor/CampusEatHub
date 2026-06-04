import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/useAuthStore'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/student/StudentDashboard'
import ProductsPage from './pages/student/ProductsPage'
import CafeteriasPage from './pages/student/CafeteriasPage'
import CafeteriaMenuPage from './pages/student/CafeteriaMenuPage'
import CartPage from './pages/student/CartPage'
import CheckoutPage from './pages/student/CheckoutPage'
import OrdersPage from './pages/student/OrdersPage'
import OrderDetailPage from './pages/student/OrderDetailPage'
import VendorPage from './pages/student/VendorPage'
import CafeteriaDashboard from './pages/cafeteria/CafeteriaDashboard'
import CafeteriaOrdersPage from './pages/cafeteria/CafeteriaOrdersPage'
import CafeteriaMenuManagePage from './pages/cafeteria/CafeteriaMenuPage'

function FullPageSpinner() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      gap: '20px',
    }}>
      <img src="/elizade.png" alt="CampusConnect" style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)' }} />
      <div style={{
        width: 48, height: 48,
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontWeight: 500 }}>Loading CampusConnect...</p>
    </div>
  )
}

// ProtectedRoute with role checking
function ProtectedRoute({ children, requiredRole }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />

  // Role enforcement
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />
    if (user.role === 'cafeteria') return <Navigate to="/cafeteria/dashboard" replace />
    return <Navigate to="/login" replace />
  }

  return children
}

// PublicRoute prevents logged-in users from accessing login/register
function PublicRoute({ children }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <FullPageSpinner />
  if (user) {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />
    if (user.role === 'cafeteria') return <Navigate to="/cafeteria/dashboard" replace />
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const { checkSession, isLoading } = useAuthStore()

  useEffect(() => {
    checkSession()
  }, [])

  if (isLoading) return <FullPageSpinner />

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Student */}
      <Route path="/student/dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/products" element={<ProtectedRoute requiredRole="student"><ProductsPage /></ProtectedRoute>} />
      <Route path="/student/cafeterias" element={<ProtectedRoute requiredRole="student"><CafeteriasPage /></ProtectedRoute>} />
      <Route path="/student/cafeteria/:id" element={<ProtectedRoute requiredRole="student"><CafeteriaMenuPage /></ProtectedRoute>} />
      <Route path="/student/cart" element={<ProtectedRoute requiredRole="student"><CartPage /></ProtectedRoute>} />
      <Route path="/student/checkout" element={<ProtectedRoute requiredRole="student"><CheckoutPage /></ProtectedRoute>} />
      <Route path="/student/orders" element={<ProtectedRoute requiredRole="student"><OrdersPage /></ProtectedRoute>} />
      <Route path="/student/orders/:id" element={<ProtectedRoute requiredRole="student"><OrderDetailPage /></ProtectedRoute>} />
      <Route path="/student/vendor" element={<ProtectedRoute requiredRole="student"><VendorPage /></ProtectedRoute>} />
      {/* Cafeteria */}
      <Route path="/cafeteria/dashboard" element={<ProtectedRoute requiredRole="cafeteria"><CafeteriaDashboard /></ProtectedRoute>} />
      <Route path="/cafeteria/menu" element={<ProtectedRoute requiredRole="cafeteria"><CafeteriaMenuManagePage /></ProtectedRoute>} />
      <Route path="/cafeteria/orders" element={<ProtectedRoute requiredRole="cafeteria"><CafeteriaOrdersPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}