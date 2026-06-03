import { Routes, Route, Navigate } from 'react-router-dom'
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
import SpendingPage from './pages/student/SpendingPage'
import VendorPage from './pages/student/VendorPage'
import CafeteriaDashboard from './pages/cafeteria/CafeteriaDashboard'
import CafeteriaOrdersPage from './pages/cafeteria/CafeteriaOrdersPage'
import CafeteriaMenuManagePage from './pages/cafeteria/CafeteriaMenuPage'

// ProtectedRoute temporarily disabled for frontend development
function ProtectedRoute({ children }) {
  return children
}

// Placeholder page component
function Page({ name }) {
  return <div style={{ padding: '2rem', fontSize: '1.5rem', color: '#4f46e5' }}>{name} — Coming Soon</div>
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student */}
      <Route path="/student/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="/student/cafeterias" element={<ProtectedRoute><CafeteriasPage /></ProtectedRoute>} />
      <Route path="/student/cafeteria/:id" element={<ProtectedRoute><CafeteriaMenuPage /></ProtectedRoute>} />
      <Route path="/student/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
      <Route path="/student/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/student/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/student/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
      <Route path="/student/spending" element={<ProtectedRoute><SpendingPage /></ProtectedRoute>} />
      <Route path="/student/vendor" element={<ProtectedRoute><VendorPage /></ProtectedRoute>} />
      <Route path="/student/ai-recommender" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />

      {/* Cafeteria */}
      <Route path="/cafeteria/analytics" element={<ProtectedRoute><Page name="Analytics" /></ProtectedRoute>} />
      <Route path="/cafeteria/dashboard" element={<ProtectedRoute><CafeteriaDashboard /></ProtectedRoute>} />
      <Route path="/cafeteria/menu" element={<ProtectedRoute><CafeteriaMenuManagePage /></ProtectedRoute>} />
      <Route path="/cafeteria/orders" element={<ProtectedRoute><CafeteriaOrdersPage /></ProtectedRoute>} />
      <Route path="/cafeteria/ai-assistant" element={<ProtectedRoute><Page name="Cafeteria AI Assistant" /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute><Page name="Admin Dashboard" /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><Page name="Users List" /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute><Page name="All Orders" /></ProtectedRoute>} />
      <Route path="/admin/ai-assistant" element={<ProtectedRoute><Page name="Admin AI Assistant" /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}