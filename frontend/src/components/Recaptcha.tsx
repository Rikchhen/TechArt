import { useEffect, useId, useRef } from 'react'

declare global {
  interface Window {
    grecaptcha?: {
      render: (element: string | HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        'expired-callback': () => void
      }) => number
    }
  }
}

let loader: Promise<void> | undefined

function loadRecaptcha() {
  if (window.grecaptcha) return Promise.resolve()
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Could not load reCAPTCHA'))
      document.head.appendChild(script)
    })
  }
  return loader
}

export function Recaptcha({ siteKey, onToken }: { siteKey?: string; onToken: (token?: string) => void }) {
  const elementId = useId().replace(/:/g, '')
  const rendered = useRef(false)

  useEffect(() => {
    if (!siteKey || rendered.current) return
    loadRecaptcha()
      .then(() => {
        if (rendered.current || !window.grecaptcha) return
        window.grecaptcha.render(elementId, {
          sitekey: siteKey,
          callback: onToken,
          'expired-callback': () => onToken(undefined),
        })
        rendered.current = true
      })
      .catch(() => onToken(undefined))
  }, [elementId, onToken, siteKey])

  if (!siteKey) return null
  return <div id={elementId} className="recaptcha" />
}
