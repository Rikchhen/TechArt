import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/*
  React Router doesn't reset scroll on navigation. Without this, clicking e.g.
  the cart icon while scrolled down a long catalog leaves the window parked past
  the (often shorter) next page — so it looks like nothing happened until a
  refresh loads the document at the top. Reset to the top on every path change.
*/
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}
