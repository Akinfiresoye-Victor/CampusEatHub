import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <img src="/elizade.png" alt="logo" className="navbar-logo-img" />
        <span className="navbar-brand">Campus <span>Connect</span></span>
      </div>

      {/* Hamburger for mobile */}
      <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Links */}
      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>

        {!user && (
          <>
            <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" className="nav-link" onClick={() => setMenuOpen(false)}>Register</Link>
          </>
        )}

        {user?.role === 'student' && (
          <>
            <Link to="/student/products" className="nav-link" onClick={() => setMenuOpen(false)}>🛍️ Products</Link>
            <Link to="/student/cafeterias" className="nav-link" onClick={() => setMenuOpen(false)}>🍽️ Cafeterias</Link>
            <Link to="/student/cart" className="nav-link" onClick={() => setMenuOpen(false)}>🛒 Cart</Link>
            <Link to="/student/orders" className="nav-link" onClick={() => setMenuOpen(false)}>📦 Orders</Link>
            <Link to="/student/spending" className="nav-link" onClick={() => setMenuOpen(false)}>💰 Spending</Link>
            <Link to="/student/vendor" className="nav-link" onClick={() => setMenuOpen(false)}>🏪 My Shop</Link>
            <Link to="/student/ai-recommender" className="nav-link" onClick={() => setMenuOpen(false)}>🤖 AI Meals</Link>
          </>
        )}

        {user?.role === 'cafeteria' && (
          <>
            <Link to="/cafeteria/menu" className="nav-link" onClick={() => setMenuOpen(false)}>🍴 Menu</Link>
            <Link to="/cafeteria/orders" className="nav-link" onClick={() => setMenuOpen(false)}>📋 Orders</Link>
            <Link to="/cafeteria/ai-assistant" className="nav-link" onClick={() => setMenuOpen(false)}>🤖 AI Assistant</Link>
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <Link to="/admin/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>📊 Overview</Link>
            <Link to="/admin/users" className="nav-link" onClick={() => setMenuOpen(false)}>👥 Users</Link>
            <Link to="/admin/orders" className="nav-link" onClick={() => setMenuOpen(false)}>📦 Orders</Link>
            <Link to="/admin/ai-assistant" className="nav-link" onClick={() => setMenuOpen(false)}>🤖 AI Assistant</Link>
          </>
        )}

        {user && (
          <button className="nav-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}

      </div>
    </nav>
  )
}