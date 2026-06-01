import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { customersApi, productsApi, ordersApi, getErrorMessage } from '../services/api'

export default function CreateOrder() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [lines, setLines] = useState([{ product_id: '', quantity: 1 }])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [custRes, prodRes] = await Promise.all([
          customersApi.list({ page: 1, page_size: 100 }),
          productsApi.list({ page: 1, page_size: 100 }),
        ])
        setCustomers(custRes.data.items)
        setProducts(prodRes.data.items)
      } catch (err) {
        setError(getErrorMessage(err))
      }
    }
    load()
  }, [])

  const addLine = () => {
    setLines([...lines, { product_id: '', quantity: 1 }])
  }

  const removeLine = (idx) => {
    if (lines.length === 1) return
    setLines(lines.filter((_, i) => i !== idx))
  }

  const updateLine = (idx, field, value) => {
    const next = [...lines]
    next[idx] = { ...next[idx], [field]: value }
    setLines(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!customerId) {
      setError('Select a customer')
      return
    }

    const items = lines
      .filter((l) => l.product_id)
      .map((l) => ({
        product_id: Number(l.product_id),
        quantity: Number(l.quantity),
      }))

    if (items.length === 0) {
      setError('Add at least one product')
      return
    }

    for (const item of items) {
      if (!item.quantity || item.quantity < 1) {
        setError('Quantities must be at least 1')
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await ordersApi.create({
        customer_id: Number(customerId),
        items,
      })
      navigate(`/orders/${res.data.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const getStock = (productId) => {
    const p = products.find((x) => x.id === Number(productId))
    return p ? p.stock : null
  }

  return (
    <div>
      <div className="page-header">
        <h2>New Order</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <h3 style={{ margin: '1rem 0 0.75rem', fontSize: '1rem' }}>Products</h3>

          {lines.map((line, idx) => (
            <div key={idx} className="order-line">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Product</label>
                <select
                  value={line.product_id}
                  onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                >
                  <option value="">Select...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${Number(p.price).toFixed(2)} (stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Qty</label>
                <input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                />
                {line.product_id && getStock(line.product_id) !== null && (
                  <small style={{ color: 'var(--muted)' }}>
                    Available: {getStock(line.product_id)}
                  </small>
                )}
              </div>
              <div />
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => removeLine(idx)}
                disabled={lines.length === 1}
              >
                ×
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
            + Add line
          </button>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Placing order...' : 'Place Order'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/orders')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
