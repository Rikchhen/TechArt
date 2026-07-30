import { useState } from 'react'
import { Icon } from '../components/Icon'

interface QA {
  q: string
  a: string
}

const FAQS: QA[] = [
  {
    q: 'Is this a real store?',
    a: "No — TechArt is a demo project. You can create an account and place orders, but no payment is taken and nothing is shipped.",
  },
  {
    q: 'How do I place an order?',
    a: 'Add products to your cart, then go to checkout. You need to be signed in; placing the order records it on your account and reduces product stock.',
  },
  {
    q: 'Do I need an account to browse?',
    a: 'No. Browsing the catalog, searching, and building a cart or wishlist all work without signing in. You only need an account to check out.',
  },
  {
    q: 'Where is my cart and wishlist stored?',
    a: 'In your browser (localStorage), so they persist across visits on the same device without a server round-trip.',
  },
  {
    q: 'How do I become an admin?',
    a: 'The backend seed script creates an admin account. Admins see an Admin link in the header for managing products and viewing all orders.',
  },
  {
    q: 'Can I change my email or reset my password?',
    a: 'Profile name updates are supported. Email changes and password reset are UI stubs in this demo and are not wired to a backend service.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="content-page">
      <h1 className="page-title">Frequently asked questions</h1>
      <div className="faq-list">
        {FAQS.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i} className="faq-item card">
              <button
                className="faq-question"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <span className={`faq-chevron ${isOpen ? 'is-open' : ''}`}>
                  <Icon name="chevron-down" size={20} />
                </span>
              </button>
              {isOpen && <p className="faq-answer muted">{item.a}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
