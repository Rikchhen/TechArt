// Prices are in Nepalese Rupees (matches the Khalti payment flow). Intl's NPR
// symbol varies by platform, so we format the number with grouping + 2 decimals
// and prefix a plain "Rs" for a consistent look everywhere.
const amount = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatPrice(value: number): string {
  return `Rs ${amount.format(value)}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Short id suffix for display, e.g. "…a1b2c3". */
export function shortId(id: string): string {
  return id.slice(-6)
}
