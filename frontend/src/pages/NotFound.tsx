import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="notfound-page">
      <p className="notfound-code">404</p>
      <h1 className="page-title">Page not found</h1>
      <p className="muted">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="btn btn-primary">
        Back to catalog
      </Link>
    </div>
  )
}
