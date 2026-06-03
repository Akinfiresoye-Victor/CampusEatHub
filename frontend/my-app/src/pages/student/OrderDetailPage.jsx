import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getOrder } from '../../api/ordersApi'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../AIChatBubble'

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', color: '#d97706', label: '⏳ Pending' },
  processing: { bg: '#dbeafe', color: '#1d4ed8', label: '⚙️ Processing' },
  ready: { bg: '#dcfce7', color: '#15803d', label: '✅ Ready' },
  delivered: { bg: '#f3f4f6', color: '#6b7280', label: '📦 Delivered' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', label: '❌ Cancelled' },
}

const DUMMY_ORDER = {
  id: 1,
  seller_name: "Mama Nkechi's Kitchen",
  created_at: '2026-06-03T10:00:00',
  total: 3200,
  delivery_type: 'pickup',
  status: 'pending',
  delivery_fee: 0,
  items: [
    { id: 1, name: 'Jollof Rice & Chicken', category: 'Lunch', price: 1500, quantity: 1 },
    { id: 2, name: 'Chapman Drink', category: 'Beverages', price: 600, quantity: 2 },
    { id: 3, name: 'Moi Moi', category: 'Snacks', price: 500, quantity: 1 },
  ]
}

export default function OrderDetailPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [order, setOrder] = useState(DUMMY_ORDER)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getOrder(id)
      .then((res) => {
        if (res.data.success) setOrder(res.data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    const interval = setInterval(() => {
      getOrder(id)
        .then((res) => {
          if (res.data.success) setOrder(res.data.data)
        })
        .catch(() => {})
    }, 30000)

    return () => clearInterval(interval)
  }, [id])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarLinks = [
    { to: '/student/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/student/products', icon: '🛍️', label: 'All Products' },
    { to: '/student/cafeterias', icon: '🍽️', label: 'Cafeterias' },
    { to: '/student/vendor', icon: '🏪', label: 'My Shop' },
    { to: '/student/orders', icon: '📦', label: 'My Orders', active: true },
    { to: '/student/spending', icon: '💰', label: 'Spending' },
  ]

  const status = STATUS_COLORS[order.status] || STATUS_COLORS.pending
  const subtotal = order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

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
        <header className="sd-topbar">
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <form className="sd-search" onSubmit={(e) => e.preventDefault()}>
            <span>🔍</span>
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
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

        <div className="sd-content">

          <Link to="/student/orders" className="cm-back">← Back to Orders</Link>

          <div className="pp-header">
            <div>
              <h2>Order #{order.id}</h2>
              <p>{formatDate(order.created_at)}</p>
            </div>
            <span
              className="order-status-badge"
              style={{ background: status.bg, color: status.color, fontSize: '1rem', padding: '8px 18px' }}
            >
              {status.label}
            </span>
          </div>

          <div className="co-body">
            <div className="co-left">

              {/* ITEMS */}
              <div className="co-box">
                <h3>📦 Order Items</h3>
                {order.items?.map((item) => (
                  <div key={item.id} className="co-item">
                    <div className="co-item-img">
                      {item.image
                        ? <img src={item.image} alt={item.name} />
                        : <div className="co-img-placeholder">🍛</div>
                      }
                    </div>
                    <div className="co-item-info">
                      <h4>{item.name}</h4>
                      <p>{item.category}</p>
                    </div>
                    <div className="co-item-right">
                      <span className="co-item-qty">x{item.quantity}</span>
                      <span className="co-item-price">{formatNaira(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DELIVERY */}
              <div className="co-box">
                <h3>🚚 Delivery Details</h3>
                <div className="co-delivery-info">
                  <div className="co-delivery-row">
                    <span>Seller</span>
                    <span>{order.seller_name}</span>
                  </div>
                  <div className="co-delivery-row">
                    <span>Delivery Type</span>
                    <span className={`co-delivery-badge ${order.delivery_type}`}>
                      {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                    </span>
                  </div>
                  <div className="co-delivery-row">
                    <span>Status</span>
                    <span style={{ color: status.color, fontWeight: 700 }}>{status.label}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* SUMMARY */}
            <div className="co-summary">
              <h3>Order Summary</h3>
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>{formatNaira(subtotal)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Delivery Fee</span>
                <span>{order.delivery_fee ? formatNaira(order.delivery_fee) : 'Free'}</span>
              </div>
              <div className="cart-summary-total">
                <span>Total</span>
                <span>{formatNaira(order.total)}</span>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', background: '#eef2ff', borderRadius: '12px', fontSize: '0.85rem', color: '#4f46e5', fontWeight: 600, textAlign: 'center' }}>
                🔄 Status updates automatically every 30 seconds
              </div>

              <Link to="/student/orders" className="co-back-btn" style={{ marginTop: '20px' }}>← Back to all orders</Link>
            </div>
          </div>
        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}