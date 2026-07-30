# GadgetStore — frontend

React 19 + TypeScript + Vite single-page app for the GadgetStore demo. See the
[root README](../README.md) for full setup; this covers the frontend only.

## Scripts

```bash
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # type-check (tsc -b) and build for production
npm run preview   # preview the production build
npm run lint      # oxlint
```

The dev server proxies `/api` to the backend on `http://localhost:5000`
(`vite.config.ts`), so start the backend first.

## Stack

- **React Router** for routing, with `RequireAuth` / `RequireRole` route guards.
- **TanStack Query** for all server state (products, orders, auth, profile).
- **Axios** client (`src/api/`) with a shared instance and typed API modules.
- **Tailwind v4** plus a token-driven theme in `src/styles/theme.css` and
  component styles in `src/styles/components.css`.
- **Zod** for client-side form validation, **zxcvbn** for password strength.
- Cart, wishlist, recently-viewed, toasts, and theme are React contexts;
  cart/wishlist/recently-viewed persist to `localStorage`.

## Structure

```
src/
├── api/          axios client + typed endpoint modules
├── cart/         cart context (localStorage)
├── wishlist/     wishlist context (localStorage)
├── toast/        toast notifications
├── hooks/        useAuth, useTheme, useRecentlyViewed
├── lib/          queryClient, formatting helpers
├── components/   Layout, guards, ProductCard, Field, ConfirmDialog, …
├── pages/        route views (+ pages/admin for the admin panel)
├── styles/       theme.css (tokens) + components.css
├── types.ts      shared domain types (mirror the API)
├── App.tsx       routes
└── main.tsx      providers + bootstrap
```

## Accessibility

The app targets WCAG 2.1 AA. See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for the
audit method, per-page results, and the theme contrast table. A dev-only
`/styleguide` route renders the tokens and shared components in the active theme.
