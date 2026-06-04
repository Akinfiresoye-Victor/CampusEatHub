import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import AIChatBubble from '../../components/AIChatBubble'

import {
  Home,
  ShoppingBag,
  UtensilsCrossed,
  Store,
  Package,
  Wallet,
  LogOut,
  Search,
  Menu,
  ShoppingCart,
  Clock3,
  ChartColumn
} from 'lucide-react'

export default function StudentDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/student/products?search=${search}`)
  }

  const sidebarLinks = [
    { to: '/student/dashboard', icon: <Home size={20} />, label: 'Dashboard', active: true },
    { to: '/student/products', icon: <ShoppingBag size={20} />, label: 'All Products' },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={20} />, label: 'Cafeterias' },
    { to: '/student/vendor', icon: <Store size={20} />, label: 'My Shop' },
    { to: '/student/orders', icon: <Package size={20} />, label: 'My Orders' },
  ]

  const quickCards = [
    { to: '/student/products', icon: <ShoppingBag size={24} />, label: 'Browse Products', desc: 'Shop from student vendors', color: '#eef2ff', iconBg: '#4f46e5' },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={24} />, label: 'Cafeterias', desc: 'View cafeteria menus', color: '#f0fdf4', iconBg: '#16a34a' },
    { to: '/student/cart', icon: <ShoppingCart size={24} />, label: 'My Cart', desc: 'View your cart items', color: '#fff7ed', iconBg: '#ea580c' },
    { to: '/student/orders', icon: <Package size={24} />, label: 'My Orders', desc: 'Track your orders', color: '#fdf2f8', iconBg: '#db2777' },
  ]

  return (
    <div className="sd-layout">

      {/* SIDEBAR */}
      <aside className={`sd-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sd-sidebar-logo">
          <img src="/elizade.png" alt="logo" />
          {sidebarOpen && <span>Campus<b></b>Connect</span>}
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

      {/* MAIN AREA */}
      <div className="sd-main">

        {/* TOP NAVBAR */}
        <header className="sd-topbar">
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={22} />
          </button>

          <form className="sd-search" onSubmit={handleSearch}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search products, cafeterias and more..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="sd-topbar-right">
            <Link to="/student/orders" className="sd-top-icon">
              <Package size={20} />
              <small>Orders</small>
            </Link>
            <Link to="/student/cart" className="sd-top-icon">
              <ShoppingCart size={20} />
              <small>Cart</small>
            </Link>
            <div className="sd-avatar">
              <span>{(user?.full_name || user?.username || 'S')[0].toUpperCase()}</span>
              <small>{user?.full_name || user?.username || 'Student'} ▾</small>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="sd-content">

          {/* WELCOME BANNER */}
          <div className="sd-banner">
            <div className="sd-banner-text">
              <h2>Welcome back, <span>{user?.full_name || user?.username || 'Student'}</span> 👋</h2>
              <p>What would you like to eat or buy today?</p>
              <div className="sd-banner-btns">
                <Link to="/student/cafeterias" className="sd-banner-btn primary">
                  <UtensilsCrossed size={18} />
                  Browse Cafeterias
                </Link>
              </div>
            </div>
            <div className="sd-banner-img">
              <img src="/elizade.png" alt="EU" />
            </div>
          </div>

          {/* QUICK ACCESS */}
          <div className="sd-section-header">
            <h3>Quick Access</h3>
            <Link to="/student/products" className="sd-view-all">View all →</Link>
          </div>

          <div className="sd-quick-grid">
            {quickCards.map((card) => (
              <Link to={card.to} key={card.to} className="sd-quick-card" style={{ background: card.color }}>
                <div className="sd-quick-icon" style={{ background: card.iconBg + '22' }}>
                  {card.icon}
                </div>
                <div className="sd-quick-text">
                  <h4>{card.label}</h4>
                  <p>{card.desc}</p>
                </div>
                <span className="sd-quick-arrow" style={{ color: card.iconBg }}>›</span>
              </Link>
            ))}
          </div>

          {/* BOTTOM ROW */}
          <div className="sd-bottom-row">

            {/* Recent Activity */}
            <div className="sd-box">
              <div className="sd-box-header">
                <h3><Clock3 size={18} /> Recent Activity</h3>
              </div>
              <div className="sd-activity-list">
                <div className="sd-activity-item">
                  <div className="sd-activity-icon green">🛒</div>
                  <div className="sd-activity-text">
                    <strong>Browse cafeterias</strong>
                    <small>Discover available menus today</small>
                  </div>
                  <Link to="/student/cafeterias" className="sd-activity-time" style={{ color: '#4f46e5', fontSize: '0.75rem' }}>Go →</Link>
                </div>
              </div>
              <Link to="/student/orders" className="sd-view-all-link">View all orders →</Link>
            </div>

            {/* Quick Stats */}
            <div className="sd-box">
              <div className="sd-box-header">
                <h3><ChartColumn size={18} /> Quick Stats</h3>
              </div>
              <div className="sd-stats-grid">
                <div className="sd-stat-card blue">
                  <span className="sd-stat-icon">🛍️</span>
                  <Link to="/student/orders"><strong>My Orders</strong></Link>
                  <small>Track status</small>
                </div>

                <div className="sd-stat-card orange">
                  <span className="sd-stat-icon">🏪</span>
                  <Link to="/student/vendor"><strong>My Shop</strong></Link>
                  <small>Manage products</small>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* AI CHATBOT BUBBLE */}
      <AIChatBubble />

    </div>
  )
}