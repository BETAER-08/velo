import { type HeaderRow } from '../types'
import { Icons } from './Icon'

interface EnvModalProps {
  envName: string
  rows: HeaderRow[]
  onChange: (rows: HeaderRow[]) => void
  onSave: () => void
  onClose: () => void
}

export default function EnvModal({
  envName,
  rows,
  onChange,
  onSave,
  onClose,
}: EnvModalProps) {
  function addRow() {
    onChange([...rows, { key: '', value: '' }])
  }

  function removeRow(i: number) {
    onChange(rows.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, field: 'key' | 'value', val: string) {
    onChange(rows.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)))
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="env-modal-title">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg w-[500px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <span id="env-modal-title" className="font-semibold text-sm text-[var(--color-text-primary)]">Edit environment: {envName}</span>
          <button onClick={onClose} aria-label="Close" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded px-2 py-1 text-xs font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] placeholder-[var(--color-text-muted)]"
                placeholder="key"
                value={row.key}
                onChange={e => updateRow(i, 'key', e.target.value)}
                aria-label={`Variable ${i + 1} key`}
              />
              <input
                className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded px-2 py-1 text-xs font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] placeholder-[var(--color-text-muted)]"
                placeholder="value"
                value={row.value}
                onChange={e => updateRow(i, 'value', e.target.value)}
                aria-label={`Variable ${i + 1} value`}
              />
              <button
                onClick={() => removeRow(i)}
                aria-label={`Remove variable ${i + 1}`}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] p-1 rounded hover:bg-[var(--color-bg-elevated)]"
              >
                <Icons.Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)] italic">No variables</p>
          )}
        </div>
        <div className="flex justify-between items-center px-4 py-3 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={addRow}
            className="flex items-center gap-1 text-xs text-[var(--color-accent-hover)] hover:text-[var(--color-accent)]"
            aria-label="Add variable"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            Add row
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-1.5 rounded border border-[var(--color-border-default)]"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="text-xs bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-3 py-1.5 rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
