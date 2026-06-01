import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ordersApi, getErrorMessage } from '../services/api'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await ordersApi.get(id)
      setOrder(res.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const handleStatusChange = async (status) => {
    try {
      const res = await ordersApi.updateStatus(id, status)
      setOrder(res.data)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) return <div className="loading">Loading order...</div>
  if (error) return <div className="alert alert-error">{error}</div>
  if (!order) return null

  return (
    <div>
      <div className="page-header">
        <h2>Order #{order.id}</h2>
        <Link to="/orders" className="btn btn-secondary">
          Back to Orders
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <p>
            <strong>Customer:</strong> {order.customer_name}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            <span
              className={`badge badge-${order.status === 'Completed' ? 'completed' : 'pending'}`}
            >
              {order.status}
            </span>
          </p>
          <p>
            <strong>Total:</strong> ${Number(order.total_amount).toFixed(2)}
          </p>
          <p>
            <strong>Placed:</strong> {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        {order.status === 'Pending' && (
          <div style={{ marginBottom: '1rem' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleStatusChange('Completed')}
            >
              Mark Completed
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: '0.5rem' }}
              onClick={() => handleStatusChange('Pending')}
            >
              Keep Pending
            </button>
          </div>
        )}

        <h3 style={{ marginBottom: '0.75rem' }}>Line Items</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{item.product_sku}</td>
                  <td>{item.quantity}</td>
                  <td>${Number(item.unit_price).toFixed(2)}</td>
                  <td>${Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
