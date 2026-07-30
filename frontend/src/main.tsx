import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

import './styles/theme.css'
import './styles/components.css'
import './styles/icons.css'
import './styles/features.css'
import './styles/security.css'
import './styles/forms.css'
import './styles/payment.css'
import App from './App.tsx'
import { queryClient } from './lib/queryClient.ts'
import { CartProvider } from './cart/CartContext.tsx'
import { WishlistProvider } from './wishlist/WishlistContext.tsx'
import { CompareProvider } from './compare/CompareContext.tsx'
import { ToastProvider } from './toast/ToastContext.tsx'
import { RecentlyViewedProvider } from './hooks/useRecentlyViewed.tsx'
import { getInitialTheme } from './hooks/useTheme.ts'
import { ensureCsrfToken } from './api/client.ts'

// Resolve the theme before first paint so there is no light/dark flash.
document.documentElement.setAttribute('data-theme', getInitialTheme())

// Prime the CSRF token as early as possible (mutations retry if it isn't ready).
void ensureCsrfToken()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/*
        BrowserRouter must sit ABOVE the context providers. If a provider is an
        ancestor of the Router, a provider state update (e.g. cart.add) fired in
        the same tick as a navigate() clobbers the Router's pending location —
        the URL changes but the view doesn't update until a manual refresh.
      */}
      <BrowserRouter>
        <ToastProvider>
          <RecentlyViewedProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <App />
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </RecentlyViewedProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
