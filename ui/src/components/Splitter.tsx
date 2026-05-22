import { useRef, useCallback } from 'react'

interface SplitterProps {
  onResize: (delta: number) => void
  ariaLabel: string
  currentValue?: number
  minValue?: number
  maxValue?: number
}

export default function Splitter({
  onResize,
  ariaLabel,
  currentValue = 0,
  minValue = 0,
  maxValue = 100,
}: SplitterProps) {
  const startX = useRef(0)
  const dragging = useRef(false)
  const moveRef = useRef<((e: MouseEvent) => void) | null>(null)
  const upRef = useRef<(() => void) | null>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      startX.current = ev.clientX
      onResize(delta)
    }

    const handleUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      moveRef.current = null
      upRef.current = null
    }

    moveRef.current = handleMove
    upRef.current = handleUp
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [onResize])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onResize(-16)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onResize(16)
    }
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      aria-valuenow={currentValue}
      aria-valuemin={minValue}
      aria-valuemax={maxValue}
      tabIndex={0}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      className="w-1 shrink-0 bg-[var(--color-border-subtle)] hover:bg-[var(--color-accent)] active:bg-[var(--color-accent)] cursor-col-resize transition-colors focus:bg-[var(--color-accent)]"
    />
  )
}
