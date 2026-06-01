import { useEffect, useState } from 'react'
import { customersApi, getErrorMessage } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'

const emptyForm = { name: '', email: '', phone: '', address: '' }

export default function Customers() {
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
  const pageSize = 10

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await customersApi.list({
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

  const openEdit = (customer) => {
    setEditing(customer)
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
    }

    try {
      if (editing) {
        await customersApi.update(editing.id, payload)
      } else {
        await customersApi.create(payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setFormErrors({ submit: getErrorMessage(err) })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return
    try {
      await customersApi.delete(id)
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          Add Customer
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <input
          type="search"
          placeholder="Search by name or email..."
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
          <div className="empty-state">No customers found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>
                        Edit
                      </button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
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
          title={editing ? 'Edit Customer' : 'New Customer'}
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
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {formErrors.email && <div className="form-error">{formErrors.email}</div>}
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
