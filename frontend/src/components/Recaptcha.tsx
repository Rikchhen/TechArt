import { useEffect, useId, useRef } from 'react'

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
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
  if (window.grecaptcha?.render) return Promise.resolve()
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
    let cancelled = false

    const doRender = () => {
      if (cancelled || rendered.current || !window.grecaptcha) return
      const el = document.getElementById(elementId)
      if (!el) return
      window.grecaptcha.render(el, {
        sitekey: siteKey,
        callback: onToken,
        'expired-callback': () => onToken(undefined),
      })
      rendered.current = true
    }

    loadRecaptcha()
      .then(() => {
        // The script's onload fires before the API is fully initialized, so
        // calling render() immediately throws and leaves an empty box. ready()
        // defers until grecaptcha is actually usable.
        if (window.grecaptcha?.ready) window.grecaptcha.ready(doRender)
        else doRender()
      })
      .catch(() => onToken(undefined))

    return () => {
      cancelled = true
    }
  }, [elementId, onToken, siteKey])

  if (!siteKey) return null
  return <div id={elementId} className="recaptcha" />
}
