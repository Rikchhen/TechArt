import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useMe, useLogout } from '../hooks/useAuth'
import { useCart } from '../cart/CartContext'
import { useWishlist } from '../wishlist/WishlistContext'
import { useCompare } from '../compare/CompareContext'
import { useToast } from '../toast/ToastContext'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import { ScrollToTop } from './ScrollToTop'
import { Icon } from './Icon'

function Logo() {
  /*
    TechArt "TA" monogram: an angled T whose right edge is a diagonal slash, and
    an A running parallel to it. The A's counter is a real hole (evenodd), and
    the 6-unit gap between the two glyphs stays parallel at any size. Colours
    come from the theme so it adapts to light/dark automatically.
  */
  return (
    <span className="brand-logo" aria-hidden="true">
      <svg viewBox="0 0 140 100" width="36" height="26">
        {/* T */}
        <path fill="currentColor" d="M0 0 H85 L37 100 H20 V20 H0 Z" />
        {/* A — slightly lighter tone, mirroring the reference lockup */}
        <path
          fill="currentColor"
          fillRule="evenodd"
          opacity="0.78"
          d="M91 0 L140 100 H118 L109 76 H74 L65 100 H43 Z M91 26 L80 56 H102 Z"
        />
      </svg>
    </span>
  )
}

function Wordmark() {
  // "TECH" bold + "ART" light, matching the reference wordmark.
  return (
    <span className="brand-name">
      <span className="brand-tech">TECH</span>
      <span className="brand-art">ART</span>
    </span>
  )
}

function BackButton() {
  const navigate = useNavigate()
  const location = useLocation()

  // Nothing to go back to from the home/catalog page.
  if (location.pathname === '/') return null

  return (
    <button
      type="button"
      className="back-button"
      aria-label="Go back"
      onClick={() => {
        // React Router tracks a history index; if we're at the start (e.g. the
        // page was opened directly), fall back to the catalog instead of leaving.
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
        if (idx > 0) navigate(-1)
        else navigate('/')
      }}
    >
      <Icon name="arrow-left" size={16} />
      Back
    </button>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  )
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return <span className="nav-badge">{count > 99 ? '99+' : count}</span>
}

export function Layout() {
  const { user, isAdmin } = useMe()
  const cart = useCart()
  const wishlist = useWishlist()
  const compare = useCompare()
  const recent = useRecentlyViewed()
  const logout = useLogout()
  const toast = useToast()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout.mutateAsync()
    // Cart/wishlist/recently-viewed live in this browser, not on the account.
    // Clear them on sign-out so the next person to log in starts fresh.
    cart.clear()
    wishlist.clear()
    recent.clear()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="app-shell">
      <ScrollToTop />
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container site-header-inner">
          <Link to="/" className="brand" aria-label="TechArt home">
            <Logo />
            <Wordmark />
          </Link>

          <nav className="main-nav" aria-label="Primary">
            <NavLink to="/" end className="nav-link">
              Catalog
            </NavLink>
            <NavLink to="/about" className="nav-link">
              About
            </NavLink>
            <NavLink to="/faq" className="nav-link">
              FAQ
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className="nav-link nav-link-admin">
                Admin
              </NavLink>
            )}
          </nav>

          <div className="header-actions">
            <ThemeToggle />

            <NavLink to="/compare" className="icon-btn" aria-label="Compare">
              <Icon name="compare" />
              <CountBadge count={compare.count} />
            </NavLink>

            <NavLink to="/wishlist" className="icon-btn" aria-label="Wishlist">
              <Icon name="heart" />
              <CountBadge count={wishlist.count} />
            </NavLink>

            <NavLink to="/cart" className="icon-btn" aria-label="Cart">
              <Icon name="cart" />
              <CountBadge count={cart.count} />
            </NavLink>

            {user ? (
              <div className="user-menu">
                <NavLink to="/profile" className="user-chip" aria-label="Your profile">
                  <Icon name="user" size={18} />
                  <span className="user-name">{user.name.split(' ')[0]}</span>
                </NavLink>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleLogout}
                  disabled={logout.isPending}
                  aria-label="Sign out"
                >
                  <Icon name="log-out" size={16} />
                  <span className="sign-out-label">Sign out</span>
                </button>
              </div>
            ) : (
              <div className="user-menu">
                <NavLink to="/login" className="btn btn-ghost btn-sm">
                  Sign in
                </NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm">
                  Sign up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {user && !user.emailVerified && (
        <div className="verify-banner" role="status">
          <div className="container verify-banner-inner">
            <Icon name="alert-triangle" size={17} />
            <span>
              Your email isn't verified yet — confirm it to secure your account.
            </span>
            <Link to="/verify-email" className="btn btn-sm verify-banner-btn">
              Verify now
            </Link>
          </div>
        </div>
      )}

      <main id="main" className="site-main">
        <div className="container">
          <BackButton />
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <div className="footer-brand">
            <Link to="/" className="brand" aria-label="TechArt home">
              <Logo />
              <Wordmark />
            </Link>
            <p className="muted footer-tag">
              A demo storefront built with React, Vite &amp; Express.
            </p>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            <Link to="/" className="nav-link">
              Catalog
            </Link>
            <Link to="/about" className="nav-link">
              About
            </Link>
            <Link to="/faq" className="nav-link">
              FAQ
            </Link>
            {user && (
              <Link to="/orders" className="nav-link">
                My orders
              </Link>
            )}
          </nav>
        </div>
        <div className="container footer-legal muted">
          © {new Date().getFullYear()} TechArt. Demo project — no real orders are
          fulfilled.
        </div>
      </footer>
    </div>
  )
}
