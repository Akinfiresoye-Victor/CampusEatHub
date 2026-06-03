import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useCartStore } from '../../stores/useCartStore'
import { getProducts } from '../../api/productsApi'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../AIChatBubble'
import {
  Home, ShoppingBag, UtensilsCrossed, Store, Package, Wallet,
  LogOut, Menu, Search, ShoppingCart,
  Heart, Star, AlertTriangle
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
  const [activeCategories, setActiveCategories] = useState(['All Categories'])
  const [sort, setSort] = useState('Newest First')

  useEffect(() => {
    getProducts()
      .then((res) => {
        if (res.data.success) {
          setProducts(res.data.data)
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

  const handleSearch = (e) => e.preventDefault()

  const toggleCategory = (cat) => {
    if (cat === 'All Categories') {
      setActiveCategories(['All Categories'])
    } else {
      const without = activeCategories.filter(c => c !== 'All Categories')
      if (without.includes(cat)) {
        const next = without.filter(c => c !== cat)
        setActiveCategories(next.length === 0 ? ['All Categories'] : next)
      } else {
        setActiveCategories([...without, cat])
      }
    }
  }

  const clearFilters = () => {
    setActiveCategories(['All Categories'])
  }

  const sidebarLinks = [
    { to: '/student/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/student/products', icon: <ShoppingBag size={20} />, label: 'All Products', active: true },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={20} />, label: 'Cafeterias' },
    { to: '/student/vendor', icon: <Store size={20} />, label: 'My Shop' },
    { to: '/student/orders', icon: <Package size={20} />, label: 'My Orders' },
    { to: '/student/spending', icon: <Wallet size={20} />, label: 'Spending' },
  ]

  const filteredProducts = products
    .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => activeCategories.includes('All Categories') || activeCategories.includes(p.category))
    .sort((a, b) => {
      if (sort === 'Price: Low to High') return a.price - b.price
      if (sort === 'Price: High to Low') return b.price - a.price
      return b.id - a.id
    })

  return (
    <div className="sd-layout">

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

      <div className="sd-main">
        <header className="sd-topbar">
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={22} />
          </button>
          <form className="sd-search" onSubmit={handleSearch}>
            <Search size={18} />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
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

          <div className="pp-body">
            <aside className="pp-filters">
              <div className="pp-filter-header">
                <h3>Filters</h3>
                <button className="pp-clear-btn" onClick={clearFilters}>Clear all</button>
              </div>
              <div className="pp-filter-section">
                <h4>Category <span>▲</span></h4>
                {['All Categories', 'Books & Notes', 'Electronics', 'Stationery', 'Clothing', 'Food', 'Others'].map((cat) => (
                  <label key={cat} className="pp-checkbox">
                    <input
                      type="checkbox"
                      checked={activeCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </aside>

            <div className="pp-products-area">
              <div className="pp-toolbar">
                <span className="pp-count">Showing <b>{filteredProducts.length}</b> products</span>
                <select className="pp-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option>Newest First</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
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
                        {product.image
                          ? <img src={product.image} alt={product.name} />
                          : <div className="pp-img-placeholder"><ShoppingBag size={32} /></div>
                        }
                        {product.condition && (
                          <span className={`pp-badge pp-badge-${product.condition?.toLowerCase().replace(' ', '-')}`}>
                            {product.condition}
                          </span>
                        )}
                      </div>
                      <div className="pp-card-body">
                        <h4>{product.name}</h4>
                        <p className="pp-category">{product.category || 'General'}</p>
                        <p className="pp-price">{formatNaira(product.price)}</p>
                        <div className="pp-card-footer">
                          <div className="pp-seller">
                            <div className="pp-seller-avatar">
                              {(product.seller_name || 'S')[0].toUpperCase()}
                            </div>
                            <span>{product.seller_name || 'Vendor'}</span>
                          </div>
                          {product.rating && (
                            <span className="pp-rating"><Star size={13} /> {product.rating}</span>
                          )}
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
        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}