import axios from 'axios'

const rawBaseUrl = import.meta.env.VITE_API_URL || '/api'
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$|\s+/g, '')
const baseURL = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
}

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  lowStock: () => api.get('/products/low-stock'),
}

export const customersApi = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
}

export const ordersApi = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  exportCsv: () =>
    api.get('/orders/export/csv', { responseType: 'blob' }),
}

export function getErrorMessage(err) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
  }
  return err.message || 'Something went wrong'
}

export default api
