import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
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
        login(res.data.data)
        const role = res.data.data.role
        if (role === 'student') navigate('/student/dashboard')
        else if (role === 'cafeteria') navigate('/cafeteria/dashboard')
        else if (role === 'admin') navigate('/admin/dashboard')
      } else {
        setError(res.data.error)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      {/* Admin Login Button */}
      <div className="admin-login">
        <Link to="/admin-login">Admin Login</Link>
      </div>

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
            <span className="icon">👤</span>
            <input
              type="text"
              placeholder="Enter email or username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <label>Password</label>
          <div className="input-group">
            <span className="icon">🔒</span>
            <input
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
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

        </form>

        <div className="divider">or continue with</div>

     <div className="social-buttons">
  <button type="button">
    <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px', marginRight: '8px', verticalAlign: 'middle' }} />
    Google
  </button>
  <button type="button">
    <img src="https://www.microsoft.com/favicon.ico" alt="Microsoft" style={{ width: '18px', height: '18px', marginRight: '8px', verticalAlign: 'middle' }} />
    Microsoft
  </button>
</div>

        <div className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </div>

        <div className="forgot">
          Forgot your password? <Link to="/forgot-password">Reset it here</Link>
        </div>

      </div>
    </div>
  )
}