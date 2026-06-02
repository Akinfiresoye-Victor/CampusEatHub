import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [studentData, setStudentData] = useState({
    full_name: '',
    matric_number: '',
    username: '',
    password1: '',
    password2: '',
  })

  const [cafeteriaData, setCafeteriaData] = useState({
    business_name: '',
    phone_number: '',
    owner_name: '',
    email: '',
    password1: '',
    password2: '',
  })

  const handleStudentChange = (e) => {
    setStudentData({ ...studentData, [e.target.name]: e.target.value })
  }

  const handleCafeteriaChange = (e) => {
    setCafeteriaData({ ...cafeteriaData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (role === 'student' && studentData.password1 !== studentData.password2) {
      setError('Passwords do not match.')
      return
    }
    if (role === 'cafeteria' && cafeteriaData.password1 !== cafeteriaData.password2) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const payload = role === 'student'
        ? {
            role: 'student',
            full_name: studentData.full_name,
            matric_number: studentData.matric_number,
            username: studentData.username,
            password1: studentData.password1,
            password2: studentData.password2,
          }
        : {
            role: 'cafeteria',
            business_name: cafeteriaData.business_name,
            phone_number: cafeteriaData.phone_number,
            owner_name: cafeteriaData.owner_name,
            email: cafeteriaData.email,
            password1: cafeteriaData.password1,
            password2: cafeteriaData.password2,
          }

      const res = await registerApi(payload)
      if (res.data.success) {
        login(res.data.data)
        if (role === 'student') navigate('/student/dashboard')
        else navigate('/cafeteria/dashboard')
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
    <div className="register-page">

      <div className="admin-login">
        <Link to="/login_user">← Back to Login</Link>
      </div>

      <div className="register-card">

        <img src="/elizade.png" alt="Elizade University" className="logo" />
        <h1>Campus <span>Register</span></h1>
        <p className="subtitle">Create your account to get started</p>

        <div className="role-selection">
          <button
            type="button"
            className={`role-btn ${role === 'student' ? 'selected' : ''}`}
            onClick={() => { setRole('student'); setError('') }}
          >
            🎓 Student
          </button>
          <button
            type="button"
            className={`role-btn ${role === 'cafeteria' ? 'selected' : ''}`}
            onClick={() => { setRole('cafeteria'); setError('') }}
          >
            🍽️ Cafeteria
          </button>
        </div>

        {error && (
          <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', width: '100%' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form" style={{ width: '100%' }}>

          {role === 'student' ? (
            <>
              <div className="form-row">
                <div className="form-col">
                  <label>Full Name</label>
                  <div className="input-group">
                    <span className="icon">👤</span>
                    <input type="text" name="full_name" placeholder="Full name" value={studentData.full_name} onChange={handleStudentChange} required />
                  </div>
                </div>
                <div className="form-col">
                  <label>Username</label>
                  <div className="input-group">
                    <span className="icon">🪪</span>
                    <input type="text" name="username" placeholder="Username" value={studentData.username} onChange={handleStudentChange} required />
                  </div>
                </div>
              </div>

              <label>Matric Number</label>
              <div className="input-group">
                <span className="icon">🎫</span>
                <input type="text" name="matric_number" placeholder="Enter your matric number" value={studentData.matric_number} onChange={handleStudentChange} required />
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label>Password</label>
                  <div className="input-group">
                    <span className="icon">🔒</span>
                    <input type={showPassword ? 'text' : 'password'} name="password1" placeholder="Password" value={studentData.password1} onChange={handleStudentChange} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div className="form-col">
                  <label>Confirm Password</label>
                  <div className="input-group">
                    <span className="icon">🔒</span>
                    <input type={showPassword2 ? 'text' : 'password'} name="password2" placeholder="Confirm password" value={studentData.password2} onChange={handleStudentChange} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword2(!showPassword2)}>
                      {showPassword2 ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
            </>
         ) : (
  <>
    <div className="form-row">
      <div className="form-col">
        <label>Owner Name</label>
        <div className="input-group">
          <span className="icon">👤</span>
          <input type="text" name="owner_name" placeholder="Owner full name" value={cafeteriaData.owner_name} onChange={handleCafeteriaChange} required />
        </div>
      </div>
      <div className="form-col">
        <label>Business Name</label>
        <div className="input-group">
          <span className="icon">🏪</span>
          <input type="text" name="business_name" placeholder="Cafeteria name" value={cafeteriaData.business_name} onChange={handleCafeteriaChange} required />
        </div>
      </div>
    </div>

    <div className="form-row">
      <div className="form-col">
        <label>Phone Number</label>
        <div className="input-group">
          <span className="icon">📞</span>
          <input type="tel" name="phone_number" placeholder="Phone number" value={cafeteriaData.phone_number} onChange={handleCafeteriaChange} required />
        </div>
      </div>
      <div className="form-col">
        <label>Email</label>
        <div className="input-group">
          <span className="icon">📧</span>
          <input type="email" name="email" placeholder="Business email" value={cafeteriaData.email} onChange={handleCafeteriaChange} required />
        </div>
      </div>
    </div>

    <div className="form-row">
      <div className="form-col">
        <label>Password</label>
        <div className="input-group">
          <span className="icon">🔒</span>
          <input type={showPassword ? 'text' : 'password'} name="password1" placeholder="Password" value={cafeteriaData.password1} onChange={handleCafeteriaChange} required />
          <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
      <div className="form-col">
        <label>Confirm Password</label>
        <div className="input-group">
          <span className="icon">🔒</span>
          <input type={showPassword2 ? 'text' : 'password'} name="password2" placeholder="Confirm password" value={cafeteriaData.password2} onChange={handleCafeteriaChange} required />
          <button type="button" className="eye-btn" onClick={() => setShowPassword2(!showPassword2)}>
            {showPassword2 ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
    </div>
  </>
)}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>

          <button type="button" className="back-btn" onClick={() => navigate('/login')}>
            Already have an account? Sign In
          </button>

        </form>
      </div>
    </div>
  )
}