import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useCafeteriaStore } from '../../stores/useCafeteriaStore'
import { formatNaira } from '../../utils/naira'
import CafeteriaAIChatBubble from '../../components/CafeteriaAIChatBubble'
import {
  Home, UtensilsCrossed, ClipboardList, BarChart3,
  LogOut, Menu, Search, AlertTriangle, CheckCircle, Package
} from 'lucide-react'

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
  processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'Preparing' },
  ready: { bg: '#dcfce7', color: '#15803d', label: 'Ready' },
  delivered: { bg: '#f3f4f6', color: '#6b7280', label: 'Delivered' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
}

const TABS = ['all', 'pending', 'processing', 'ready', 'delivered']

export default function CafeteriaOrdersPage() {
  const { user, logout } = useAuthStore()
  const { orders, isLoading, error, fetchOrders, updateOrderStatus } = useCafeteriaStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchOrders(activeTab)
    const interval = setInterval(() => fetchOrders(activeTab), 30000)
    return () => clearInterval(interval)
  }, [activeTab])

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId)
    const result = await updateOrderStatus(orderId, newStatus)
    if (result.success) {
      setToast(`Order #${orderId} updated to ${newStatus}!`)
      setTimeout(() => setToast(''), 3000)
    } else {
      setToast(result.error || `Failed to update order #${orderId}`)
      setTimeout(() => setToast(''), 3000)
    }
    setUpdating(null)
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
    { to: '/cafeteria/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/cafeteria/menu', icon: <UtensilsCrossed size={20} />, label: 'Menu Management' },
    { to: '/cafeteria/orders', icon: <ClipboardList size={20} />, label: 'Orders', active: true },
    { to: '/cafeteria/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
  ]

  const filtered = activeTab === 'all' ? (orders || []) : (orders || []).filter((o) => o.status === activeTab)

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
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <form className="sd-search" onSubmit={(e) => e.preventDefault()}>
            <span>🔍</span>
            <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="submit">Search</button>
          </form>
          <div className="sd-topbar-right">
            <Link to="/cafeteria/menu" className="sd-top-icon"><span>🍴</span><small>My Cafeteria</small></Link>
            <div className="sd-avatar">
              <span>{(user?.owner_name || 'C')[0].toUpperCase()}</span>
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
          {!isLoading && !error && filtered.length === 0 && (
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
                           ⚙️ Mark as Preparing
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
                     {order.status === 'processing' && (
                       <button
                         className="caf-action-btn ready"
                         onClick={() => handleStatusUpdate(order.id, 'ready')}
                         disabled={updating === order.id}
                       >
                         ✅ Mark as Ready
                       </button>
                     )}
                     {order.status === 'ready' && (
                       <button
                         className="caf-action-btn delivered"
                         onClick={() => handleStatusUpdate(order.id, 'delivered')}
                         disabled={updating === order.id}
                       >
                         📦 Mark as Delivered
                       </button>
                     )}
                     {order.status === 'delivered' && (
                       <span className="order-status-badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                         Delivered
                       </span>
                     )}
                   </div>
                 </div>
              )
            })}
          </div>
        </div>
      </div>

      <CafeteriaAIChatBubble />
    </div>
  )
}