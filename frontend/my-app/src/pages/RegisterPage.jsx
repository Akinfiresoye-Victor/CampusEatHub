import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../api/authApi'
import { useAuthStore } from '../stores/useAuthStore'
import { User, IdCard, Hash, Lock, Eye, EyeOff, Store, Phone, Mail, GraduationCap, UtensilsCrossed, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const { setUser } = useAuthStore()
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
    password: '',
    password2: '',
  })

  const [cafeteriaData, setCafeteriaData] = useState({
    full_name: '',
    username: '',
    password: '',
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

    if (role === 'student' && studentData.password !== studentData.password2) {
      setError('Passwords do not match.')
      return
    }
    if (role === 'cafeteria' && cafeteriaData.password !== cafeteriaData.password2) {
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
            password: studentData.password,
          }
        : {
            role: 'cafeteria',
            full_name: cafeteriaData.full_name,
            username: cafeteriaData.username,
            password: cafeteriaData.password,
          }

      const res = await registerApi(payload)
      if (res.data.success) {
        setUser(res.data.data)
        if (role === 'student') navigate('/student/dashboard')
        else navigate('/cafeteria/dashboard')
      } else {
        setError(res.data.error || 'Registration failed. Please try again.')
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
        <Link to="/login">← Back to Login</Link>
      </div>

      <div className="register-card">

        <img src="/elizade.png" alt="Elizade University" className="logo" />
        <h1>Byte<span>N</span>Bite</h1>
        <p className="subtitle">Create your account to get started</p>

        <div className="role-selection">
          <button
            type="button"
            className={`role-btn ${role === 'student' ? 'selected' : ''}`}
            onClick={() => { setRole('student'); setError('') }}
          >
            <GraduationCap size={18} /> Student
          </button>
          <button
            type="button"
            className={`role-btn ${role === 'cafeteria' ? 'selected' : ''}`}
            onClick={() => { setRole('cafeteria'); setError('') }}
          >
            <UtensilsCrossed size={18} /> Cafeteria
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
                    <span className="icon"><User size={18} /></span>
                    <input type="text" name="full_name" placeholder="Full name" value={studentData.full_name} onChange={handleStudentChange} required />
                  </div>
                </div>
                <div className="form-col">
                  <label>Username</label>
                  <div className="input-group">
                    <span className="icon"><IdCard size={18} /></span>
                    <input type="text" name="username" placeholder="Username" value={studentData.username} onChange={handleStudentChange} required />
                  </div>
                </div>
              </div>

              <label>Matric Number</label>
              <div className="input-group">
                <span className="icon"><Hash size={18} /></span>
                <input type="text" name="matric_number" placeholder="Enter your matric number" value={studentData.matric_number} onChange={handleStudentChange} required />
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label>Password</label>
                  <div className="input-group">
                    <span className="icon"><Lock size={18} /></span>
                    <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={studentData.password} onChange={handleStudentChange} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
                <div className="form-col">
                  <label>Confirm Password</label>
                  <div className="input-group">
                    <span className="icon"><Lock size={18} /></span>
                    <input type={showPassword2 ? 'text' : 'password'} name="password2" placeholder="Confirm password" value={studentData.password2} onChange={handleStudentChange} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword2(!showPassword2)}>
                      {showPassword2 ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <div className="form-col">
                  <label>Full Name / Owner</label>
                  <div className="input-group">
                    <span className="icon"><User size={18} /></span>
                    <input type="text" name="full_name" placeholder="Owner full name" value={cafeteriaData.full_name} onChange={handleCafeteriaChange} required />
                  </div>
                </div>
                <div className="form-col">
                  <label>Username (Cafeteria)</label>
                  <div className="input-group">
                    <span className="icon"><Store size={18} /></span>
                    <input type="text" name="username" placeholder="Cafeteria username" value={cafeteriaData.username} onChange={handleCafeteriaChange} required />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label>Password</label>
                  <div className="input-group">
                    <span className="icon"><Lock size={18} /></span>
                    <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={cafeteriaData.password} onChange={handleCafeteriaChange} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
                <div className="form-col">
                  <label>Confirm Password</label>
                  <div className="input-group">
                    <span className="icon"><Lock size={18} /></span>
                    <input type={showPassword2 ? 'text' : 'password'} name="password2" placeholder="Confirm password" value={cafeteriaData.password2} onChange={handleCafeteriaChange} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword2(!showPassword2)}>
                      {showPassword2 ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>

          <button type="button" className="back-btn" onClick={() => navigate('/login')}>
            Already have an account? Sign In
          </button>

        </form>
      </div>
    </div>
  )
}