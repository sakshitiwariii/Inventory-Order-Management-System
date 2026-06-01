import { useEffect, useState } from 'react'
import { productsApi, getErrorMessage } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'

const emptyForm = { name: '', sku: '', description: '', price: '', stock: '0' }

export default function Products() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const pageSize = 10

  useEffect(() => {
    productsApi.lowStock().then((res) => {
      if (res.data.threshold) setLowStockThreshold(res.data.threshold)
    }).catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await productsApi.list({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
      })
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, debouncedSearch])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: String(product.price),
      stock: String(product.stock),
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.sku.trim()) errs.sku = 'SKU is required'
    if (!form.price || Number(form.price) <= 0) errs.price = 'Valid price required'
    if (form.stock === '' || Number(form.stock) < 0) errs.stock = 'Stock cannot be negative'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      stock: Number(form.stock),
    }

    try {
      if (editing) {
        await productsApi.update(editing.id, payload)
      } else {
        await productsApi.create(payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setFormErrors({ submit: getErrorMessage(err) })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await productsApi.delete(id)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Products</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          Add Product
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <input
          type="search"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No products found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className={p.stock <= lowStockThreshold ? 'low-stock' : ''}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>
                      {p.stock}
                      {p.stock <= lowStockThreshold && (
                        <span className="badge badge-low" style={{ marginLeft: 6 }}>
                          Low
                        </span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                        Edit
                      </button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <Modal
          title={editing ? 'Edit Product' : 'New Product'}
          onClose={() => setModalOpen(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editing ? 'Save' : 'Create'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            {formErrors.submit && <div className="alert alert-error">{formErrors.submit}</div>}
            <div className="form-group">
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {formErrors.name && <div className="form-error">{formErrors.name}</div>}
            </div>
            <div className="form-group">
              <label>SKU</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
              {formErrors.sku && <div className="form-error">{formErrors.sku}</div>}
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                {formErrors.price && <div className="form-error">{formErrors.price}</div>}
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
                {formErrors.stock && <div className="form-error">{formErrors.stock}</div>}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
