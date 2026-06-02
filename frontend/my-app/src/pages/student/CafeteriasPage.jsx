import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCafeterias } from '../../api/productsApi'
import AIChatBubble from '../AIChatBubble'

const DUMMY_CAFETERIAS = [
  { id: 1, name: "Mama Nkechi's Kitchen", image: null, status: 'Open' },
  { id: 2, name: "Campus Bites", image: null, status: 'Open' },
]

export default function CafeteriasPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [cafeterias, setCafeterias] = useState(DUMMY_CAFETERIAS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getCafeterias()
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setCafeterias(res.data.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarLinks = [
    { to: '/student/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/student/products', icon: '🛍️', label: 'All Products' },
    { to: '/student/cafeterias', icon: '🍽️', label: 'Cafeterias', active: true },
    { to: '/student/vendor', icon: '🏪', label: 'My Shop' },
    { to: '/student/orders', icon: '📦', label: 'My Orders' },
    { to: '/student/spending', icon: '💰', label: 'Spending' },
  ]

  const filtered = cafeterias.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="sd-layout">

      {/* SIDEBAR */}
      <aside className={`sd-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sd-sidebar-logo">
          <img src="/elizade.png" alt="logo" />
          {sidebarOpen && <span>Campus<b>Connect</b></span>}
        </div>
        <nav className="sd-sidebar-nav">
          {sidebarLinks.map((link) => (
            <Link key={link.to} to={link.to} className={`sd-sidebar-link ${link.active ? 'active' : ''}`}>
              <span className="sd-link-icon">{link.icon}</span>
              {sidebarOpen && <span className="sd-link-label">{link.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sd-sidebar-bottom">
          <div className="sd-divider" />
          <Link to="/help" className="sd-sidebar-link">
            <span className="sd-link-icon">❓</span>
            {sidebarOpen && <span className="sd-link-label">Help & Support</span>}
          </Link>
          <Link to="/settings" className="sd-sidebar-link">
            <span className="sd-link-icon">⚙️</span>
            {sidebarOpen && <span className="sd-link-label">Settings</span>}
          </Link>
          <button className="sd-sidebar-link logout" onClick={handleLogout}>
            <span className="sd-link-icon">🚪</span>
            {sidebarOpen && <span className="sd-link-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="sd-main">

        {/* TOPBAR */}
        <header className="sd-topbar">
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <form className="sd-search" onSubmit={(e) => e.preventDefault()}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search products, cafeterias and more..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          <div className="sd-topbar-right">
            <Link to="/student/orders" className="sd-top-icon"><span>📦</span><small>Orders</small></Link>
            <Link to="/student/spending" className="sd-top-icon"><span>💰</span><small>Spending</small></Link>
            <Link to="/student/cart" className="sd-top-icon"><span>🛒</span><small>Cart</small></Link>
            <div className="sd-avatar">
              <span>{(user?.full_name || user?.username || 'S')[0].toUpperCase()}</span>
              <small>{user?.full_name || user?.username || 'Student'} ▾</small>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="sd-content">

          {/* PAGE HEADER */}
          <div className="pp-header">
            <div>
              <h2>Cafeterias</h2>
              <p>Explore cafeterias across campus and discover menus.</p>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="cf-search-wrap">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search cafeterias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* COUNT */}
          <p className="cf-count">Showing <b>{filtered.length}</b> cafeterias</p>

          {/* LOADING */}
          {loading && (
            <div className="pp-state">
              <div className="pp-spinner" />
              <p>Loading cafeterias...</p>
            </div>
          )}

          {/* GRID */}
          {!loading && (
            <div className="cf-grid">
              {filtered.map((cafe) => (
                <Link
                  to={`/student/cafeteria/${cafe.id}`}
                  key={cafe.id}
                  className="cf-card"
                >
                  <div className="cf-card-img">
                    {cafe.image
                      ? <img src={cafe.image} alt={cafe.name} />
                      : <div className="cf-img-placeholder">🍽️</div>
                    }
                    <span className={`cf-status ${cafe.status?.toLowerCase() === 'open' ? 'open' : 'closed'}`}>
                      {cafe.status || 'Open'}
                    </span>
                    <button className="pp-wishlist" onClick={(e) => e.preventDefault()}>♡</button>
                  </div>
                  <div className="cf-card-body">
                    <h4>{cafe.name}</h4>
                    <button className="cf-menu-btn">View Menu →</button>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="pp-state">
              <p>🍽️ No cafeterias found.</p>
            </div>
          )}

        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}