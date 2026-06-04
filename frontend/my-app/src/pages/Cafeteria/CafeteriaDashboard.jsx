import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import axiosInstance from '../../api/axiosInstance'
import { getCafeteriaOrders, getCafeteriaStatus, updateCafeteriaStatus } from '../../api/cafeteriaApi'
import { formatNaira } from '../../utils/naira'
import CafeteriaAIChatBubble from '../../components/CafeteriaAIChatBubble'
import {
  Home, UtensilsCrossed, ClipboardList, BarChart3,
  LogOut, Menu, Search,
  Bell, ShoppingBag, Wallet, ChefHat, Clock,
  CheckCircle, Package, XCircle, Layers, AlertTriangle
} from 'lucide-react'

const STATUS_CONFIG = {
  pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending', icon: <Clock size={13} /> },
  processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'Preparing', icon: <ChefHat size={13} /> },
  ready: { bg: '#dcfce7', color: '#15803d', label: 'Ready', icon: <CheckCircle size={13} /> },
  delivered: { bg: '#f3f4f6', color: '#6b7280', label: 'Delivered', icon: <Package size={13} /> },
  cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled', icon: <XCircle size={13} /> },
}

const BUSYNESS_OPTIONS = [
  { value: 'quiet', label: 'Quiet', dot: '🟢', color: '#16a34a' },
  { value: 'moderate', label: 'Moderate', dot: '🟡', color: '#ca8a04' },
  { value: 'busy', label: 'Busy', dot: '🔴', color: '#dc2626' },
]

function getBusynessBadge(status) {
  const option = BUSYNESS_OPTIONS.find((item) => item.value === status) || BUSYNESS_OPTIONS[0]
  return `${option.dot} ${option.label}`
}

