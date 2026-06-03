import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getVendorProducts, addVendorProduct, updateVendorProduct,
  toggleVendorProduct, deleteVendorProduct
} from '../../api/vendorApi'
import { formatNaira } from '../../utils/naira'
import AIChatBubble from '../AIChatBubble'
import {
  Home, ShoppingBag, UtensilsCrossed, Store, Package, Wallet,
  CircleHelp, Settings, LogOut, Menu, Search, ShoppingCart,
  Pencil, Trash2, CheckCircle, XCircle, Folder, ImageIcon
} from 'lucide-react'

const DUMMY_PRODUCTS = [
  { id: 1, name: 'Calculus Textbook', price: 5000, available: true, image: null, category: 'Books' },
  { id: 2, name: 'Scientific Calculator', price: 3500, available: true, image: null, category: 'Electronics' },
  { id: 3, name: 'Lecture Notes Bundle', price: 1500, available: false, image: null, category: 'Books' },
]

export default function VendorPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [products, setProducts] = useState(DUMMY_PRODUCTS)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [toast, setToast] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const fileRef = useRef()

  const [form, setForm] = useState({ name: '', price: '', category: '', image: null })

  useEffect(() => {
    setLoading(true)
    getVendorProducts()
      .then((res) => {
        if (res.data.success && res.data.data?.length > 0) setProducts(res.data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const openAddModal = () => {
    setEditProduct(null)
    setForm({ name: '', price: '', category: '', image: null })
    setShowModal(true)
  }

  const openEditModal = (product) => {
    setEditProduct(product)
    setForm({ name: product.name, price: product.price, category: product.category || '', image: null })
    setShowModal(true)
  }

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = new FormData()
      data.append('name', form.name)
      data.append('price', form.price)
      data.append('category', form.category)
      if (fileRef.current?.files[0]) data.append('image', fileRef.current.files[0])

      if (editProduct) {
        const res = await updateVendorProduct(editProduct.id, data)
        if (res.data.success) {
          setProducts((prev) => prev.map((p) => p.id === editProduct.id ? res.data.data : p))
          showToast('Product updated!')
        }
      } else {
        const res = await addVendorProduct(data)
        if (res.data.success) {
          setProducts((prev) => [...prev, res.data.data])
          showToast('Product added!')
        }
      }
      setShowModal(false)
    } catch {
      const dummyProduct = { id: Date.now(), name: form.name, price: Number(form.price), category: form.category, available: true, image: null }
      if (editProduct) {
        setProducts((prev) => prev.map((p) => p.id === editProduct.id ? { ...p, ...dummyProduct, id: p.id } : p))
        showToast('Product updated!')
      } else {
        setProducts((prev) => [...prev, dummyProduct])
        showToast('Product added!')
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (product) => {
    setToggling(product.id)
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, available: !p.available } : p))
    try { await toggleVendorProduct(product.id) }
    catch { setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, available: product.available } : p)) }
    finally { setToggling(null) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    setDeleting(id)
    try { await deleteVendorProduct(id) } catch {}
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setDeleting(null)
    showToast('Product deleted.')
  }

  const handleLogout = async () => { await logout(); navigate('/login') }

  const sidebarLinks = [
    { to: '/student/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/student/products', icon: <ShoppingBag size={20} />, label: 'All Products' },
    { to: '/student/cafeterias', icon: <UtensilsCrossed size={20} />, label: 'Cafeterias' },
    { to: '/student/vendor', icon: <Store size={20} />, label: 'My Shop', active: true },
    { to: '/student/orders', icon: <Package size={20} />, label: 'My Orders' },
    { to: '/student/spending', icon: <Wallet size={20} />, label: 'Spending' },
  ]

  const filtered = products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))

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
            <input type="text" placeholder="Search your products..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <h2><Store size={22} /> My Shop</h2>
              <p>Manage your product listings.</p>
            </div>
            <button className="pp-add-btn" onClick={openAddModal}>+ Add Product</button>
          </div>

          <div className="vendor-stats">
            <div className="vendor-stat">
              <Package size={22} />
              <div><strong>{products.length}</strong><small>Total Products</small></div>
            </div>
            <div className="vendor-stat">
              <CheckCircle size={22} />
              <div><strong>{products.filter(p => p.available).length}</strong><small>Available</small></div>
            </div>
            <div className="vendor-stat">
              <XCircle size={22} />
              <div><strong>{products.filter(p => !p.available).length}</strong><small>Unavailable</small></div>
            </div>
          </div>

          {loading && <div className="pp-state"><div className="pp-spinner" /><p>Loading...</p></div>}

          {!loading && filtered.length === 0 && (
            <div className="pp-state">
              <Store size={52} />
              <p>No products yet. Add your first product!</p>
              <button className="pp-add-btn" onClick={openAddModal} style={{ marginTop: '15px' }}>+ Add Product</button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="vendor-grid">
              {filtered.map((product) => (
                <div key={product.id} className={`vendor-card ${!product.available ? 'unavailable' : ''}`}>
                  <div className="vendor-card-img">
                    {product.image
                      ? <img src={product.image} alt={product.name} />
                      : <div className="vendor-img-placeholder"><ShoppingBag size={32} /></div>
                    }
                    <span className={`vendor-badge ${product.available ? 'available' : 'unavailable'}`}>
                      {product.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="vendor-card-body">
                    <h4>{product.name}</h4>
                    <p>{product.category || 'General'}</p>
                    <strong>{formatNaira(product.price)}</strong>
                    <div className="vendor-actions">
                      <button
                        className={`vendor-toggle ${product.available ? 'on' : 'off'}`}
                        onClick={() => handleToggle(product)}
                        disabled={toggling === product.id}
                      >
                        {product.available
                          ? <><CheckCircle size={15} /> Available</>
                          : <><XCircle size={15} /> Unavailable</>
                        }
                      </button>
                      <div className="vendor-btn-row">
                        <button className="vendor-edit-btn" onClick={() => openEditModal(product)}>
                          <Pencil size={15} /> Edit
                        </button>
                        <button className="vendor-delete-btn" onClick={() => handleDelete(product.id)} disabled={deleting === product.id}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editProduct ? <><Pencil size={16} /> Edit Product</> : '+ Add New Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <label>Product Name</label>
              <div className="input-group">
                <span className="icon"><ShoppingBag size={18} /></span>
                <input type="text" name="name" placeholder="Product name" value={form.name} onChange={handleFormChange} required />
              </div>

              <label>Price (₦)</label>
              <div className="input-group">
                <span className="icon"><Wallet size={18} /></span>
                <input type="number" name="price" placeholder="e.g. 5000" value={form.price} onChange={handleFormChange} required />
              </div>

              <label>Category</label>
              <div className="input-group">
                <span className="icon"><Folder size={18} /></span>
                <input type="text" name="category" placeholder="e.g. Books, Electronics" value={form.category} onChange={handleFormChange} />
              </div>

              <label>Image</label>
              <div className="input-group">
                <span className="icon"><ImageIcon size={18} /></span>
                <input type="file" accept="image/*" ref={fileRef} />
              </div>

              <button type="submit" className="submit-btn" disabled={saving}>
                {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      <AIChatBubble />
    </div>
  )
}