import { useState } from 'react'
import { StatusPill, CategoryPill } from '../components/StatusPill'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { OrderStatus } from '../types'

const STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'cancelled']
const TOKENS = [
  '--color-bg',
  '--color-surface',
  '--color-surface-2',
  '--color-ink',
  '--color-muted',
  '--color-border',
  '--color-primary',
  '--color-on-primary',
]

export default function StyleGuide() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="content-page styleguide">
      <h1 className="page-title">Style guide</h1>
      <p className="muted">
        A living proof of the theme tokens and shared components, in whichever
        theme is active.
      </p>

      <section className="sg-section">
        <h2>Colour tokens</h2>
        <div className="sg-swatches">
          {TOKENS.map((token) => (
            <div key={token} className="sg-swatch card">
              <span
                className="sg-swatch-chip"
                style={{ background: `var(${token})` }}
              />
              <code className="mono">{token}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="sg-section">
        <h2>Buttons</h2>
        <div className="sg-row">
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="btn btn-danger">Danger</button>
          <button className="btn btn-primary" disabled>
            Disabled
          </button>
          <button className="btn btn-primary btn-sm">Small</button>
        </div>
      </section>

      <section className="sg-section">
        <h2>Pills</h2>
        <div className="sg-row">
          {STATUSES.map((s) => (
            <StatusPill key={s} status={s} />
          ))}
          <CategoryPill category="laptop" />
        </div>
      </section>

      <section className="sg-section">
        <h2>Inputs</h2>
        <div className="sg-row sg-inputs">
          <input className="input" placeholder="Text input" />
          <select className="select">
            <option>Select…</option>
          </select>
        </div>
      </section>

      <section className="sg-section">
        <h2>Dialog</h2>
        <button className="btn btn-ghost" onClick={() => setDialogOpen(true)}>
          Open confirm dialog
        </button>
        <ConfirmDialog
          open={dialogOpen}
          title="Delete this item?"
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => setDialogOpen(false)}
          onCancel={() => setDialogOpen(false)}
        />
      </section>

      <section className="sg-section">
        <h2>Typography</h2>
        <h1>Heading 1 — Space Grotesk</h1>
        <h2>Heading 2 — Space Grotesk</h2>
        <p>Body text set in Inter. The quick brown fox jumps over the lazy dog.</p>
        <p className="mono">Mono — JetBrains Mono · 0123456789</p>
      </section>
    </div>
  )
}
