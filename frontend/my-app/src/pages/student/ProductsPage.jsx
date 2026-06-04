import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useCartStore } from '../../stores/useCartStore'
import { getProducts } from '../../api/productsApi'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../../components/AIChatBubble'
import {
  Home, ShoppingBag, UtensilsCrossed, Store, Package,
  LogOut, Menu, Search, ShoppingCart,
  Star, AlertTriangle
} from 'lucide-react'

export default function ProductsPage() {
  const { user, logout } = useAuthStore()
  const { addItem, sellerLockError, clearSellerLockError, clearCart } = useCartStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addingId, setAddingId] = useState(null)
  const [toast, setToast] = useState('')
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    getProducts()
      .then((res) => {
        if (res.data.success) {
          setProducts(res.data.products || [])
        } else {
          setError(res.data.error || 'Failed to load products.')
        }
      })
      .catch(() => {
        setError('Failed to load products. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [])

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

  const handleClearAndRetry = async (productId) => {
    await clearCart()
    setCartError('')
    clearSellerLockError()
    if (productId) handleAddToCart(productId)
  }

  const sidebarLinks = [
    { to: '/student/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/student/products', icon: <ShoppingBag size={20} />, label: 'All Products', active: true },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={20} />, label: 'Cafeterias' },
    { to: '/student/vendor', icon: <Store size={20} />, label: 'My Shop' },
    { to: '/student/orders', icon: <Package size={20} />, label: 'My Orders' },
  ]

  const filteredProducts = (products || [])
    .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.id - a.id)

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
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={22} />
          </button>
          <form className="sd-search" onSubmit={(e) => e.preventDefault()}>
            <Search size={18} />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
          <div className="pp-header">
            <div>
              <h2>All Products</h2>
              <p>Discover and shop from student vendors.</p>
            </div>
            <Link to="/student/vendor" className="pp-add-btn">+ Add Product</Link>
          </div>

          {toast && <div className="pp-toast">{toast}</div>}

          {cartError && (
            <div className="pp-cart-error">
              <span><AlertTriangle size={16} /> {cartError}</span>
              <button onClick={() => handleClearAndRetry()}>Clear Cart</button>
            </div>
          )}

          <div className="pp-toolbar" style={{ marginBottom: '16px' }}>
            <span className="pp-count">Showing <b>{filteredProducts.length}</b> products</span>
          </div>

          {loading && (
            <div className="pp-state">
              <div className="pp-spinner" />
              <p>Loading products...</p>
            </div>
          )}

          {!loading && error && (
            <div className="pp-state error">
              <AlertTriangle size={32} />
              <p>{error}</p>
              <button className="pp-add-btn" onClick={() => window.location.reload()} style={{ marginTop: '10px' }}>Try Again</button>
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="pp-state">
              <ShoppingBag size={48} />
              <p>No products found.</p>
            </div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <div className="pp-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="pp-card">
                  <div className="pp-card-img">
                    {product.image_url
                      ? <img src={product.image_url} alt={product.name} />
                      : <div className="pp-img-placeholder"><ShoppingBag size={32} /></div>
                    }
                  </div>
                  <div className="pp-card-body">
                    <h4>{product.name}</h4>
                    <p className="pp-price">{formatNaira(product.price)}</p>
                    <div className="pp-card-footer">
                      <div className="pp-seller">
                        <div className="pp-seller-avatar">
                          {(product.seller_full_name || 'S')[0].toUpperCase()}
                        </div>
                        <span>{product.seller_full_name || 'Vendor'}</span>
                      </div>
                    </div>
                    <button
                      className="pp-add-cart-btn"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addingId === product.id}
                    >
                      <ShoppingCart size={15} />
                      {addingId === product.id ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}