export default function CafeteriaDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({ total_orders: 0, revenue_today: 0, menu_items_count: 0, pending_orders_count: 0 })
  const [topItems, setTopItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busynessStatus, setBusynessStatus] = useState('quiet')
  const [statusMessage, setStatusMessage] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    getCafeteriaStatus()
      .then((res) => {
        if (res.data.success && res.data.data?.busyness_status) {
          setBusynessStatus(res.data.data.busyness_status)
        }
      })
      .catch((err) => {
        console.error('Failed to load cafeteria status', err)
      })

    setLoading(true)
    setError(null)

    Promise.allSettled([
      getCafeteriaOrders(),
      axiosInstance.get('/api/cafeteria/stats/'),
      axiosInstance.get('/api/cafeteria/top-items/')
    ])
      .then(([ordersResult, statsResult, topItemsResult]) => {
        if (ordersResult.status === 'fulfilled') {
          const res = ordersResult.value
          const loadedOrders = res.data.success && Array.isArray(res.data.orders)
            ? res.data.orders.slice(0, 5)
            : []
          setOrders(loadedOrders)
        }

        if (statsResult.status === 'fulfilled') {
          const res = statsResult.value
          if (res.data.success && res.data.stats) {
            const raw = res.data.stats
            setStats({
              ...raw,
              revenue_today: parseFloat(raw.revenue_today) || 0,
            })
          }
        } else {
          console.error('Stats fetch failed:', statsResult.reason)
        }

        if (topItemsResult.status === 'fulfilled') {
          const res = topItemsResult.value
          if (res.data.success && Array.isArray(res.data.top_items)) {
            setTopItems(res.data.top_items)
          }
        } else {
          console.error('Top items fetch failed:', topItemsResult.reason)
        }

        setError(null)
      })
      .catch((err) => {
        console.error('Unexpected error:', err)
        setError('Failed to load dashboard data')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleStatusChange = async (status) => {
    if (statusLoading || status === busynessStatus) return
    setStatusLoading(true)
    try {
      const res = await updateCafeteriaStatus(status)
      if (res.data.success && res.data.data?.busyness_status) {
        setBusynessStatus(res.data.data.busyness_status)
        setStatusMessage('Status updated')
        setTimeout(() => setStatusMessage(''), 3000)
      }
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setStatusLoading(false)
    }
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  }

  const sidebarLinks = [
    { to: '/cafeteria/dashboard', icon: <Home size={20} />, label: 'Dashboard', active: true },
    { to: '/cafeteria/menu', icon: <UtensilsCrossed size={20} />, label: 'Menu Management' },
    { to: '/cafeteria/orders', icon: <ClipboardList size={20} />, label: 'Orders', badge: stats?.pending_orders_count || 0 },
    { to: '/cafeteria/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
  ]

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
              {sidebarOpen && link.badge > 0 && (
                <span className="sd-badge">{link.badge}</span>
              )}
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
            <input
              type="text"
              placeholder="Search orders, menu items, customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          <div className="sd-topbar-right">
            <Link to="/cafeteria/orders" className="sd-top-icon">
              <Bell size={20} />
              <small>Notifications</small>
            </Link>
            <Link to="/cafeteria/menu" className="sd-top-icon">
              <UtensilsCrossed size={20} />
              <small>My Cafeteria</small>
            </Link>
            <div className="sd-avatar">
              <span>{(user?.owner_name || user?.username || 'C')[0].toUpperCase()}</span>
              <small>Cafeteria Owner ▾</small>
            </div>
          </div>
        </header>

        <div className="sd-content">
          {/* BANNER */}
          <div className="sd-banner">
            <div className="sd-banner-text">
              <h2>Welcome back, <span>{user?.owner_name || user?.business_name || 'Cafeteria Owner'}</span> 👋</h2>
              <p>Manage your menu, orders and grow your business.</p>
              <div className="sd-banner-btns">
                <Link to="/cafeteria/menu" className="sd-banner-btn primary">
                  <UtensilsCrossed size={16} /> Add Menu Item
                </Link>
                <Link to="/cafeteria/orders" className="sd-banner-btn outline">
                  <ClipboardList size={16} /> View Orders
                </Link>
              </div>
            </div>
            <div className="sd-banner-img">
              <img src="/elizade.png" alt="EU" />
            </div>
          </div>

          <div className="caf-status-panel" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#ffffff', borderRadius: '18px', boxShadow: '0 12px 30px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Current cafeteria busyness</h3>
                <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>Set the current status so students can know how busy you are.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {BUSYNESS_OPTIONS.map((option) => {
                  const active = option.value === busynessStatus
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleStatusChange(option.value)}
                      disabled={statusLoading && !active}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '999px',
                        border: active ? '1px solid transparent' : '1px solid #e2e8f0',
                        background: active ? option.color : '#f8fafc',
                        color: active ? '#ffffff' : '#0f172a',
                        cursor: statusLoading && !active ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        minWidth: 120,
                      }}
                    >
                      {option.dot} {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
            {statusMessage && (
              <div style={{ marginTop: '0.75rem', color: '#0f766e', fontWeight: 600 }}>
                {statusMessage}
              </div>
            )}
          </div>

          {/* STATS */}
          <div className="caf-stats-grid">
            <div className="caf-stat-card purple">
              <div className="caf-stat-icon"><ShoppingBag size={24} /></div>
              <div>
                <h3>{stats.total_orders}</h3>
                <p>Total Orders</p>
                <span className="caf-stat-sub">This Week ↑ 18%</span>
              </div>
            </div>
            <div className="caf-stat-card green">
              <div className="caf-stat-icon"><Wallet size={24} /></div>
              <div>
                <h3>{formatNaira(stats.revenue_today)}</h3>
                <p>Revenue Today</p>
                <span className="caf-stat-sub">↑ 12% from yesterday</span>
              </div>
            </div>
            <div className="caf-stat-card orange">
              <div className="caf-stat-icon"><ChefHat size={24} /></div>
              <div>
                <h3>{stats.menu_items_count}</h3>
                <p>Menu Items</p>
                <span className="caf-stat-sub">Active items</span>
              </div>
            </div>
            <div className="caf-stat-card red">
              <div className="caf-stat-icon"><ClipboardList size={24} /></div>
              <div>
                <h3>{stats.pending_orders_count}</h3>
                <p>Pending Orders</p>
                <span className="caf-stat-sub" style={{ color: '#dc2626' }}>Requires attention</span>
              </div>
            </div>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div style={{ padding: '40px', textAlign: 'center', fontSize: '16px', color: '#666' }}>
              ⏳ Loading orders...
            </div>
          )}

          {/* ERROR STATE */}
          {!loading && error && (
            <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px' }}>
              ❌ Error: {error}
            </div>
          )}

          {/* BOTTOM ROW - ONLY SHOW IF NOT LOADING AND NO ERROR */}
          {!loading && !error && (
            <div className="caf-bottom-row">
              {/* RECENT ORDERS */}
              <div className="co-box" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3>Recent Orders</h3>
                  <Link to="/cafeteria/orders" className="sd-view-all">View all orders</Link>
                </div>

                {orders.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    No orders yet. Check back soon!
                  </div>
                ) : (
                  <>
                    <table className="caf-orders-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Items</th>
                          <th>Status</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending

                          return (
                            <tr key={order.id}>
                              <td><span className="caf-order-id">#{order.id}</span></td>
                              <td>
                                <div className="caf-customer">
                                  <div className="caf-customer-avatar">
                                    {(order.buyer_full_name || 'U')[0].toUpperCase()}
                                  </div>
                                  {order.buyer_full_name || 'Unknown Customer'}
                                </div>
                              </td>
                              <td className="caf-items-cell">
                                {Array.isArray(order.items) && order.items.length > 0 ? (
                                  order.items.map((item, index) => (
                                    <div key={index} style={{ marginBottom: index < order.items.length - 1 ? '4px' : '0' }}>
                                      {item.product_name || 'Unknown Item'} x{item.quantity || 1}
                                    </div>
                                  ))
                                ) : (
                                  <span>No items</span>
                                )}
                              </td>
                              <td>
                                <span
                                  className="order-status-badge"
                                  style={{ background: status.bg, color: status.color, display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {status.icon} {status.label}
                                </span>
                              </td>
                              <td className="caf-time">{timeAgo(order.created_at)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <Link to="/cafeteria/orders" className="sd-view-all-link" style={{ marginTop: '15px', display: 'block' }}>
                      View all orders →
                    </Link>
                  </>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div className="caf-right-col">
                {/* TOP SELLING */}
                <div className="co-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>Top Selling Items</h3>
                    <Link to="/cafeteria/menu" className="sd-view-all">View all menu</Link>
                  </div>
                  {topItems.length === 0 ? (
                    <div style={{ padding: '15px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                      No sales data yet
                    </div>
                  ) : (
                    topItems.map((item, i) => (
                      <div key={i} className="caf-top-item">
                        <div className="caf-top-item-img">
                          <UtensilsCrossed size={18} />
                        </div>
                        <span className="caf-top-item-name">{item.product_name}</span>
                        <span className="caf-top-item-orders">{item.total_sold} sold</span>
                      </div>
                    ))
                  )}
                </div>

                {/* REVENUE OVERVIEW */}
                <div className="co-box" style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>Revenue Overview</h3>
                    <span className="sd-view-all">View full report</span>
                  </div>
                  <div className="caf-revenue-row">
                    <div className="caf-revenue-item">
                      <small>Today</small>
                      <strong>{formatNaira(stats.revenue_today)}</strong>
                    </div>
                    <div className="caf-revenue-item">
                      <small>This Week</small>
                      <strong>{formatNaira(stats.revenue_today * 5)}</strong>
                    </div>
                    <div className="caf-revenue-item">
                      <small>This Month</small>
                      <strong>{formatNaira(stats.revenue_today * 30)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MENU OVERVIEW - SHOW EVEN IF LOADING */}
          {!loading && !error && (
            <div className="co-box" style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>Menu Overview</h3>
                <Link to="/cafeteria/menu" className="sd-view-all">Manage menu</Link>
              </div>
              <div className="caf-menu-overview">
                <div className="caf-menu-stat">
                  <Layers size={22} />
                  <strong>{stats.menu_items_count}</strong>
                  <small>All Items</small>
                </div>
                <div className="caf-menu-stat">
                  <CheckCircle size={22} />
                  <strong>16</strong>
                  <small>Available</small>
                </div>
                <div className="caf-menu-stat">
                  <XCircle size={22} />
                  <strong>2</strong>
                  <small>Out of Stock</small>
                </div>
                <div className="caf-menu-stat">
                  <AlertTriangle size={22} />
                  <strong>3</strong>
                  <small>Low Stock</small>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CafeteriaAIChatBubble />
    </div>
  )
}