import { NavLink } from 'react-router-dom'

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1>Inventory</h1>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Dashboard
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Products
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Customers
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Orders
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
