import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi, getErrorMessage } from '../services/api'
import Pagination from '../components/Pagination'

export default function Orders() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pageSize = 10

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await ordersApi.list({
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
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
  }, [page, statusFilter])

  const handleExport = async () => {
    try {
      const res = await ordersApi.exportCsv()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'orders.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Orders</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            Export CSV
          </button>
          <Link to="/orders/new" className="btn btn-primary">
            New Order
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}
        >
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No orders yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.customer_name}</td>
                    <td>${Number(o.total_amount).toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge badge-${o.status === 'Completed' ? 'completed' : 'pending'}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/orders/${o.id}`}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </div>
    </div>
  )
}
