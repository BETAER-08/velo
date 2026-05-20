import { useState } from 'react'
import { Icons } from './Icon'

interface BasePathModalProps {
  current: string
  onConfirm: (path: string) => void
  onClose: () => void
}

export default function BasePathModal({ current, onConfirm, onClose }: BasePathModalProps) {
  const [input, setInput] = useState(current)

  function handleConfirm() {
    if (input.trim()) onConfirm(input.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="basepath-modal-title">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg w-[480px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <span id="basepath-modal-title" className="font-semibold text-sm text-[var(--color-text-primary)]">Base Path</span>
          <button onClick={onClose} aria-label="Close" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {current && (
            <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">Current: {current}</p>
          )}
          <input
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded px-3 py-2 text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-accent)] placeholder-[var(--color-text-muted)]"
            placeholder="~/.velo"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
            autoFocus
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            The directory should contain <span className="font-mono">collections/</span> and <span className="font-mono">environments/</span> subdirectories.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={onClose}
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-1.5 rounded border border-[var(--color-border-default)]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="text-xs bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-3 py-1.5 rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
