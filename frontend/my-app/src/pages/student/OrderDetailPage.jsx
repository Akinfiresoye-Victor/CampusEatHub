import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useOrderStore } from '../../stores/useOrderStore'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../AIChatBubble'
import {
  Home, ShoppingBag, UtensilsCrossed, Store, Package, Wallet,
  LogOut, Menu, Search, ShoppingCart,
  Clock, Cog, CheckCircle, Truck, XCircle, RefreshCw, AlertTriangle
} from 'lucide-react'

const STATUS_CONFIG = {
  pending:    { bg: '#fef3c7', color: '#d97706', label: 'Pending',    icon: <Clock size={13} /> },
  processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'Processing', icon: <Cog size={13} /> },
  ready:      { bg: '#dcfce7', color: '#15803d', label: 'Ready',      icon: <CheckCircle size={13} /> },
  delivered:  { bg: '#f3f4f6', color: '#6b7280', label: 'Delivered',  icon: <Package size={13} /> },
  cancelled:  { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled',  icon: <XCircle size={13} /> },
}

export default function OrderDetailPage() {
  const { user, logout } = useAuthStore()
  const { currentOrder: order, isLoading, error, fetchOrder } = useOrderStore()
  const navigate = useNavigate()
  const { id } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchOrder(id)
    const interval = setInterval(() => {
      fetchOrder(id)
    }, 30000)

    return () => clearInterval(interval)
  }, [id])

  const sidebarLinks = [
    { to: '/student/dashboard',  icon: <Home size={20} />,           label: 'Dashboard' },
    { to: '/student/products',   icon: <ShoppingBag size={20} />,    label: 'All Products' },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={20} />, label: 'Cafeterias' },
    { to: '/student/vendor',     icon: <Store size={20} />,           label: 'My Shop' },
    { to: '/student/orders',     icon: <Package size={20} />,         label: 'My Orders', active: true },
    { to: '/student/spending',   icon: <Wallet size={20} />,          label: 'Spending' },
  ]

  const status = order ? STATUS_CONFIG[order.status] || STATUS_CONFIG.pending : null
  const subtotal = order?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0

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
        <header className="sd-topbar">
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={22} />
          </button>
          <form className="sd-search" onSubmit={(e) => e.preventDefault()}>
            <Search size={18} />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
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

          <Link to="/student/orders" className="cm-back">← Back to Orders</Link>

          {isLoading && (
            <div className="pp-state">
              <div className="pp-spinner" />
              <p>Loading order details...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="pp-state error">
              <AlertTriangle size={48} />
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && order && (
            <>
              <div className="pp-header">
                <div>
                  <h2>Order #{order.id}</h2>
                  <p>{formatDate(order.created_at)}</p>
                </div>
                <span
                  className="order-status-badge"
                  style={{ background: status?.bg, color: status?.color, fontSize: '1rem', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {status?.icon} {status?.label}
                </span>
              </div>

          <div className="co-body">
            <div className="co-left">

              {/* ITEMS */}
              <div className="co-box">
                <h3><Package size={18} /> Order Items</h3>
                {order.items?.map((item) => (
                  <div key={item.id} className="co-item">
                    <div className="co-item-img">
                      {item.image
                        ? <img src={item.image} alt={item.name} />
                        : <div className="co-img-placeholder"><UtensilsCrossed size={22} /></div>
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
                <h3><Truck size={18} /> Delivery Details</h3>
                <div className="co-delivery-info">
                  <div className="co-delivery-row">
                    <span>Seller</span>
                    <span>{order.seller_name}</span>
                  </div>
                  <div className="co-delivery-row">
                    <span>Delivery Type</span>
                    <span className={`co-delivery-badge ${order.delivery_type}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {order.delivery_type === 'delivery'
                        ? <><Truck size={13} /> Delivery</>
                        : <><Store size={13} /> Pickup</>
                      }
                    </span>
                  </div>
                  <div className="co-delivery-row">
                    <span>Status</span>
                    <span style={{ color: status.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {status.icon} {status.label}
                    </span>
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

              <div style={{ marginTop: '20px', padding: '15px', background: '#eef2ff', borderRadius: '12px', fontSize: '0.85rem', color: '#4f46e5', fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <RefreshCw size={15} /> Status updates automatically every 30 seconds
              </div>

              <Link to="/student/orders" className="co-back-btn" style={{ marginTop: '20px' }}>← Back to all orders</Link>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}