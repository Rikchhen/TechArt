import { NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="admin">
      <h1 className="page-title">Admin</h1>
      <nav className="admin-tabs" aria-label="Admin sections">
        <NavLink to="/admin/dashboard" className="admin-tab">
          Dashboard
        </NavLink>
        <NavLink to="/admin/products" className="admin-tab">
          Products
        </NavLink>
        <NavLink to="/admin/orders" className="admin-tab">
          Orders
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
