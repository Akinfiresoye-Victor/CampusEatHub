import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import {
  getCafeteriaMenu,
  addMenuItem,
  updateMenuItem,
  toggleMenuItem,
  deleteMenuItem
} from '../../api/cafeteriaApi'
import { formatNaira } from '../../utils/naira'
import CafeteriaAIChatBubble from '../../components/CafeteriaAIChatBubble'
import {
  Home, UtensilsCrossed, ClipboardList, BarChart3,
  LogOut, Menu, Search, CheckCircle, XCircle
} from 'lucide-react'

export default function CafeteriaMenuPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [toast, setToast] = useState('')
  const [toggling, setToggling] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const fileRef = useRef()

  const [form, setForm] = useState({ name: '', price: '' })

  useEffect(() => {
    setLoading(true)
    getCafeteriaMenu()
      .then((res) => {
        if (res.data.success && res.data.products) {
          const mapped = (res.data.products || []).map((item) => ({
            ...item,
            available: item.is_available,
            image: item.image_url,
          }))
          setMenuItems(mapped)
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const openAddModal = () => {
    setEditItem(null)
    setForm({ name: '', price: '' })
    setShowModal(true)
  }

  const openEditModal = (item) => {
    setEditItem(item)
    setForm({ name: item.name, price: item.price })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = new FormData()
      data.append('name', form.name)
      data.append('price', form.price)

      if (fileRef.current?.files[0]) {
        data.append('image', fileRef.current.files[0])
      }

      if (editItem) {
        const res = await updateMenuItem(editItem.id, data)
        if (res.data.success) {
          const mappedProd = {
            ...res.data.product,
            available: res.data.product.is_available,
            image: res.data.product.image_url,
          }
          setMenuItems((prev) => prev.map((i) => i.id === editItem.id ? mappedProd : i))
          showToast('Menu item updated!')
          setShowModal(false)
        } else {
          showToast(res.data.error || 'Failed to update item.')
        }
      } else {
        const res = await addMenuItem(data)
        if (res.data.success) {
          const mappedProd = {
            ...res.data.product,
            available: res.data.product.is_available,
            image: res.data.product.image_url,
          }
          setMenuItems((prev) => [...prev, mappedProd])
          showToast('Menu item added!')
          setShowModal(false)
        } else {
          showToast(res.data.error || 'Failed to add item.')
        }
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save item.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (item) => {
    setToggling(item.id)
    setMenuItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: !i.available } : i))
    try {
      await toggleMenuItem(item.id)
    } catch {
      setMenuItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: item.available } : i))
      showToast('Failed to update availability.')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this menu item?')) return
    setDeleting(id)
    try { await deleteMenuItem(id) } catch { }
    setMenuItems((prev) => prev.filter((i) => i.id !== id))
    setDeleting(null)
    showToast('Item deleted.')
  }

  const sidebarLinks = [
    { to: '/cafeteria/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/cafeteria/menu', icon: <UtensilsCrossed size={20} />, label: 'Menu Management', active: true },
    { to: '/cafeteria/orders', icon: <ClipboardList size={20} />, label: 'Orders' },
    { to: '/cafeteria/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
  ]

  const filtered = (menuItems || []).filter((i) =>
    i.name?.toLowerCase().includes(search.toLowerCase())
  )

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
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <form className="sd-search" onSubmit={(e) => e.preventDefault()}>
            <span>🔍</span>
            <input type="text" placeholder="Search menu items..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="submit">Search</button>
          </form>
          <div className="sd-topbar-right">
            <Link to="/cafeteria/orders" className="sd-top-icon"><span>📋</span><small>Orders</small></Link>
            <div className="sd-avatar">
              <span>{(user?.owner_name || 'C')[0].toUpperCase()}</span>
              <small>Cafeteria Owner ▾</small>
            </div>
          </div>
        </header>

        <div className="sd-content">
          {toast && <div className="pp-toast">{toast}</div>}

          <div className="pp-header">
            <div>
              <h2>🍴 Menu Management</h2>
              <p>Add, edit, and manage your menu items.</p>
            </div>
            <button className="pp-add-btn" onClick={openAddModal}>+ Add Menu Item</button>
          </div>

          {/* STATS */}
          <div className="vendor-stats">
            <div className="vendor-stat">
              <span>🗂️</span>
              <div><strong>{menuItems.length}</strong><small>Total Items</small></div>
            </div>
            <div className="cm-stat">
              <CheckCircle size={22} />
              <div><strong>{(menuItems || []).filter(i => i.available).length}</strong><small>Available</small></div>
            </div>
            <div className="cm-stat">
              <XCircle size={22} />
              <div><strong>{(menuItems || []).filter(i => !i.available).length}</strong><small>Unavailable</small></div>
            </div>
          </div>

          {loading && <div className="pp-state"><div className="pp-spinner" /><p>Loading menu...</p></div>}

          {!loading && (
            <div className="vendor-grid">
              {filtered.map((item) => (
                <div key={item.id} className={`vendor-card ${!item.available ? 'unavailable' : ''}`}>
                  <div className="vendor-card-img">
                    {item.image
                      ? <img src={item.image} alt={item.name} />
                      : <div className="vendor-img-placeholder">🍛</div>
                    }
                    <span className={`vendor-badge ${item.available ? 'available' : 'unavailable'}`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="vendor-card-body">
                    <h4>{item.name}</h4>

                    <strong>{formatNaira(item.price)}</strong>
                    <div className="vendor-actions">
                      <button
                        className={`vendor-toggle ${item.available ? 'on' : 'off'}`}
                        onClick={() => handleToggle(item)}
                        disabled={toggling === item.id}
                      >
                        {item.available ? '✅ Available' : '❌ Unavailable'}
                      </button>
                      <div className="vendor-btn-row">
                        <button className="vendor-edit-btn" onClick={() => openEditModal(item)}>✏️ Edit</button>
                        <button
                          className="vendor-delete-btn"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                        >🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? '✏️ Edit Menu Item' : '+ Add Menu Item'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <label>Item Name</label>
              <div className="input-group">
                <span className="icon">🍛</span>
                <input type="text" name="name" placeholder="e.g. Jollof Rice & Chicken" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <label>Price (₦)</label>
              <div className="input-group">
                <span className="icon">💰</span>
                <input type="number" name="price" placeholder="e.g. 1500" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>

              <label>Image</label>
              <div className="input-group">
                <span className="icon">🖼️</span>
                <input type="file" accept="image/*" ref={fileRef} />
              </div>
              <button type="submit" className="submit-btn" disabled={saving}>
                {saving ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}
              </button>
            </form>
          </div>
        </div>
      )}

      <CafeteriaAIChatBubble />
    </div>
  )
}