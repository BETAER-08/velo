import { useEffect } from 'react'

interface Shortcuts {
  onSend?: () => void
  onRefresh?: () => void
  onOpenSettings?: () => void
  onCloseModal?: () => void
}

export function useKeyboardShortcuts(s: Shortcuts) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'Enter' && s.onSend) {
        e.preventDefault()
        s.onSend()
      } else if (mod && e.key === 'r' && s.onRefresh) {
        e.preventDefault()
        s.onRefresh()
      } else if (mod && e.key === ',' && s.onOpenSettings) {
        e.preventDefault()
        s.onOpenSettings()
      } else if (e.key === 'Escape' && s.onCloseModal) {
        s.onCloseModal()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [s])
}
