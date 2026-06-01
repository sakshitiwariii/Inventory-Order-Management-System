import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi, productsApi, getErrorMessage } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, lowRes] = await Promise.all([
          dashboardApi.getStats(),
          productsApi.lowStock(),
        ])
        setStats(statsRes.data)
        setLowStock(lowRes.data.items || [])
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="loading">Loading dashboard...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: 8 }}>Welcome back</h3>
        <p style={{ marginBottom: 12, color: '#6b7280' }}>
          Quick actions to get started. View products, manage orders, or add customers.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/products" className="btn btn-primary">Products</Link>
          <Link to="/orders" className="btn btn-secondary">Orders</Link>
          <Link to="/customers" className="btn btn-secondary">Customers</Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Products</div>
          <div className="value">{stats.total_products}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Customers</div>
          <div className="value">{stats.total_customers}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Orders</div>
          <div className="value">{stats.total_orders}</div>
        </div>
        <div className={`stat-card ${stats.low_stock_count > 0 ? 'warning' : ''}`}>
          <div className="label">Low Stock Products</div>
          <div className="value">{stats.low_stock_count}</div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Low Stock Alert</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id} className="low-stock">
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>
                      {p.stock}{' '}
                      <span className="badge badge-low">Low</span>
                    </td>
                    <td>
                      <Link to="/products">Update stock</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
