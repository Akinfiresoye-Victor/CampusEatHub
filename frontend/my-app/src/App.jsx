import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'


// ProtectedRoute component
function ProtectedRoute({ children, allowedRole }) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated()) return <Navigate to="/login" />
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'student') return <Navigate to="/student/dashboard" />
    if (user.role === 'cafeteria') return <Navigate to="/cafeteria/dashboard" />
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" />
  }

  return children
}

// Placeholder page component
function Page({ name }) {
  return <div style={{ padding: '2rem', fontSize: '1.5rem' }}>{name}</div>
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student */}
      <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="student"><Page name="Student Dashboard" /></ProtectedRoute>} />
      <Route path="/student/products" element={<ProtectedRoute allowedRole="student"><Page name="Products" /></ProtectedRoute>} />
      <Route path="/student/cafeterias" element={<ProtectedRoute allowedRole="student"><Page name="Cafeterias" /></ProtectedRoute>} />
      <Route path="/student/cafeteria/:id" element={<ProtectedRoute allowedRole="student"><Page name="Cafeteria Menu" /></ProtectedRoute>} />
      <Route path="/student/cart" element={<ProtectedRoute allowedRole="student"><Page name="Cart" /></ProtectedRoute>} />
      <Route path="/student/checkout" element={<ProtectedRoute allowedRole="student"><Page name="Checkout" /></ProtectedRoute>} />
      <Route path="/student/orders" element={<ProtectedRoute allowedRole="student"><Page name="My Orders" /></ProtectedRoute>} />
      <Route path="/student/orders/:id" element={<ProtectedRoute allowedRole="student"><Page name="Order Detail" /></ProtectedRoute>} />
      <Route path="/student/spending" element={<ProtectedRoute allowedRole="student"><Page name="Spending History" /></ProtectedRoute>} />
      <Route path="/student/vendor" element={<ProtectedRoute allowedRole="student"><Page name="My Shop" /></ProtectedRoute>} />
      <Route path="/student/ai-recommender" element={<ProtectedRoute allowedRole="student"><Page name="AI Meal Recommender" /></ProtectedRoute>} />

      {/* Cafeteria */}
      <Route path="/cafeteria/dashboard" element={<ProtectedRoute allowedRole="cafeteria"><Page name="Cafeteria Dashboard" /></ProtectedRoute>} />
      <Route path="/cafeteria/menu" element={<ProtectedRoute allowedRole="cafeteria"><Page name="Menu Management" /></ProtectedRoute>} />
      <Route path="/cafeteria/orders" element={<ProtectedRoute allowedRole="cafeteria"><Page name="Cafeteria Orders" /></ProtectedRoute>} />
      <Route path="/cafeteria/ai-assistant" element={<ProtectedRoute allowedRole="cafeteria"><Page name="Cafeteria AI Assistant" /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><Page name="Admin Dashboard" /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><Page name="Users List" /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute allowedRole="admin"><Page name="All Orders" /></ProtectedRoute>} />
      <Route path="/admin/ai-assistant" element={<ProtectedRoute allowedRole="admin"><Page name="Admin AI Assistant" /></ProtectedRoute>} />

      {/* Default */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}