import { useEffect, useRef } from 'react'

interface Shortcuts {
  onSend?: () => void
  onRefresh?: () => void
  onOpenSettings?: () => void
  onCloseModal?: () => void
}

export function useKeyboardShortcuts(s: Shortcuts) {
  const ref = useRef(s)
  useEffect(() => {
    ref.current = s
  })
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const cur = ref.current
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'Enter' && cur.onSend) {
        e.preventDefault()
        cur.onSend()
      } else if (mod && e.key === 'r' && cur.onRefresh) {
        e.preventDefault()
        cur.onRefresh()
      } else if (mod && e.key === ',' && cur.onOpenSettings) {
        e.preventDefault()
        cur.onOpenSettings()
      } else if (e.key === 'Escape' && cur.onCloseModal) {
        cur.onCloseModal()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
