# Accessibility audit — GadgetStore frontend (Phase 1)

This records the accessibility pass for Phase 1: the method used, the automated
results per page, the one issue found and fixed, and the manual keyboard checks.

## Method

Accessibility was audited with **axe-core 4.x** — the same rules engine that
powers Lighthouse's Accessibility category — run against the live app in a real
browser session (so authenticated pages like the admin panel are audited in
their true logged-in state, which a headless Lighthouse run cannot reach without
a session). Rule sets: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.

Each page was loaded against the running backend, then:

```js
axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] })
```

Colour contrast was additionally verified by computing WCAG contrast ratios from
the theme tokens. Keyboard behaviour and focus were checked manually.

To reproduce the automated audit on the public pages with the Lighthouse CLI:

```bash
# with the dev server running on http://localhost:5173
npx lighthouse http://localhost:5173/ --only-categories=accessibility --view
npx lighthouse http://localhost:5173/login --only-categories=accessibility --view
```

(`axe-core` is included as a devDependency for repeatable audits.)

## Results by page

| Page | Route | Violations | axe passes |
|------|-------|-----------:|-----------:|
| Catalog | `/` | **0** | 21 |
| Product detail | `/products/:id` | **0** | 17 |
| Login | `/login` | **0** (after fix) | 21 |
| Admin — products | `/admin/products` | **0** | 19 |
| Admin — orders (status pills) | `/admin/orders` | **0** (after fix) | 19 |
| Admin — products, delete dialog open | `/admin/products` | **0** | 22 |

No violations remain on any audited page. This corresponds to a Lighthouse
Accessibility score of 100 for the automated checks on these pages.

A second `color-contrast` issue was caught and fixed during the UI redesign:
order status pills rendered their label in the pale semantic colour (~3:1) on a
tinted background; the label colour was darkened toward `--color-ink` (now ≥ 4.5:1)
while keeping the coloured dot and tint.

## Issue found and fixed

**`link-in-text-block` (serious) — links not distinguishable without colour.**
Inline links embedded in paragraphs (e.g. "Create one" on Login, "Browse the
catalog" on the empty cart) were distinguished from surrounding text by colour
alone, failing WCAG 1.4.1 (Use of Color).

*Fix:* added a `.link` utility in `src/styles/theme.css` that underlines inline
text links (`text-decoration: underline; text-underline-offset: 2px`) and
applied it to every in-paragraph link (Login, Register, Product detail, Cart,
Checkout, My orders). Re-audited Login: 0 violations. Navigation links in the
header are not in text blocks and were never affected.

## Manual checks (verified)

- **Labels** — every input is paired with a real `<label>` via the shared
  `Field` component (Login, Register, Profile, admin product form). Icon-only
  quantity buttons carry `aria-label`. axe `label` rule passes on all forms.
- **Images** — product images render through `ProductImage`, which always
  provides meaningful `alt` (the product name) and a labelled placeholder when
  an image is missing. axe `image-alt` passes.
- **Landmarks & headings** — the layout provides one `<header>`/`<nav>`, one
  `<main>`, and one `<footer>`; each page has exactly one `<h1>` (admin sub-pages
  use `<h2>` under the panel's single `<h1>`). axe `region`, `landmark-*`, and
  `page-has-heading-one` pass.
- **Keyboard** — tab order follows DOM order and is logical; every interactive
  element shows a visible accent focus ring (`:focus-visible`, 2px, offset).
- **Dialog** — the delete confirmation (`ConfirmDialog`) uses
  `role="dialog"` + `aria-modal="true"` + `aria-labelledby`, moves focus to the
  confirm button on open, traps Tab within the dialog, closes on Escape, and
  restores focus to the trigger on close. Audited with the dialog open: 0
  violations.
- **Reduced motion** — all transitions are disabled under
  `prefers-reduced-motion: reduce`.

## Colour contrast (WCAG AA)

Measured from the theme tokens against the page background `--color-bg`
(`#f6f7fb`); the last row is button text on the accent fill:

| Foreground | On | Ratio | AA (4.5) |
|------------|----|------:|:--------:|
| `--color-ink` (body text) | bg | 16.7:1 | pass |
| `--color-muted` (secondary) | bg | 5.59:1 | pass |
| `--color-primary` (prices, links) | bg | 5.87:1 | pass |
| `--color-on-primary` (button text) | primary | 6.29:1 | pass |

All text/accent pairings pass AA; body text also meets AAA.

### Dark theme

The app also ships a dark theme (toggle in the nav, defaulting to the OS
setting). It was audited the same way with the same token roles re-pointed to a
dark surface set and a brighter emerald accent: **0 axe violations, 0
colour-contrast issues** on the catalog in dark mode. (Note: when auditing the
*light* theme inside a browser whose OS scheme is dark, Chrome's auto-dark-mode
force-darkens the page and reports false contrast failures — audit the light
theme with the browser in a light scheme.)
