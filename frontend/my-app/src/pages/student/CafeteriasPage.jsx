import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { getCafeterias } from '../../api/productsApi'
import AIChatBubble from '../../components/AIChatBubble'

const BUSYNESS_BADGES = {
  quiet: { label: 'Quiet', dot: '🟢', bg: '#dcfce7', color: '#166534' },
  moderate: { label: 'Moderate', dot: '🟡', bg: '#fef3c7', color: '#92400e' },
  busy: { label: 'Busy now', dot: '🔴', bg: '#fee2e2', color: '#991b1b' },
}

function getBusynessBadge(status) {
  return BUSYNESS_BADGES[status] || BUSYNESS_BADGES.quiet
}
import {
  Home, ShoppingBag, UtensilsCrossed, Store, Package, Wallet,
  LogOut, Menu, Search, ShoppingCart, AlertTriangle
} from 'lucide-react'

export default function CafeteriasPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [cafeterias, setCafeterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getCafeterias()
      .then((res) => {
        if (res.data.success) {
          setCafeterias(res.data.cafeterias || [])
        } else {
          setError(res.data.error || 'Failed to load cafeterias.')
        }
      })
      .catch(() => setError('Failed to load cafeterias. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const sidebarLinks = [
    { to: '/student/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/student/products', icon: <ShoppingBag size={20} />, label: 'All Products' },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={20} />, label: 'Cafeterias', active: true },
    { to: '/student/vendor', icon: <Store size={20} />, label: 'My Shop' },
    { to: '/student/orders', icon: <Package size={20} />, label: 'My Orders' },
  ]

  const filtered = (cafeterias || []).filter((c) => c.business_name?.toLowerCase().includes(search.toLowerCase()) || c.owner_name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="sd-layout">

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
          <button className="sd-sidebar-link logout" onClick={() => logout()}>
            <span className="sd-link-icon"><LogOut size={20} /></span>
            {sidebarOpen && <span className="sd-link-label">Logout</span>}
          </button>
        </div>
      </aside>

      <div className="sd-main">
        <header className="sd-topbar">
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={22} />
          </button>
          <form className="sd-search" onSubmit={(e) => e.preventDefault()}>
            <Search size={18} />
            <input type="text" placeholder="Search products, cafeterias and more..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="submit">Search</button>
          </form>
          <div className="sd-topbar-right">
            <Link to="/student/orders" className="sd-top-icon"><Package size={20} /><small>Orders</small></Link>
            <Link to="/student/cart" className="sd-top-icon"><ShoppingCart size={20} /><small>Cart</small></Link>
            <div className="sd-avatar">
              <span>{(user?.full_name || user?.username || 'S')[0].toUpperCase()}</span>
              <small>{user?.full_name || user?.username || 'Student'} ▾</small>
            </div>
          </div>
        </header>

        <div className="sd-content">
          <div className="pp-header">
            <div>
              <h2>Cafeterias</h2>
              <p>Explore cafeterias across campus and discover menus.</p>
            </div>
          </div>

          <div className="cf-search-wrap">
            <Search size={18} />
            <input type="text" placeholder="Search cafeterias..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <p className="cf-count">Showing <b>{filtered.length}</b> cafeterias</p>

          {loading && (
            <div className="pp-state">
              <div className="pp-spinner" />
              <p>Loading cafeterias...</p>
            </div>
          )}

          {!loading && error && (
            <div className="pp-state error">
              <AlertTriangle size={48} />
              <p>{error}</p>
              <button className="pp-add-btn" onClick={() => window.location.reload()} style={{ marginTop: '10px' }}>Try Again</button>
            </div>
          )}

          {!loading && !error && (
            <div className="cf-grid">
              {filtered.map((cafe) => (
                <Link to={`/student/cafeteria/${cafe.id}`} key={cafe.id} className="cf-card">
                  <div className="cf-card-img">
                    {cafe.logo
                      ? <img src={cafe.logo} alt={cafe.business_name || 'Cafeteria'} />
                      : <div className="cf-img-placeholder"><UtensilsCrossed size={36} /></div>
                    }
                    {(() => {
                      const badge = getBusynessBadge(cafe.busyness_status)
                      return (
                        <span className="cf-status" style={{ background: badge.bg, color: badge.color, borderColor: badge.color }}>
                          {badge.dot} {badge.label}
                        </span>
                      )
                    })()}
                  </div>
                  <div className="cf-card-body">
                    <h4>{cafe.business_name || cafe.owner_name || 'Cafeteria'}</h4>
                    <button className="cf-menu-btn">View Menu →</button>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="pp-state">
              <UtensilsCrossed size={48} />
              <p>No cafeterias found.</p>
            </div>
          )}
        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}