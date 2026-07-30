import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="content-page">
      <h1 className="page-title">About TechArt</h1>
      <div className="card content-card">
        <p>
          TechArt is a demo e-commerce storefront built to show a complete,
          production-shaped stack end to end: a React + Vite + TypeScript single
          page app talking to an Express + MongoDB API with session-based auth.
        </p>
        <h2>What you can do</h2>
        <ul className="content-list">
          <li>Browse, search, filter and sort a catalog of gadgets.</li>
          <li>Save favourites to a wishlist and build up a cart.</li>
          <li>Create an account, sign in, and place orders.</li>
          <li>Review your order history and manage your profile.</li>
          <li>
            Admins get a dashboard to manage products and view all orders.
          </li>
        </ul>
        <h2>Under the hood</h2>
        <ul className="content-list">
          <li>
            <strong>Frontend:</strong> React 19, React Router, TanStack Query,
            Tailwind, Zod, with a light/dark theme and an accessibility pass.
          </li>
          <li>
            <strong>Backend:</strong> Express, Mongoose, Argon2 password hashing,
            and session cookies stored in MongoDB.
          </li>
        </ul>
        <p className="muted">
          It's a portfolio-style project — no real payments are processed and no
          goods are shipped.
        </p>
        <Link to="/" className="btn btn-primary">
          Browse the catalog
        </Link>
      </div>
    </div>
  )
}
