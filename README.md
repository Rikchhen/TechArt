# GadgetStore

A full-stack demo e-commerce storefront: a React + TypeScript single-page app
backed by an Express + MongoDB API with session-based authentication.

```
TechArt/
├── backend/    Express + Mongoose API (session auth, products, orders, users)
└── frontend/   React 19 + Vite SPA (catalog, cart, wishlist, checkout, admin)
```

## Features

- **Catalog** — browse, search, filter by category, and sort products.
- **Cart & wishlist** — persisted in the browser (localStorage).
- **Accounts** — register, sign in, sign out (Argon2-hashed passwords, session
  cookies stored in MongoDB).
- **Checkout** — place orders; stock is decremented server-side.
- **Order history** — customers see their own orders; admins see all orders.
- **Admin panel** — create, edit, and delete products.
- **Polish** — light/dark theme (follows the OS by default), toasts, recently
  viewed, an accessibility pass (see `frontend/ACCESSIBILITY.md`), and a
  `/styleguide` route showing the design tokens.

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` (or set `MONGO_URI`)

## Getting started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # then edit if needed
npm run seed                  # creates an admin user + sample products
npm run dev                   # API on http://localhost:5000
```

`npm run seed` (optionally `npm run seed -- <email> <password>`) creates the
default admin and, if the catalog is empty, five sample products.

Default admin credentials:

| Email                       | Password    |
| --------------------------- | ----------- |
| `admin@gadgetstore.local`   | `admin1234` |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # app on http://localhost:5173
```

Vite proxies `/api` to the backend on port 5000 (see `vite.config.ts`), so the
SPA and API are same-origin and the session cookie flows without CORS friction.

Open **http://localhost:5173** and sign in with the admin account above, or
register a new customer account.

## Environment variables (backend/.env)

| Variable         | Default                                    | Notes                          |
| ---------------- | ------------------------------------------ | ------------------------------ |
| `NODE_ENV`       | `development`                              |                                |
| `PORT`           | `5000`                                     | API port                       |
| `MONGO_URI`      | `mongodb://127.0.0.1:27017/gadgetstore`    | MongoDB connection string      |
| `SESSION_SECRET` | —                                          | Required; any random string    |
| `CLIENT_ORIGIN`  | `http://localhost:5173`                    | Allowed CORS origin            |

## API overview

All routes are under `/api`. Auth is a session cookie set on login.

| Method | Route                    | Access   | Description                 |
| ------ | ------------------------ | -------- | --------------------------- |
| POST   | `/auth/register`         | public   | Create a customer account   |
| POST   | `/auth/login`            | public   | Sign in                     |
| POST   | `/auth/logout`           | auth     | Sign out                    |
| GET    | `/auth/me`               | public   | Current user (401 if none)  |
| GET    | `/products`              | public   | List products (paginated)   |
| GET    | `/products/:id`          | public   | Product detail              |
| POST   | `/products`              | admin    | Create a product            |
| PATCH  | `/products/:id`          | admin    | Update a product            |
| DELETE | `/products/:id`          | admin    | Delete a product            |
| POST   | `/orders`                | auth     | Place an order              |
| GET    | `/orders/mine`           | auth     | Current user's orders       |
| GET    | `/orders`                | admin    | All orders                  |
| GET    | `/users/me/profile`      | auth     | Get profile                 |
| PATCH  | `/users/me/profile`      | auth     | Update profile name         |

## Production build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run preview
```

## Docker

Run MongoDB, the Express API, and the React app with Docker Compose:

```bash
# Docker reuses backend/.env; set SESSION_SECRET and optional integration keys there.
docker compose up --build
```

Open **http://localhost:8080**. MongoDB data and uploads persist in Docker
volumes. Use `docker compose down -v` only when you intentionally want to
delete both.

For deployment, change the public URLs in `docker-compose.yml` to the HTTPS
site URL and set `COOKIE_SECURE=true`. A real Khalti callback requires that
public URL; the local Compose URL is only suitable for UI testing.

## Google sign-in and reCAPTCHA

Both integrations are disabled until their keys are added to the existing
`backend/.env` file. No extra Docker environment file is needed: Compose loads
that file directly.

```dotenv
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
# Optional; otherwise APP_URL + /api/auth/google/callback is used.
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback

RECAPTCHA_SITE_KEY=your-recaptcha-v2-checkbox-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-v2-checkbox-secret-key
```

In Google Cloud Console, create a **Web application** OAuth client and register
the Google redirect URI above. For reCAPTCHA, create a **reCAPTCHA v2 Checkbox**
key and add the hostname you use (`localhost` for local Docker). In production,
use your public HTTPS domain for `APP_URL`, the OAuth redirect URI, and the
reCAPTCHA allowed hostname.

## Notes

This is a portfolio/demo project — no real payments are processed and no goods
are shipped. Password reset and email verification screens are UI-only stubs, as
the backend does not implement those flows.
