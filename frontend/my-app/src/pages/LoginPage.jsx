import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api/authApi'
import { useAuthStore } from '../stores/useAuthStore'
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi({ username, password })
      if (res.data.success) {
        const role = res.data.role
        // Call checkSession to fetch full user profile via /api/auth/me/
        await useAuthStore.getState().checkSession()

        if (role === 'student') navigate('/student/dashboard/')
        else if (role === 'cafeteria') navigate('/cafeteria/dashboard')
        else navigate('/')
      } else {
        setError(res.data.error || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      <div className="login-card">

        {/* Logo */}
        <img src="/elizade.png" alt="Elizade University" className="logo" />

        {/* Title */}
        <h1>Campus <span>Connect</span></h1>
        <p className="subtitle">Welcome back! Please sign in to your account</p>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fff0f0',
            border: '1px solid #ffcccc',
            color: '#cc0000',
            borderRadius: '8px',
            padding: '0.7rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>

          <label>Email / Username</label>
          <div className="input-group">
            <span className="icon"><User size={18} /></span>
            <input
              id="login-username"
              type="text"
              placeholder="Enter email or username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <label>Password</label>
          <div className="input-group">
            <span className="icon"><Lock size={18} /></span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <button id="login-submit" type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : (
              <>Sign In <ArrowRight size={16} /></>
            )}
          </button>

        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </div>

      </div>
    </div>
  )
}