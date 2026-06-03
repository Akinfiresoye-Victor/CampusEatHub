import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCafeteriaOrders, updateOrderStatus } from '../../api/cafeteriaApi'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../AIChatBubble'

const DUMMY_ORDERS = [
  { id: 1045, buyer_name: 'Amaka P.', items: [{ name: 'Jollof Rice', quantity: 1 }, { name: 'Chicken', quantity: 1 }], status: 'pending', delivery_type: 'pickup', total: 2500, created_at: '2026-06-03T10:50:00' },
  { id: 1044, buyer_name: 'John O.', items: [{ name: 'Burger', quantity: 1 }, { name: 'Coke', quantity: 1 }], status: 'processing', delivery_type: 'delivery', total: 1800, created_at: '2026-06-03T10:35:00' },
  { id: 1043, buyer_name: 'Blessing S.', items: [{ name: 'Fried Rice', quantity: 1 }, { name: 'Plantain', quantity: 2 }], status: 'ready', delivery_type: 'pickup', total: 2000, created_at: '2026-06-03T10:25:00' },
  { id: 1042, buyer_name: 'David R.', items: [{ name: 'Shawarma', quantity: 2 }], status: 'delivered', delivery_type: 'delivery', total: 1500, created_at: '2026-06-03T09:00:00' },
  { id: 1041, buyer_name: 'Uche C.', items: [{ name: 'Spaghetti', quantity: 1 }, { name: 'Meatball', quantity: 1 }], status: 'cancelled', delivery_type: 'pickup', total: 2200, created_at: '2026-06-03T08:00:00' },
]

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
  processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'Preparing' },
  ready: { bg: '#dcfce7', color: '#15803d', label: 'Ready' },
  delivered: { bg: '#f3f4f6', color: '#6b7280', label: 'Delivered' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
}

const TABS = ['all', 'pending', 'processing', 'ready', 'delivered']

export default function CafeteriaOrdersPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [orders, setOrders] = useState(DUMMY_ORDERS)
  const [activeTab, setActiveTab] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')

  const fetchOrders = (status) => {
    getCafeteriaOrders(status === 'all' ? null : status)
      .then((res) => {
        if (res.data.success && res.data.data?.length > 0) {
          setOrders(res.data.data)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchOrders(activeTab)
    const interval = setInterval(() => fetchOrders(activeTab), 30000)
    return () => clearInterval(interval)
  }, [activeTab])

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      const res = await updateOrderStatus(orderId, newStatus)
      if (res.data.success) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o))
        setToast(`Order #${orderId} updated to ${newStatus}!`)
        setTimeout(() => setToast(''), 3000)
      }
    } catch {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o))
      setToast(`Order #${orderId} updated!`)
      setTimeout(() => setToast(''), 3000)
    } finally {
      setUpdating(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  }

  const sidebarLinks = [
  { to: '/cafeteria/dashboard', icon: '🏠', label: 'Dashboard', active: true }, // change active per page
  { to: '/cafeteria/menu', icon: '🍴', label: 'Menu Management' },
  { to: '/cafeteria/orders', icon: '📋', label: 'Orders', badge: stats?.pending_orders || 0 },
  { to: '/cafeteria/analytics', icon: '📊', label: 'Analytics' },
]

  const filtered = activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab)

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
          <Link to="/help" className="sd-sidebar-link"><span className="sd-link-icon">❓</span>{sidebarOpen && <span className="sd-link-label">Help & Support</span>}</Link>
          <Link to="/settings" className="sd-sidebar-link"><span className="sd-link-icon">⚙️</span>{sidebarOpen && <span className="sd-link-label">Settings</span>}</Link>
          <button className="sd-sidebar-link logout" onClick={handleLogout}><span className="sd-link-icon">🚪</span>{sidebarOpen && <span className="sd-link-label">Logout</span>}</button>
        </div>
      </aside>

      <div className="sd-main">
        <header className="sd-topbar">
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <form className="sd-search" onSubmit={(e) => e.preventDefault()}>
            <span>🔍</span>
            <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="submit">Search</button>
          </form>
          <div className="sd-topbar-right">
            <Link to="/cafeteria/menu" className="sd-top-icon"><span>🍴</span><small>My Cafeteria</small></Link>
            <div className="sd-avatar">
              <span>{(user?.full_name || 'C')[0].toUpperCase()}</span>
              <small>Cafeteria Owner ▾</small>
            </div>
          </div>
        </header>

        <div className="sd-content">
          {toast && <div className="pp-toast">{toast}</div>}

          <div className="pp-header">
            <div>
              <h2>📋 Orders</h2>
              <p>Manage and update your incoming orders.</p>
            </div>
          </div>

          {/* TABS */}
          <div className="cm-tabs" style={{ marginBottom: '20px' }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`cm-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* EMPTY */}
          {filtered.length === 0 && (
            <div className="pp-state">
              <p>📋 No {activeTab === 'all' ? '' : activeTab} orders found.</p>
            </div>
          )}

          {/* ORDERS */}
          <div className="caf-orders-list">
            {filtered.map((order) => {
              const status = STATUS_COLORS[order.status] || STATUS_COLORS.pending
              const items = Array.isArray(order.items)
                ? order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
                : order.items || 'N/A'

              return (
                <div key={order.id} className="caf-order-card">
                  <div className="caf-order-card-top">
                    <div className="caf-order-card-left">
                      <div className="caf-customer">
                        <div className="caf-customer-avatar">
                          {(order.buyer_name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <strong>{order.buyer_name}</strong>
                          <small>#{order.id} • {timeAgo(order.created_at)}</small>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="order-status-badge" style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                      <strong style={{ color: '#4f46e5' }}>{formatNaira(order.total)}</strong>
                    </div>
                  </div>

                  <div className="caf-order-card-body">
                    <p><span>🍛 Items:</span> {items}</p>
                    <p><span>{order.delivery_type === 'delivery' ? '🚚' : '🏪'} Type:</span> {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}</p>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="caf-order-actions">
                    {order.status === 'pending' && (
                      <>
                        <button
                          className="caf-action-btn processing"
                          onClick={() => handleStatusUpdate(order.id, 'processing')}
                          disabled={updating === order.id}
                        >
                          ⚙️ Start Processing
                        </button>
                        <button
                          className="caf-action-btn cancel"
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          disabled={updating === order.id}
                        >
                          ❌ Cancel Order
                        </button>
                      </>
                    )}
                    {order.status === 'processing' && order.delivery_type === 'pickup' && (
                      <button
                        className="caf-action-btn ready"
                        onClick={() => handleStatusUpdate(order.id, 'ready')}
                        disabled={updating === order.id}
                      >
                        ✅ Mark as Ready
                      </button>
                    )}
                    {order.status === 'processing' && order.delivery_type === 'delivery' && (
                      <button
                        className="caf-action-btn delivered"
                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                        disabled={updating === order.id}
                      >
                        📦 Mark as Delivered
                      </button>
                    )}
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