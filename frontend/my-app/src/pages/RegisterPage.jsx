import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerStudent, registerCafeteria } from '../api/authApi';
import { useAuthStore } from '../stores/useAuthStore';
import { User, IdCard, Hash, Lock, Eye, EyeOff, Store, Phone, Mail, GraduationCap, UtensilsCrossed, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Student Data
  const [studentData, setStudentData] = useState({
    full_name: '',
    matric_number: '',
    username: '',
    password: '',
    password2: '',
  });

  // Cafeteria Data
  const [cafeteriaData, setCafeteriaData] = useState({
    business_name: '',
    owner_name: '',        // Owner's full name
    phone_number: '',
    email: '',
    username: '',
    password: '',
    password2: '',
  });

  const handleStudentChange = (e) => {
    setStudentData({ ...studentData, [e.target.name]: e.target.value });
  };

  const handleCafeteriaChange = (e) => {
    setCafeteriaData({ ...cafeteriaData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Password match validation
    if (role === 'student' && studentData.password !== studentData.password2) {
      setError('Passwords do not match.');
      return;
    }
    if (role === 'cafeteria' && cafeteriaData.password !== cafeteriaData.password2) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (role === 'student') {
        const payload = {
          role: 'student',
          full_name: studentData.full_name,
          matric_number: studentData.matric_number,
          username: studentData.username,
          password: studentData.password,
          password2: studentData.password2,
        };
        res = await registerStudent(payload);
      } else {
        const payload = {
          role: 'cafeteria',
          business_name: cafeteriaData.business_name,
          owner_name: cafeteriaData.owner_name,
          phone_number: cafeteriaData.phone_number,
          email: cafeteriaData.email,
          username: cafeteriaData.username,
          password: cafeteriaData.password,
          password2: cafeteriaData.password2,
        };
        res = await registerCafeteria(payload);
      }

      if (res.data.success) {
        await useAuthStore.getState().checkSession();
        const returnedRole = res.data.role || role;
        if (returnedRole === 'student') navigate('/student/dashboard');
        else navigate('/cafeteria/dashboard');
      } else {
        setError(res.data.error || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="admin-login">
        <Link to="/login">← Back to Login</Link>
      </div>

      <div className="register-card">
        <img src="/elizade.png" alt="Elizade University" className="logo" />
        <h1>Campus <span>Connect</span></h1>
        <p className="subtitle">Create your account to get started</p>

        <div className="role-selection">
          <button
            type="button"
            className={`role-btn ${role === 'student' ? 'selected' : ''}`}
            onClick={() => { setRole('student'); setError(''); }}
          >
            <GraduationCap size={18} /> Student
          </button>
          <button
            type="button"
            className={`role-btn ${role === 'cafeteria' ? 'selected' : ''}`}
            onClick={() => { setRole('cafeteria'); setError(''); }}
          >
            <UtensilsCrossed size={18} /> Cafeteria
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">

          {role === 'student' ? (
            // ==================== STUDENT FORM ====================
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
                <input type="text" name="matric_number" placeholder="e.g. EU240102-4159" value={studentData.matric_number} onChange={handleStudentChange} required />
              </div>
            </>
          ) : (
            // ==================== CAFETERIA FORM ====================
            <>
              <div className="form-row">
                <div className="form-col">
                  <label>Business Name</label>
                  <div className="input-group">
                    <span className="icon"><Store size={18} /></span>
                    <input type="text" name="business_name" placeholder="Cafeteria name" value={cafeteriaData.business_name} onChange={handleCafeteriaChange} required />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label>Owner Full Name</label>
                  <div className="input-group">
                    <span className="icon"><User size={18} /></span>
                    <input type="text" name="owner_name" placeholder="Owner full name" value={cafeteriaData.owner_name} onChange={handleCafeteriaChange} required />
                  </div>
                </div>
                <div className="form-col">
                  <label>Phone Number</label>
                  <div className="input-group">
                    <span className="icon"><Phone size={18} /></span>
                    <input type="tel" name="phone_number" placeholder="080XXXXXXXX" value={cafeteriaData.phone_number} onChange={handleCafeteriaChange} required />
                  </div>
                </div>
              </div>

              <label>Email Address</label>
              <div className="input-group">
                <span className="icon"><Mail size={18} /></span>
                <input type="email" name="email" placeholder="cafeteria@example.com" value={cafeteriaData.email} onChange={handleCafeteriaChange} required />
              </div>
            </>
          )}

          {/* Password Fields - Common for both roles */}
          <div className="form-row">
            <div className="form-col">
              <label>Password</label>
              <div className="input-group">
                <span className="icon"><Lock size={18} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={role === 'student' ? studentData.password : cafeteriaData.password}
                  onChange={role === 'student' ? handleStudentChange : handleCafeteriaChange}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <div className="form-col">
              <label>Confirm Password</label>
              <div className="input-group">
                <span className="icon"><Lock size={18} /></span>
                <input
                  type={showPassword2 ? 'text' : 'password'}
                  name="password2"
                  placeholder="Confirm password"
                  value={role === 'student' ? studentData.password2 : cafeteriaData.password2}
                  onChange={role === 'student' ? handleStudentChange : handleCafeteriaChange}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword2(!showPassword2)}>
                  {showPassword2 ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
          </div>

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
  );
}