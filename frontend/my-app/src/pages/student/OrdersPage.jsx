import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useOrderStore } from '../../stores/useOrderStore'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../AIChatBubble'
import {
  Home, ShoppingBag, UtensilsCrossed, Store, Package, Wallet,
  LogOut, Menu, Search, ShoppingCart,
  Clock, Cog, CheckCircle, Truck, XCircle, PartyPopper, AlertTriangle
} from 'lucide-react'

const STATUS_CONFIG = {
  pending:    { bg: '#fef3c7', color: '#d97706', label: 'Pending',    icon: <Clock size={13} /> },
  processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'Processing', icon: <Cog size={13} /> },
  ready:      { bg: '#dcfce7', color: '#15803d', label: 'Ready',      icon: <CheckCircle size={13} /> },
  delivered:  { bg: '#f3f4f6', color: '#6b7280', label: 'Delivered',  icon: <Package size={13} /> },
  cancelled:  { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled',  icon: <XCircle size={13} /> },
}

export default function OrdersPage() {
  const { user, logout } = useAuthStore()
  const { orders, isLoading, error, fetchOrders } = useOrderStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [successMsg, setSuccessMsg] = useState(location.state?.success ? 'Your order has been placed!' : '')

  useEffect(() => {
    fetchOrders()

    const interval = setInterval(() => {
      fetchOrders()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 5000)
      return () => clearTimeout(t)
    }
  }, [successMsg])

  const sidebarLinks = [
    { to: '/student/dashboard',  icon: <Home size={20} />,          label: 'Dashboard' },
    { to: '/student/products',   icon: <ShoppingBag size={20} />,   label: 'All Products' },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={20} />, label: 'Cafeterias' },
    { to: '/student/vendor',     icon: <Store size={20} />,          label: 'My Shop' },
    { to: '/student/orders',     icon: <Package size={20} />,        label: 'My Orders', active: true },
    { to: '/student/spending',   icon: <Wallet size={20} />,         label: 'Spending' },
  ]

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="sd-layout">

      {/* SIDEBAR */}
      <aside className={`sd-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sd-sidebar-logo">
          <img src="/elizade.png" alt="logo" />
          {sidebarOpen && <span>Byte<b>N</b>Bite</span>}
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

      {/* MAIN */}
      <div className="sd-main">

        {/* TOPBAR */}
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

        {/* CONTENT */}
        <div className="sd-content">

          {/* SUCCESS */}
          {successMsg && (
            <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PartyPopper size={18} /> {successMsg}
            </div>
          )}

          {/* HEADER */}
          <div className="pp-header">
            <div>
              <h2>My Orders</h2>
              <p>Track and manage all your orders.</p>
            </div>
          </div>

          {isLoading && (
            <div className="pp-state">
              <div className="pp-spinner" />
              <p>Loading orders...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="pp-state error">
              <AlertTriangle size={48} />
              <p>{error}</p>
            </div>
          )}

          {/* EMPTY */}
          {!isLoading && !error && orders.length === 0 && (
            <div className="pp-state">
              <Package size={52} />
              <p>No orders yet.</p>
              <Link to="/student/cafeterias" className="pp-add-btn" style={{ marginTop: '15px' }}>Browse Cafeterias</Link>
            </div>
          )}

          {/* ORDERS LIST */}
          {!isLoading && !error && orders.length > 0 && (
            <div className="orders-list">
              {orders.map((order) => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                return (
                  <Link to={`/student/orders/${order.id}`} key={order.id} className="order-card">
                    <div className="order-card-left">
                      <div className="order-icon"><Package size={22} /></div>
                      <div className="order-info">
                        <h4>{order.seller_name}</h4>
                        <p>{formatDate(order.created_at)}</p>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {order.delivery_type === 'delivery'
                            ? <><Truck size={13} /> Delivery</>
                            : <><Store size={13} /> Pickup</>
                          }
                        </p>
                      </div>
                    </div>
                    <div className="order-card-right">
                      <span
                        className="order-status-badge"
                        style={{ background: status.bg, color: status.color, display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {status.icon} {status.label}
                      </span>
                      <strong className="order-total">{formatNaira(order.total)}</strong>
                      <span className="order-arrow">›</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}