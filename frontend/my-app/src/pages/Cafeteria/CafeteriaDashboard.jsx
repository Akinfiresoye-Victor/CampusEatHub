import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCafeteriaOrders } from '../../api/cafeteriaApi'
import { formatNaira } from '../../utils/naira'
import CafeteriaAIChatBubble from '../../components/CafeteriaAIChatBubble'
import {
  Home, UtensilsCrossed, ClipboardList, BarChart3,
  CircleHelp, Settings, LogOut, Menu, Search,
  Bell, ShoppingBag, Wallet, ChefHat, Clock,
  CheckCircle, Package, XCircle, Layers, AlertTriangle
} from 'lucide-react'

const DUMMY_STATS = {
  total_orders: 125,
  revenue_today: 45000,
  menu_items: 18,
  pending_orders: 7,
}

const DUMMY_ORDERS = [
  { id: 1045, buyer_name: 'Amaka P.', items: 'Jollof Rice, Chicken', status: 'pending', delivery_type: 'pickup', total: 2500, created_at: '2026-06-03T10:50:00' },
  { id: 1044, buyer_name: 'John O.', items: 'Burger, Coke', status: 'processing', delivery_type: 'delivery', total: 1800, created_at: '2026-06-03T10:35:00' },
  { id: 1043, buyer_name: 'Blessing S.', items: 'Fried Rice, Plantain', status: 'ready', delivery_type: 'pickup', total: 2000, created_at: '2026-06-03T10:25:00' },
  { id: 1042, buyer_name: 'David R.', items: 'Shawarma', status: 'delivered', delivery_type: 'delivery', total: 1500, created_at: '2026-06-03T09:00:00' },
  { id: 1041, buyer_name: 'Uche C.', items: 'Spaghetti, Meatball', status: 'delivered', delivery_type: 'pickup', total: 2200, created_at: '2026-06-03T08:00:00' },
]

const DUMMY_TOP_ITEMS = [
  { name: 'Jollof Rice & Chicken', orders: 45, image: null },
  { name: 'Chicken Burger', orders: 38, image: null },
  { name: 'Fried Rice', orders: 32, image: null },
  { name: 'Shawarma', orders: 28, image: null },
  { name: 'Moi Moi', orders: 20, image: null },
]

const STATUS_CONFIG = {
  pending:    { bg: '#fef3c7', color: '#d97706', label: 'Pending',    icon: <Clock size={13} /> },
  processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'Preparing',  icon: <ChefHat size={13} /> },
  ready:      { bg: '#dcfce7', color: '#15803d', label: 'Ready',      icon: <CheckCircle size={13} /> },
  delivered:  { bg: '#f3f4f6', color: '#6b7280', label: 'Delivered',  icon: <Package size={13} /> },
  cancelled:  { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled',  icon: <XCircle size={13} /> },
}

export default function CafeteriaDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [orders, setOrders] = useState(DUMMY_ORDERS)
  const [stats, setStats] = useState(DUMMY_STATS)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getCafeteriaOrders()
      .then((res) => {
        if (res.data.success && res.data.data?.length > 0) {
          setOrders(res.data.data.slice(0, 5))
        }
      })
      .catch(() => {})
  }, [])

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
    { to: '/cafeteria/dashboard',  icon: <Home size={20} />,          label: 'Dashboard', active: true },
    { to: '/cafeteria/menu',       icon: <UtensilsCrossed size={20} />, label: 'Menu Management' },
    { to: '/cafeteria/orders',     icon: <ClipboardList size={20} />,  label: 'Orders', badge: stats?.pending_orders || 0 },
    { to: '/cafeteria/analytics',  icon: <BarChart3 size={20} />,      label: 'Analytics' },
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
              <span>{(user?.full_name || user?.username || 'C')[0].toUpperCase()}</span>
              <small>Cafeteria Owner ▾</small>
            </div>
          </div>
        </header>

        <div className="sd-content">

          {/* BANNER */}
          <div className="sd-banner">
            <div className="sd-banner-text">
              <h2>Welcome back, <span>{user?.full_name || user?.business_name || 'Cafeteria Owner'}</span> 👋</h2>
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
                <h3>{stats.menu_items}</h3>
                <p>Menu Items</p>
                <span className="caf-stat-sub">Active items</span>
              </div>
            </div>
            <div className="caf-stat-card red">
              <div className="caf-stat-icon"><ClipboardList size={24} /></div>
              <div>
                <h3>{stats.pending_orders}</h3>
                <p>Pending Orders</p>
                <span className="caf-stat-sub" style={{ color: '#dc2626' }}>Requires attention</span>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="caf-bottom-row">

            {/* RECENT ORDERS */}
            <div className="co-box" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3>Recent Orders</h3>
                <Link to="/cafeteria/orders" className="sd-view-all">View all orders</Link>
              </div>

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
                              {(order.buyer_name || 'U')[0].toUpperCase()}
                            </div>
                            {order.buyer_name}
                          </div>
                        </td>
                        <td className="caf-items-cell">{order.items || 'N/A'}</td>
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
            </div>

            {/* RIGHT COLUMN */}
            <div className="caf-right-col">

              {/* TOP SELLING */}
              <div className="co-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3>Top Selling Items</h3>
                  <Link to="/cafeteria/menu" className="sd-view-all">View all menu</Link>
                </div>
                {DUMMY_TOP_ITEMS.map((item, i) => (
                  <div key={i} className="caf-top-item">
                    <div className="caf-top-item-img">
                      {item.image
                        ? <img src={item.image} alt={item.name} />
                        : <UtensilsCrossed size={18} />
                      }
                    </div>
                    <span className="caf-top-item-name">{item.name}</span>
                    <span className="caf-top-item-orders">{item.orders} orders</span>
                  </div>
                ))}
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
                    <strong>{formatNaira(45000)}</strong>
                  </div>
                  <div className="caf-revenue-item">
                    <small>This Week</small>
                    <strong>{formatNaira(220000)}</strong>
                  </div>
                  <div className="caf-revenue-item">
                    <small>This Month</small>
                    <strong>{formatNaira(850000)}</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* MENU OVERVIEW */}
          <div className="co-box" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Menu Overview</h3>
              <Link to="/cafeteria/menu" className="sd-view-all">Manage menu</Link>
            </div>
            <div className="caf-menu-overview">
              <div className="caf-menu-stat">
                <Layers size={22} />
                <strong>{stats.menu_items}</strong>
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

        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}