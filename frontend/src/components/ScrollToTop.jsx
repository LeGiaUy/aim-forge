import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Khi đổi pathname, đưa viewport về đầu trang (SPA không reload).
 * Không gắn `search` để tránh giật khi chỉ đổi ?q= trên cùng trang.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
