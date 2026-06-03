import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getSpending } from '../../api/ordersApi'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../AIChatBubble'
import {
  Home, ShoppingBag, UtensilsCrossed, Store, Package, Wallet,
  CircleHelp, Settings, LogOut, Menu, Search, ShoppingCart,
  CreditCard, BarChart3
} from 'lucide-react'

const DUMMY_SPENDING = {
  total_spent: 45200,
  total_orders: 12,
  breakdown: [
    { seller_name: "Mama Nkechi's Kitchen", total: 28500 },
    { seller_name: "Campus Bites", total: 12700 },
    { seller_name: "Student Vendor - Alex", total: 4000 },
  ]
}

export default function SpendingPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [spending, setSpending] = useState(DUMMY_SPENDING)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getSpending()
      .then((res) => { if (res.data.success) setSpending(res.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarLinks = [
    { to: '/student/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/student/products', icon: <ShoppingBag size={20} />, label: 'All Products' },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={20} />, label: 'Cafeterias' },
    { to: '/student/vendor', icon: <Store size={20} />, label: 'My Shop' },
    { to: '/student/orders', icon: <Package size={20} />, label: 'My Orders' },
    { to: '/student/spending', icon: <Wallet size={20} />, label: 'Spending', active: true },
  ]

  const sorted = [...(spending.breakdown || [])].sort((a, b) => b.total - a.total)

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
          <Link to="/help" className="sd-sidebar-link">
            <span className="sd-link-icon"><CircleHelp size={20} /></span>
            {sidebarOpen && <span className="sd-link-label">Help & Support</span>}
          </Link>
          <Link to="/settings" className="sd-sidebar-link">
            <span className="sd-link-icon"><Settings size={20} /></span>
            {sidebarOpen && <span className="sd-link-label">Settings</span>}
          </Link>
          <button className="sd-sidebar-link logout" onClick={handleLogout}>
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
            <Link to="/student/spending" className="sd-top-icon"><Wallet size={20} /><small>Spending</small></Link>
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
              <h2>Spending History</h2>
              <p>Track where your money goes on campus.</p>
            </div>
          </div>

          <div className="sp-stats-row">
            <div className="sp-stat-card">
              <div className="sp-stat-icon"><Wallet size={24} /></div>
              <div>
                <h3>{formatNaira(spending.total_spent)}</h3>
                <p>Total Spent</p>
              </div>
            </div>
            <div className="sp-stat-card">
              <div className="sp-stat-icon"><Package size={24} /></div>
              <div>
                <h3>{spending.total_orders}</h3>
                <p>Total Orders</p>
              </div>
            </div>
            <div className="sp-stat-card">
              <div className="sp-stat-icon"><BarChart3 size={24} /></div>
              <div>
                <h3>{spending.total_orders > 0 ? formatNaira(Math.round(spending.total_spent / spending.total_orders)) : '₦0'}</h3>
                <p>Avg. Per Order</p>
              </div>
            </div>
          </div>

          <div className="co-box" style={{ marginTop: '25px' }}>
            <h3><CreditCard size={18} /> Spending by Seller</h3>

            {sorted.length === 0 && (
              <div className="pp-state"><p>No spending data yet.</p></div>
            )}

            {sorted.map((item, index) => {
              const percent = spending.total_spent > 0
                ? Math.round((item.total / spending.total_spent) * 100)
                : 0
              return (
                <div key={index} className="sp-breakdown-item">
                  <div className="sp-breakdown-header">
                    <div className="sp-seller-info">
                      <div className="sp-seller-avatar">{item.seller_name[0].toUpperCase()}</div>
                      <span>{item.seller_name}</span>
                    </div>
                    <div className="sp-breakdown-right">
                      <strong>{formatNaira(item.total)}</strong>
                      <span className="sp-percent">{percent}%</span>
                    </div>
                  </div>
                  <div className="sp-bar-track">
                    <div className="sp-bar-fill" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}