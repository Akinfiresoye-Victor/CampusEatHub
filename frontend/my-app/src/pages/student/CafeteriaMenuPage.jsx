import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useCartStore } from '../../stores/useCartStore'
import { getCafeteriaMenu } from '../../api/productsApi'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../../components/AIChatBubble'

const BUSYNESS_BADGES = {
  quiet: { label: 'Quiet', dot: '🟢', bg: '#dcfce7', color: '#166534' },
  moderate: { label: 'Moderate', dot: '🟡', bg: '#fef3c7', color: '#92400e' },
  busy: { label: 'Busy now', dot: '🔴', bg: '#fee2e2', color: '#991b1b' },
}

function getBusynessBadge(status) {
  return BUSYNESS_BADGES[status] || BUSYNESS_BADGES.quiet
}
import {
  Home, ShoppingBag, UtensilsCrossed, Store, Package, Wallet,
  LogOut, Menu, Search, ShoppingCart,
  CheckCircle, XCircle, AlertTriangle
} from 'lucide-react'


export default function CafeteriaMenuPage() {
  const { user, logout } = useAuthStore()
  const { addItem, sellerLockError, clearSellerLockError, clearCart } = useCartStore()
  const navigate = useNavigate()
  const { id } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [menuItems, setMenuItems] = useState([])
  const [cafeteriaName, setCafeteriaName] = useState('')
  const [busynessStatus, setBusynessStatus] = useState('quiet')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addingId, setAddingId] = useState(null)
  const [toast, setToast] = useState('')
  const [cartError, setCartError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getCafeteriaMenu(id)
      .then((res) => {
        if (res.data.success) {
          const mapped = (res.data.products || []).map((item) => ({
            ...item,
            available: item.is_available,
            image: item.image_url,
          }))
          setMenuItems(mapped)
          if (res.data.cafeteria?.business_name) setCafeteriaName(res.data.cafeteria.business_name)
          if (res.data.cafeteria?.busyness_status) setBusynessStatus(res.data.cafeteria.busyness_status)
        } else {
          setError(res.data.error || 'Failed to load menu.')
        }
      })
      .catch(() => {
        setError('Failed to load menu. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = async (productId) => {
    setAddingId(productId)
    setCartError('')
    setToast('')
    const result = await addItem(productId, 1)
    if (result.success) {
      setToast('Added to cart! 🛒')
      setTimeout(() => setToast(''), 3000)
    } else {
      setCartError(result.error || 'Failed to add to cart.')
    }
    setAddingId(null)
  }

  const handleClearCart = async () => {
    await clearCart()
    clearSellerLockError()
    setCartError('')
    setToast('Cart cleared!')
    setTimeout(() => setToast(''), 3000)
  }

  const sidebarLinks = [
    { to: '/student/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/student/products', icon: <ShoppingBag size={20} />, label: 'All Products' },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={20} />, label: 'Cafeterias', active: true },
    { to: '/student/vendor', icon: <Store size={20} />, label: 'My Shop' },
    { to: '/student/orders', icon: <Package size={20} />, label: 'My Orders' },
  ]

  const filtered = (menuItems || []).filter((item) => {
    return item.name?.toLowerCase().includes(search.toLowerCase())
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
            <input type="text" placeholder="Search menu items..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="submit">Search</button>
          </form>
          <div className="sd-topbar-right">
            <Link to="/student/orders" className="sd-top-icon"><Package size={20} /><small>Orders</small></Link>
            <Link to="/student/cart" className="sd-top-icon"><ShoppingCart size={20} /><small>Cart</small></Link>
            <div className="sd-avatar">
              <span>{(user?.full_name || user?.username || 'S')[0].toUpperCase()}</span>
              <small>{user?.full_name || user?.username || 'Student'} ▾</small>
            </div>
          </div>
        </header>

        <div className="sd-content">
          <Link to="/student/cafeterias" className="cm-back">← Back to Cafeterias</Link>

          <div className="cm-hero">
            <div className="cm-hero-info">
              <div className="cm-hero-logo"><UtensilsCrossed size={32} /></div>
              <div>
                {(() => {
                  const badge = getBusynessBadge(busynessStatus)
                  return (
                    <div className="cm-hero-badge" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}` }}>
                      {badge.dot} {badge.label}
                    </div>
                  )
                })()}
                <h2>{cafeteriaName || 'Cafeteria Menu'}</h2>
              </div>
            </div>
            <div className="cm-hero-bg" />
          </div>

          {toast && <div className="pp-toast">{toast}</div>}

          {cartError && (
            <div className="pp-cart-error">
              <span><AlertTriangle size={16} /> {cartError}</span>
              <button onClick={handleClearCart}>Clear Cart</button>
            </div>
          )}



          {loading && (
            <div className="pp-state">
              <div className="pp-spinner" />
              <p>Loading menu...</p>
            </div>
          )}

          {!loading && error && (
            <div className="pp-state error">
              <AlertTriangle size={48} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && available.length > 0 && (
            <>
              <h3 className="cm-section-title"><CheckCircle size={18} /> Available Now</h3>
              <div className="cm-grid">
                {available.map((item) => (
                  <div key={item.id} className="cm-card">
                    <div className="cm-card-img">
                      {item.image
                        ? <img src={item.image} alt={item.name} />
                        : <div className="cm-img-placeholder"><UtensilsCrossed size={32} /></div>
                      }
                    </div>
                    <div className="cm-card-body">
                      <h4>{item.name}</h4>

                      <p className="cm-price">{formatNaira(item.price)}</p>
                      <button className="cm-add-btn" onClick={() => handleAddToCart(item.id)} disabled={addingId === item.id}>
                        {addingId === item.id ? 'Adding...' : '+ Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && unavailable.length > 0 && (
            <>
              <h3 className="cm-section-title" style={{ color: '#6b7280' }}><XCircle size={18} /> Not Available Today</h3>
              <div className="cm-grid">
                {unavailable.map((item) => (
                  <div key={item.id} className="cm-card unavailable">
                    <div className="cm-card-img">
                      {item.image
                        ? <img src={item.image} alt={item.name} style={{ opacity: 0.5 }} />
                        : <div className="cm-img-placeholder"><UtensilsCrossed size={32} /></div>
                      }
                      <div className="cm-unavailable-overlay">Not Available Today</div>
                    </div>
                    <div className="cm-card-body">
                      <h4>{item.name}</h4>

                      <p className="cm-price">{formatNaira(item.price)}</p>
                      <button className="cm-add-btn" disabled>Not Available</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="pp-state">
              <UtensilsCrossed size={48} />
              <p>No menu items found.</p>
            </div>
          )}
        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}