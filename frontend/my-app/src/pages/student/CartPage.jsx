import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCart, updateCartItem, removeCartItem, clearCart } from '../../api/cartApi'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../AIChatBubble'
import {
  Home, ShoppingBag, UtensilsCrossed, Store, Package, Wallet,
  CircleHelp, Settings, LogOut, Menu, Search, ShoppingCart,
  Trash2, MapPin, Lock
} from 'lucide-react'

const DUMMY_CART = {
  items: [
    { id: 1, product_id: 1, name: 'Jollof Rice & Chicken', category: 'Lunch', seller_name: "Mama Nkechi's Kitchen", price: 1500, quantity: 1, image: null, available: true },
    { id: 2, product_id: 2, name: 'Chapman Drink', category: 'Beverages', seller_name: "Mama Nkechi's Kitchen", price: 600, quantity: 2, image: null, available: true },
    { id: 3, product_id: 3, name: 'Moi Moi', category: 'Snacks', seller_name: "Mama Nkechi's Kitchen", price: 500, quantity: 1, image: null, available: true },
  ],
  seller_name: "Mama Nkechi's Kitchen",
}

export default function CartPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [cart, setCart] = useState(DUMMY_CART)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [deliveryType, setDeliveryType] = useState('pickup')
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')

  const DELIVERY_FEE = 200

  useEffect(() => {
    setLoading(true)
    getCart()
      .then((res) => {
        if (res.data.success && res.data.data?.items?.length > 0) setCart(res.data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = deliveryType === 'delivery' ? subtotal + DELIVERY_FEE : subtotal

  const handleQuantity = async (itemId, newQty) => {
    if (newQty < 1) return handleRemove(itemId)
    setUpdatingId(itemId)
    try {
      const res = await updateCartItem(itemId, { quantity: newQty })
      if (res.data.success) {
        setCart((prev) => ({ ...prev, items: prev.items.map((i) => i.id === itemId ? { ...i, quantity: newQty } : i) }))
      }
    } catch {
      setCart((prev) => ({ ...prev, items: prev.items.map((i) => i.id === itemId ? { ...i, quantity: newQty } : i) }))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemove = async (itemId) => {
    setUpdatingId(itemId)
    try { await removeCartItem(itemId) } catch {}
    setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }))
    setUpdatingId(null)
  }

  const handleClearCart = async () => {
    try { await clearCart() } catch {}
    setCart({ items: [], seller_name: '' })
    setToast('Cart cleared!')
    setTimeout(() => setToast(''), 3000)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarLinks = [
    { to: '/student/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/student/products', icon: <ShoppingBag size={20} />, label: 'All Products' },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={20} />, label: 'Cafeterias' },
    { to: '/student/vendor', icon: <Store size={20} />, label: 'My Shop' },
    { to: '/student/orders', icon: <Package size={20} />, label: 'My Orders' },
    { to: '/student/spending', icon: <Wallet size={20} />, label: 'Spending' },
  ]

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

      <div className="sd-main">
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

        <div className="sd-content">
          {toast && <div className="pp-toast">{toast}</div>}

          <div className="pp-header">
            <div>
              <h2>Your Cart <ShoppingCart size={22} /> <span className="cart-count-badge">{cart.items.length}</span></h2>
              <p>Review your items and proceed to checkout.</p>
            </div>
            <Link to="/student/products" className="cart-continue-btn">← Continue Shopping</Link>
          </div>

          {cart.items.length === 0 && (
            <div className="pp-state">
              <ShoppingCart size={52} />
              <p>Your cart is empty.</p>
              <Link to="/student/products" className="pp-add-btn" style={{ marginTop: '15px' }}>Browse Products</Link>
            </div>
          )}

          {cart.items.length > 0 && (
            <div className="cart-body">
              <div className="cart-items-section">
                {cart.seller_name && (
                  <div className="cart-seller-info">
                    <Store size={16} /> Ordering from: <strong>{cart.seller_name}</strong>
                    <button className="cart-clear-btn" onClick={handleClearCart}>
                      <Trash2 size={15} /> Clear Cart
                    </button>
                  </div>
                )}

                <div className="cart-table-header">
                  <span style={{ flex: 2 }}>Items</span>
                  <span>Price</span>
                  <span>Quantity</span>
                  <span>Total</span>
                  <span></span>
                </div>

                {cart.items.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-img">
                        {item.image
                          ? <img src={item.image} alt={item.name} />
                          : <div className="cart-img-placeholder"><UtensilsCrossed size={24} /></div>
                        }
                      </div>
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <p>{item.category}</p>
                        <p>Seller: {item.seller_name}</p>
                        <span className="cart-in-stock">In Stock</span>
                      </div>
                    </div>
                    <span className="cart-item-price">{formatNaira(item.price)}</span>
                    <div className="cart-qty">
                      <button onClick={() => handleQuantity(item.id, item.quantity - 1)} disabled={updatingId === item.id}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleQuantity(item.id, item.quantity + 1)} disabled={updatingId === item.id}>+</button>
                    </div>
                    <span className="cart-item-total">{formatNaira(item.price * item.quantity)}</span>
                    <button className="cart-remove-btn" onClick={() => handleRemove(item.id)} disabled={updatingId === item.id}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <h3>Order Summary</h3>
                <div className="cart-summary-row">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Delivery Fee</span>
                  <span>{deliveryType === 'delivery' ? formatNaira(DELIVERY_FEE) : 'Free'}</span>
                </div>
                <div className="cart-summary-total">
                  <span>Total</span>
                  <span>{formatNaira(total)}</span>
                </div>

                <h4 className="cart-summary-label">Delivery / Pickup</h4>

                <div className={`cart-delivery-option ${deliveryType === 'delivery' ? 'selected' : ''}`} onClick={() => setDeliveryType('delivery')}>
                  <input type="radio" checked={deliveryType === 'delivery'} onChange={() => setDeliveryType('delivery')} />
                  <div>
                    <strong>Delivery</strong>
                    <small>Delivered to your campus address</small>
                  </div>
                  <span>{formatNaira(DELIVERY_FEE)}</span>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="cart-location-wrap">
                    <label><MapPin size={14} /> Delivery Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Block B, Room 204, Hostel 3"
                      className="cart-location-input"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                    />
                  </div>
                )}

                <div className={`cart-delivery-option ${deliveryType === 'pickup' ? 'selected' : ''}`} onClick={() => setDeliveryType('pickup')}>
                  <input type="radio" checked={deliveryType === 'pickup'} onChange={() => setDeliveryType('pickup')} />
                  <div>
                    <strong>Pickup</strong>
                    <small>Pick up from cafeteria</small>
                  </div>
                  <span className="cart-free">Free</span>
                </div>

                <button className="cart-checkout-btn" onClick={() => navigate('/student/checkout', { state: { deliveryType, deliveryLocation, total } })}>
                  Proceed to Checkout →
                </button>
                <p className="cart-secure"><Lock size={14} /> Secure checkout</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}