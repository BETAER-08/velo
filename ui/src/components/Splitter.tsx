import { useRef, useCallback } from 'react'

interface SplitterProps {
  onResize: (delta: number) => void
  orientation?: 'vertical'
  ariaLabel: string
}

export default function Splitter({ onResize, ariaLabel }: SplitterProps) {
  const startX = useRef(0)
  const dragging = useRef(false)

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return
    const delta = e.clientX - startX.current
    startX.current = e.clientX
    onResize(delta)
  }, [onResize])

  const onMouseUp = useCallback(() => {
    dragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [onMouseMove, onMouseUp])

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
      tabIndex={0}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      className="w-1 shrink-0 bg-[var(--color-border-subtle)] hover:bg-[var(--color-accent)] active:bg-[var(--color-accent)] cursor-col-resize transition-colors focus:bg-[var(--color-accent)]"
    />
  )
}
