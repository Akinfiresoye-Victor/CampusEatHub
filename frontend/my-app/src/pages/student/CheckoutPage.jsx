import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useCartStore } from '../../stores/useCartStore'
import { useOrderStore } from '../../stores/useOrderStore'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../AIChatBubble'
import {
  Home, ShoppingBag, UtensilsCrossed, Store, Package, Wallet,
  LogOut, Menu, Search, ShoppingCart,
  Truck, MapPin, Lock, AlertTriangle, CheckCircle
} from 'lucide-react'

export default function CheckoutPage() {
  const { user, logout } = useAuthStore()
  const { items, sellerName, isLoading: cartLoading, fetchCart } = useCartStore()
  const { checkout } = useOrderStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const DELIVERY_FEE = 200
  const deliveryType = location.state?.deliveryType || 'pickup'
  const deliveryLocation = location.state?.deliveryLocation || ''

  useEffect(() => {
    fetchCart()
  }, [])

  const subtotal = items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
  const total = deliveryType === 'delivery' ? subtotal + DELIVERY_FEE : subtotal

  const handlePlaceOrder = async () => {
    setError('')
    setPlacing(true)
    const result = await checkout(deliveryType)
    if (result.success) {
      const orderId = result.data?.id
      navigate(orderId ? `/student/orders/${orderId}` : '/student/orders', { state: { success: true } })
    } else {
      setError(result.error)
    }
    setPlacing(false)
  }

  const sidebarLinks = [
    { to: '/student/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/student/products', icon: <ShoppingBag size={20} />, label: 'All Products' },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={20} />, label: 'Cafeterias' },
    { to: '/student/vendor', icon: <Store size={20} />, label: 'My Shop' },
    { to: '/student/orders', icon: <Package size={20} />, label: 'My Orders' },
    { to: '/student/spending', icon: <Wallet size={20} />, label: 'Spending' },
  ]

  const displayItems = items || []

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
          <Link to="/student/cart" className="cm-back">← Back to Cart</Link>

          <div className="pp-header">
            <div>
              <h2>Checkout</h2>
              <p>Review your order and place it.</p>
            </div>
          </div>

          <div className="co-steps">
            <div className="co-step done"><CheckCircle size={15} /> Cart</div>
            <div className="co-step-line done" />
            <div className="co-step active">● Checkout</div>
            <div className="co-step-line" />
            <div className="co-step">○ Confirmation</div>
          </div>

          <div className="co-body">
            <div className="co-left">
              <div className="co-box">
                <h3><Package size={18} /> Order Items</h3>
                {cartLoading ? (
                  <div className="pp-state"><div className="pp-spinner" /><p>Loading cart...</p></div>
                ) : displayItems.length === 0 ? (
                  <div className="pp-state"><p>No items in cart</p></div>
                ) : displayItems.map((item) => (
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

              <div className="co-box">
                <h3><Truck size={18} /> Delivery Details</h3>
                <div className="co-delivery-info">
                  <div className="co-delivery-row">
                    <span>Delivery Type</span>
                    <span className={`co-delivery-badge ${deliveryType}`}>
                      {deliveryType === 'delivery'
                        ? <><Truck size={14} /> Delivery</>
                        : <><Store size={14} /> Pickup</>
                      }
                    </span>
                  </div>
                  {deliveryType === 'delivery' && deliveryLocation && (
                    <div className="co-delivery-row">
                      <span>Location</span>
                      <span><MapPin size={14} /> {deliveryLocation}</span>
                    </div>
                  )}
                  {deliveryType === 'delivery' && !deliveryLocation && (
                    <div className="co-delivery-row">
                      <span>Location</span>
                      <span style={{ color: '#dc2626' }}><AlertTriangle size={14} /> No location set — go back to cart</span>
                    </div>
                  )}
                  <div className="co-delivery-row">
                    <span>Seller</span>
                    <span>{sellerName || "Seller"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="co-summary">
              <h3>Order Summary</h3>
              <div className="cart-summary-row">
                <span>Subtotal</span>
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

              {error && (
                <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000', borderRadius: '10px', padding: '10px 14px', marginBottom: '15px', fontSize: '0.85rem' }}>
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              <button className="cart-checkout-btn" onClick={handlePlaceOrder} disabled={placing}>
                {placing ? 'Placing Order...' : <><CheckCircle size={16} /> Place Order</>}
              </button>
              <p className="cart-secure"><Lock size={14} /> Secure checkout</p>
              <Link to="/student/cart" className="co-back-btn">← Edit Cart</Link>
            </div>
          </div>
        </div>
      </div>

      <AIChatBubble />
    </div>
  )
}