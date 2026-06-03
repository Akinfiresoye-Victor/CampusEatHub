import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useCartStore } from '../../stores/useCartStore'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../AIChatBubble'
import {
  Home, ShoppingBag, UtensilsCrossed, Store, Package, Wallet,
  CircleHelp, Settings, LogOut, Menu, Search, ShoppingCart,
  Trash2, Lock, AlertTriangle
} from 'lucide-react'

export default function CartPage() {
  const { user, logout } = useAuthStore()
  const { items, sellerName, sellerLockError, isLoading, fetchCart, updateItem, removeItem, clearCart, clearSellerLockError } = useCartStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [deliveryType, setDeliveryType] = useState('pickup')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')

  const DELIVERY_FEE = 200

  useEffect(() => {
    fetchCart()
  }, [])

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = deliveryType === 'delivery' ? subtotal + DELIVERY_FEE : subtotal

  const handleQuantity = async (itemId, newQty) => {
    if (newQty < 1) return handleRemove(itemId)
    setUpdatingId(itemId)
    await updateItem(itemId, newQty)
    setUpdatingId(null)
  }

  const handleRemove = async (itemId) => {
    setUpdatingId(itemId)
    await removeItem(itemId)
    setUpdatingId(null)
  }

  const handleClearCart = async () => {
    await clearCart()
    setToast('Cart cleared!')
    setTimeout(() => setToast(''), 3000)
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

          {/* Seller lock error */}
          {sellerLockError && (
            <div className="pp-cart-error">
              <span><AlertTriangle size={16} /> {sellerLockError}</span>
              <button onClick={async () => {
                await handleClearCart()
                clearSellerLockError()
              }}>Clear Cart</button>
            </div>
          )}

          <div className="pp-header">
            <div>
              <h2>Your Cart <ShoppingCart size={22} /> <span className="cart-count-badge">{items.length}</span></h2>
              <p>Review your items and proceed to checkout.</p>
            </div>
            <Link to="/student/cafeterias" className="cart-continue-btn">← Continue Shopping</Link>
          </div>

          {isLoading && (
            <div className="pp-state">
              <div className="pp-spinner" />
              <p>Loading your cart...</p>
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="pp-state">
              <ShoppingCart size={52} />
              <p>Your cart is empty.</p>
              <Link to="/student/cafeterias" className="pp-add-btn" style={{ marginTop: '15px' }}>Browse Cafeterias</Link>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <div className="cart-body">
              <div className="cart-items-section">
                {sellerName && (
                  <div className="cart-seller-info">
                    <Store size={16} /> Ordering from: <strong>{sellerName}</strong>
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

                {items.map((item) => (
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
                  <span>Subtotal ({items.length} items)</span>
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

                <div className={`cart-delivery-option ${deliveryType === 'pickup' ? 'selected' : ''}`} onClick={() => setDeliveryType('pickup')}>
                  <input type="radio" checked={deliveryType === 'pickup'} onChange={() => setDeliveryType('pickup')} />
                  <div>
                    <strong>Pickup</strong>
                    <small>Pick up from cafeteria</small>
                  </div>
                  <span className="cart-free">Free</span>
                </div>

                <button
                  className="cart-checkout-btn"
                  onClick={() => navigate('/student/checkout', { state: { deliveryType, total } })}
                >
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