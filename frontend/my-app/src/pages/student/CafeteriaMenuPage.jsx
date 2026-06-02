import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCafeteriaMenu } from '../../api/productsApi'
import { addToCart } from '../../api/cartApi'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../AIChatBubble'

const DUMMY_MENU = [
  { id: 1, name: 'Jollof Rice & Chicken', price: 1500, available: true, category: 'Lunch' },
  { id: 2, name: 'Fried Rice & Turkey', price: 1800, available: true, category: 'Lunch' },
  { id: 3, name: 'Pounded Yam & Egusi', price: 2000, available: false, category: 'Dinner' },
  { id: 4, name: 'Moi Moi', price: 500, available: true, category: 'Snacks' },
  { id: 5, name: 'Chapman Drink', price: 600, available: true, category: 'Beverages' },
  { id: 6, name: 'Indomie & Egg', price: 800, available: false, category: 'Breakfast' },
]

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages']

export default function CafeteriaMenuPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [menuItems, setMenuItems] = useState(DUMMY_MENU)
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [addingId, setAddingId] = useState(null)
  const [toast, setToast] = useState('')
  const [cartError, setCartError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getCafeteriaMenu(id)
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setMenuItems(res.data.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = async (productId) => {
    setAddingId(productId)
    setCartError('')
    setToast('')
    try {
      const res = await addToCart({ product_id: productId, quantity: 1 })
      if (res.data.success) {
        setToast('Added to cart! 🛒')
        setTimeout(() => setToast(''), 3000)
      } else {
        setCartError(res.data.error)
      }
    } catch (err) {
      setCartError(err.response?.data?.error || 'Failed to add to cart.')
    } finally {
      setAddingId(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarLinks = [
    { to: '/student/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/student/products', icon: '🛍️', label: 'All Products' },
    { to: '/student/cafeterias', icon: '🍽️', label: 'Cafeterias', active: true },
    { to: '/student/vendor', icon: '🏪', label: 'My Shop' },
    { to: '/student/orders', icon: '📦', label: 'My Orders' },
    { to: '/student/spending', icon: '💰', label: 'Spending' },
  ]

  const filtered = menuItems.filter((item) => {
    const matchCategory = activeCategory === 'All' || item.category === activeCategory
    const matchSearch = item.name?.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const available = filtered.filter((i) => i.available)
  const unavailable = filtered.filter((i) => !i.available)

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

        {/* TOPBAR */}
        <header className="sd-topbar">
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <form className="sd-search" onSubmit={(e) => e.preventDefault()}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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

        {/* CONTENT */}
        <div className="sd-content">

          {/* BACK */}
          <Link to="/student/cafeterias" className="cm-back">← Back to Cafeterias</Link>

          {/* HERO BANNER */}
          <div className="cm-hero">
            <div className="cm-hero-info">
              <div className="cm-hero-logo">🍽️</div>
              <div>
                <div className="cm-hero-badge">Open</div>
                <h2>Cafeteria Menu</h2>
              </div>
            </div>
            <div className="cm-hero-bg" />
          </div>

          {/* TOAST */}
          {toast && <div className="pp-toast">{toast}</div>}

          {/* CART ERROR */}
          {cartError && (
            <div className="pp-cart-error">
              <span>⚠️ {cartError}</span>
              <button onClick={async () => {
                const { clearCart } = await import('../../api/cartApi')
                await clearCart()
                setCartError('')
                setToast('Cart cleared!')
                setTimeout(() => setToast(''), 3000)
              }}>Clear Cart</button>
            </div>
          )}

          {/* CATEGORY TABS */}
          <div className="cm-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`cm-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* LOADING */}
          {loading && (
            <div className="pp-state">
              <div className="pp-spinner" />
              <p>Loading menu...</p>
            </div>
          )}

          {/* AVAILABLE ITEMS */}
          {!loading && available.length > 0 && (
            <>
              <h3 className="cm-section-title">✅ Available Now</h3>
              <div className="cm-grid">
                {available.map((item) => (
                  <div key={item.id} className="cm-card">
                    <div className="cm-card-img">
                      {item.image
                        ? <img src={item.image} alt={item.name} />
                        : <div className="cm-img-placeholder">🍛</div>
                      }
                    </div>
                    <div className="cm-card-body">
                      <h4>{item.name}</h4>
                      <p className="cm-category">{item.category}</p>
                      <p className="cm-price">{formatNaira(item.price)}</p>
                      <button
                        className="cm-add-btn"
                        onClick={() => handleAddToCart(item.id)}
                        disabled={addingId === item.id}
                      >
                        {addingId === item.id ? 'Adding...' : '+ Add'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* UNAVAILABLE ITEMS */}
          {!loading && unavailable.length > 0 && (
            <>
              <h3 className="cm-section-title">❌ Not Available Today</h3>
              <div className="cm-grid">
                {unavailable.map((item) => (
                  <div key={item.id} className="cm-card unavailable">
                    <div className="cm-card-img">
                      {item.image
                        ? <img src={item.image} alt={item.name} />
                        : <div className="cm-img-placeholder">🍛</div>
                      }
                      <div className="cm-unavailable-overlay">Not Available Today</div>
                    </div>
                    <div className="cm-card-body">
                      <h4>{item.name}</h4>
                      <p className="cm-category">{item.category}</p>
                      <p className="cm-price">{formatNaira(item.price)}</p>
                      <button className="cm-add-btn" disabled>Not Available</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* EMPTY */}
          {!loading && filtered.length === 0 && (
            <div className="pp-state">
              <p>🍽️ No menu items found.</p>
            </div>
          )}

        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}